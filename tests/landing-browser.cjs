/* Real local-file navigation and responsive tests. Uses an isolated offline profile. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const app = path.resolve(process.env.OLD_APP_DIR || path.join(__dirname, '..'));
  const output = process.env.OLD_QA_DIR || await fs.mkdtemp(path.join(os.tmpdir(), 'our-little-days-landing-'));
  await fs.mkdir(output, { recursive: true });
  const profile = await fs.mkdtemp(path.join(output, 'landing-profile-'));
  const context = await chromium.launchPersistentContext(profile, { channel: process.env.OLD_BROWSER_CHANNEL || 'chrome', headless: true, offline: true, reducedMotion: 'reduce', viewport: { width: 1440, height: 1120 } });
  const page = context.pages()[0]; page.setDefaultTimeout(20000);
  const errors = [], requests = [], passed = [];
  const watch = p => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); p.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); }); };
  watch(page);
  await context.addInitScript(() => {
    if (location.pathname.endsWith('/landing.html')) {
      window.__storageTouches = [];
      indexedDB.open = () => { window.__storageTouches.push('indexedDB'); throw new Error('Landing page must not open project data.'); };
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (...args) { window.__storageTouches.push('storage write'); return set.apply(this, args); };
    }
  });
  const url = pathToFileURL(path.join(app, 'landing.html')).href;
  const appURL = pathToFileURL(path.join(app, 'index.html')).href;
  const check = async (name, fn) => { await fn(); passed.push(name); console.log('PASS ' + name); };
  const visit = async () => { await page.goto(url); await page.locator('#landing-hero-image').waitFor(); await page.waitForFunction(() => document.querySelector('#landing-hero-image').naturalWidth > 0); };
  const ready = route => page.waitForFunction(r => document.querySelector('nav a[aria-current="page"]')?.getAttribute('href') === '#' + r, route);
  const saved = () => page.waitForFunction(() => document.querySelector('#book-save-status')?.textContent === 'All changes saved');
  const state = () => page.evaluate(async () => (await OLDStore.load()).data);
  const shot = name => page.screenshot({ path: path.join(output, name + '.png'), fullPage: true, animations: 'disabled' });
  try {
    await visit();
    await check('landing opens directly offline without opening or writing personal project data', async () => {
      assert.match(await page.title(), /Our Little Days.*beautiful story/);
      assert.equal(await page.locator('h1').innerText(), 'Little days.\nA beautiful story.');
      assert.deepEqual(await page.evaluate(() => window.__storageTouches), []);
      assert.equal(await page.evaluate(() => typeof OLDStore), 'undefined');
      assert.equal(await page.evaluate(() => typeof OLD_MEDIA), 'undefined');
      assert.deepEqual(await page.evaluate(() => indexedDB.databases()), []);
    });
    await check('licensed hero is a separate bundled photograph, distinct from every demo image', async () => {
      const manifest = JSON.parse((await fs.readFile(path.join(app, 'assets/landing/manifest.json'), 'utf8')).replace(/^\uFEFF/, ''));
      const sandbox = { window: {} }; vm.runInNewContext(await fs.readFile(path.join(app, 'assets/media.js'), 'utf8'), sandbox);
      const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
      const demoHashes = Object.values(sandbox.window.OLD_MEDIA).map(data => digest(Buffer.from(data.split(',')[1], 'base64')));
      for (const asset of manifest) {
        const bytes = await fs.readFile(path.join(app, 'assets/landing', asset.file));
        assert.equal(digest(bytes), asset.sha256); assert.ok(!demoHashes.includes(asset.sha256));
        assert.equal(asset.license, 'https://unsplash.com/license'); assert.equal(asset.creator, 'Tunafish');
      }
      assert.equal(await page.locator('#landing-hero-image').getAttribute('src'), 'assets/landing/seaside-hero.jpg');
      assert.deepEqual(await page.locator('#landing-hero-image').evaluate(img => [img.naturalWidth, img.naturalHeight]), [2800, 1867]);
      assert.equal(await page.locator('#landing-hero-image').evaluate(img => getComputedStyle(img).filter), 'none');
    });
    await check('section navigation scrolls each heading below the sticky header', async () => {
      for (const [label, id] of [['The experience', 'experience'], ['Memory Book', 'memory-book'], ['Made for two', 'made-for-two']]) {
        await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click();
        assert.equal(new URL(page.url()).hash, '#' + id);
        const box = await page.locator('#' + id).boundingBox(), header = await page.locator('.site-header').boundingBox();
        assert.ok(box.y >= header.y + header.height - 2); assert.ok(box.y < 250);
      }
      await page.getByRole('link', { name: 'Back to top', exact: true }).click();
      assert.ok(await page.evaluate(() => scrollY < 5));
    });
    await check('every primary and feature action opens the correct real app section', async () => {
      await visit(); const links = await page.locator('a[href^="index.html#"]').evaluateAll(nodes => nodes.map((n, i) => ({ i, hash: n.hash })));
      assert.equal(links.length, 7);
      for (const link of links) {
        await visit(); await page.locator('a[href^="index.html#"]').nth(link.i).click();
        assert.ok(page.url().startsWith(appURL)); assert.equal(new URL(page.url()).hash, link.hash);
        await ready(link.hash.slice(1));
      }
    });
    await check('app sidebar and mobile Settings provide working return paths to the landing page', async () => {
      await page.goto(appURL + '#home'); await ready('home');
      await page.locator('.sidebar-foot').getByRole('link', { name: 'About Our Little Days', exact: false }).click();
      await page.waitForURL(url); assert.equal(await page.locator('#hero-title').count(), 1);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole('link', { name: 'Explore settings & backup', exact: true }).click(); await ready('settings');
      await page.locator('main').getByRole('link', { name: 'About Our Little Days', exact: false }).click(); await page.waitForURL(url);
      await page.setViewportSize({ width: 1440, height: 1120 });
    });
    let editedBook, unchangedMemories;
    await check('leaving the editor for the landing page flushes the latest text edit and preserves the draft', async () => {
      await page.getByRole('link', { name: 'Open Memory Book', exact: false }).click(); await ready('collection');
      await page.getByRole('button', { name: 'Create Memory Book', exact: true }).click();
      await page.locator('#book-page-canvas[data-page-id]').waitFor(); await saved();
      unchangedMemories = (await state()).memories;
      await page.getByRole('button', { name: 'Edit text: Our days, together', exact: true }).click();
      await page.getByLabel('Edit page text', { exact: true }).fill('A story we can return to');
      // Leave immediately, before the 450ms autosave debounce has elapsed.
      await page.locator('.sidebar-foot a[data-action="go-landing"]').click(); await page.waitForURL(url);
      await page.getByRole('link', { name: 'Open Memory Book', exact: false }).click(); await ready('collection');
      await page.locator('#book-page-canvas[data-page-id]').waitFor();
      editedBook = (await state()).memoryBook;
      assert.ok(editedBook.pages[0].elements.some(e => e.text === 'A story we can return to'));
      assert.deepEqual((await state()).memories, unchangedMemories);
    });
    await check('three style controls change the illustrative preview without changing the saved book', async () => {
      await page.locator('.sidebar-foot a[data-action="go-landing"]').click(); await page.waitForURL(url);
      for (const [key, label, color] of [['blue', 'Blue Memories', 'rgb(231, 242, 251)'], ['film', 'Film Diary', 'rgb(245, 245, 243)'], ['summer', 'Pure Summer', 'rgb(255, 255, 255)']]) {
        await page.getByRole('button', { name: label, exact: true }).click();
        assert.equal(await page.locator('#style-preview').getAttribute('data-theme'), key);
        assert.equal(await page.locator('.style-options [aria-pressed="true"]').count(), 1);
        assert.equal(await page.locator('.paper').first().evaluate(el => getComputedStyle(el).backgroundColor), color);
        assert.match(await page.locator('#style-status').innerText(), /saved book has not changed/);
      }
      assert.deepEqual(await page.evaluate(() => window.__storageTouches), []);
      await page.getByRole('link', { name: 'Open Memory Book', exact: false }).click(); await ready('collection');
      assert.deepEqual((await state()).memoryBook, editedBook);
    });
    await check('failed book saves block the new landing-page navigation and keep the edit recoverable', async () => {
      await page.evaluate(() => { OLDStore.save = async () => { throw new Error('Test storage failure.'); }; });
      await page.getByRole('button', { name: 'Edit text: A story we can return to', exact: true }).click();
      await page.getByLabel('Edit page text', { exact: true }).fill('An unsaved page');
      await page.locator('.sidebar-foot a[data-action="go-landing"]').click();
      await page.waitForFunction(() => document.querySelector('#book-save-status')?.textContent === 'Changes not saved');
      assert.equal(page.url(), appURL + '#collection'); assert.deepEqual((await state()).memoryBook, editedBook);
      assert.equal(await page.getByRole('button', { name: 'Download draft backup', exact: true }).isVisible(), true);
      page.once('dialog', dialog => dialog.accept()); await page.reload(); await ready('collection');
    });
    await check('landing layouts and navigation work at desktop, tablet, and small-phone widths', async () => {
      for (const width of [1698, 1440, 1024, 768, 390, 320]) {
        await page.setViewportSize({ width, height: width < 600 ? 844 : 1120 }); await visit();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow at ${width}`);
        for (const id of ['experience', 'memory-book', 'made-for-two']) {
          await page.locator(`nav a[href="#${id}"]`).click();
          assert.ok((await page.locator('#' + id).boundingBox()).y >= (await page.locator('.site-header').boundingBox()).height - 2);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        }
        await page.getByRole('button', { name: 'Film Diary', exact: true }).click();
        assert.equal(await page.locator('#style-preview').getAttribute('data-theme'), 'film');
        if (width === 390) { await page.getByRole('button', { name: 'Pure Summer', exact: true }).click(); await page.locator('.wordmark').click(); await shot('landing-mobile'); }
      }
      await page.setViewportSize({ width: 1440, height: 1120 }); await visit(); await shot('landing-desktop');
    });
    await check('keyboard navigation, style selection, and offline photo credits are functional', async () => {
      await visit(); await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Skip to content');
      await page.keyboard.press('Enter'); assert.equal(new URL(page.url()).hash, '#main');
      await page.getByRole('button', { name: 'Blue Memories', exact: true }).focus(); await page.keyboard.press('Space');
      assert.equal(await page.locator('#style-preview').getAttribute('data-theme'), 'blue');
      await page.locator('#photo-credits summary').focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('#photo-credits').evaluate(el => el.open), true);
      assert.match(await page.locator('.credit-copy').innerText(), /Tunafish/);
      assert.match(await page.locator('.credit-copy').innerText(), /work offline/);
    });
    await check('reduced motion disables entrance, scroll, and reveal movement; normal reveals finish', async () => {
      await visit();
      assert.equal(await page.locator('.hero-copy').evaluate(el => getComputedStyle(el).animationName), 'none');
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
      assert.equal(await page.locator('.is-pending').count(), 0);
      await page.emulateMedia({ reducedMotion: 'no-preference' }); await visit();
      await page.locator('nav a[href="#memory-book"]').click();
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.book-copy')).opacity === '1');
      assert.notEqual(await page.locator('.hero-copy').evaluate(el => getComputedStyle(el).animationName), 'none');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => !document.querySelector('.is-pending'));
      assert.equal(await page.locator('.is-pending').count(), 0);
    });
    await check('landing content and native links remain usable when JavaScript is disabled', async () => {
      const browser = await chromium.launch({ channel: process.env.OLD_BROWSER_CHANNEL || 'chrome', headless: true });
      const noJS = await browser.newContext({ offline: true, javaScriptEnabled: false, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      const staticPage = await noJS.newPage(); watch(staticPage);
      try {
        await staticPage.goto(url); assert.equal(await staticPage.locator('#hero-title').isVisible(), true);
        assert.equal(await staticPage.locator('.style-picker').isVisible(), false);
        await staticPage.getByRole('navigation').getByRole('link', { name: 'Memory Book', exact: true }).click();
        assert.equal(new URL(staticPage.url()).hash, '#memory-book'); assert.equal(await staticPage.locator('#book-title').isVisible(), true);
        await staticPage.locator('#photo-credits summary').click(); assert.equal(await staticPage.locator('.credit-copy').isVisible(), true);
        assert.equal(await staticPage.locator('.hero-actions .button').getAttribute('href'), 'index.html#home');
      } finally { await browser.close(); }
    });
    await check('no external requests, script errors, or console errors occur during landing and app navigation', async () => {
      assert.deepEqual(errors, []); assert.deepEqual(requests, []);
    });
    await fs.writeFile(path.join(output, 'landing-results.json'), JSON.stringify({ count: passed.length, passed, errors, externalRequests: requests, app, offline: true }, null, 2));
    console.log(`\n${passed.length} landing workflows passed. Evidence: ${output}`);
  } catch (error) { try { await shot('landing-failure'); } catch {} console.error(error); process.exitCode = 1; }
  finally { await context.close(); }
})();

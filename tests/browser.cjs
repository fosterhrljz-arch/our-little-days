/* Real offline browser workflows. Run with a locally installed Playwright and Chrome. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const C = require('../js/core.js');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { console.error('Playwright is needed only for browser tests. See README.md for setup.'); process.exit(1); }

(async () => {
  const app = path.resolve(process.env.OLD_APP_DIR || path.join(__dirname, '..'));
  const output = process.env.OLD_QA_DIR || await fs.mkdtemp(path.join(os.tmpdir(), 'our-little-days-qa-'));
  await fs.mkdir(output, { recursive: true });
  const profile = await fs.mkdtemp(path.join(output, 'browser-profile-'));
  const options = { channel: process.env.OLD_BROWSER_CHANNEL || 'chrome', headless: true, downloadsPath: path.join(output, 'downloads'), viewport: { width: 1698, height: 1132 }, offline: true, acceptDownloads: true, reducedMotion: 'reduce' };
  let context = await chromium.launchPersistentContext(profile, options);
  let page = context.pages()[0] || await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [], requests = [], passed = [];
  const observe = p => { p.on('pageerror', error => errors.push(error.message)); p.on('console', message => { if (message.type() === 'error') errors.push(message.text()); }); p.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); }); };
  observe(page);
  const url = pathToFileURL(path.join(app, 'index.html')).href;
  const check = async (name, fn) => { await fn(); passed.push(name); console.log(`PASS ${name}`); };
  const go = async route => { await page.locator(`nav a[href="#${route}"]`).click(); await page.waitForFunction(r => document.querySelector('nav a[aria-current="page"]')?.getAttribute('href') === '#' + r, route); };
  const shot = name => page.screenshot({ path: path.join(output, name + '.png'), fullPage: true, animations: 'disabled' });
  const restore = async data => {
    await go('settings');
    await page.locator('#restore-file').setInputFiles({ name: 'book.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'Our Little Days', data })) });
    await page.getByRole('button', { name: 'Replace & restore' }).click();
    await page.locator('dialog').waitFor({ state: 'hidden' });
  };
  try {
    await page.goto(url);
    await page.locator('.hero').waitFor();
    await check('direct-file app opens offline with four demo memories and decoded local photos', async () => {
      assert.match(page.url(), /^file:/); assert.equal(await page.title(), 'Home · Our Little Days');
      assert.equal(await page.locator('.memory-card').count(), 4);
      await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
      assert.ok(await page.locator('.duration-number').innerText());
      await shot('home-desktop');
    });
    await check('all five sections render with active navigation and no desktop overflow', async () => {
      for (const route of ['memories', 'anniversaries', 'collection', 'settings', 'home']) {
        await go(route);
        assert.equal(await page.locator('nav a[aria-current="page"]').getAttribute('href'), '#' + route);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, route);
        if (route !== 'collection') await shot(route + '-desktop');
      }
    });
    await check('memory detail browses multiple photos and Escape restores focus', async () => {
      await page.getByRole('button', { name: 'Open Our First Trip', exact: true }).click();
      assert.match(await page.locator('dialog').innerText(), /Photo 1 of 2/);
      const first = await page.locator('.detail-photo').getAttribute('src');
      await page.getByRole('button', { name: 'Next photo', exact: true }).click();
      assert.match(await page.locator('dialog').innerText(), /Photo 2 of 2/);
      assert.notEqual(await page.locator('.detail-photo').getAttribute('src'), first);
      await page.keyboard.press('Escape'); assert.equal(await page.locator('dialog').isVisible(), false);
      assert.equal(await page.getByRole('button', { name: 'Open Our First Trip', exact: true }).evaluate(el => el === document.activeElement), true);
    });
    const png = Buffer.from(await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 80; c.height = 60; const ctx = c.getContext('2d'); ctx.fillStyle = '#8ec9eb'; ctx.fillRect(0, 0, 80, 60); return c.toDataURL('image/png').split(',')[1]; }), 'base64');
    const upload = name => ({ name, mimeType: 'image/png', buffer: png });
    await check('new memory requires photos; real upload accepts two images and saves', async () => {
      await page.getByRole('button', { name: 'Add Memory', exact: true }).click();
      await page.getByLabel('Title', { exact: true }).fill('A quiet test day');
      await page.getByLabel('A little note').fill('Two photos, a real note, and an offline save.');
      await page.getByRole('button', { name: 'Save memory', exact: true }).click();
      assert.match(await page.locator('dialog .inline-error').innerText(), /1–12 photos/);
      await page.locator('#memory-photos').setInputFiles([upload('blue.png'), upload('sky.png')]);
      await page.waitForFunction(() => document.querySelector('#photo-count')?.textContent === '2 of 12 photos');
      await page.getByRole('button', { name: 'Save memory', exact: true }).click();
      await page.locator('dialog').waitFor({ state: 'hidden' });
      await go('memories');
      assert.equal(await page.getByRole('button', { name: 'Open A quiet test day', exact: true }).count(), 1);
    });
    await check('reload retains memory photos and note in IndexedDB', async () => {
      await page.reload(); await page.getByRole('button', { name: 'Open A quiet test day', exact: true }).click();
      assert.match(await page.locator('.detail-note').innerText(), /offline save/);
      assert.match(await page.locator('.gallery-controls').innerText(), /1 of 2/);
    });
    await check('edit memory, reorder/remove photos, and render markup as text', async () => {
      await page.getByRole('button', { name: 'Edit memory', exact: true }).click();
      await page.getByLabel('Title', { exact: true }).fill('<b>Our quiet day</b>');
      await page.getByRole('button', { name: 'Make this the first photo' }).click();
      await page.getByRole('button', { name: 'Remove photo 2' }).click();
      await page.getByRole('button', { name: 'Save memory', exact: true }).click();
      await page.locator('dialog').waitFor({ state: 'hidden' });
      const card = page.getByRole('button', { name: 'Open <b>Our quiet day</b>', exact: true });
      assert.equal(await card.locator('b').count(), 0); await card.click();
      assert.equal(await page.locator('.gallery-controls').count(), 0);
      await page.getByRole('button', { name: 'Close dialog' }).click();
    });
    await check('memory sort changes the real card order', async () => {
      await page.locator('#memory-sort').selectOption('newest');
      assert.match(await page.locator('.memory-card').first().innerText(), /Our quiet day/);
      await page.locator('#memory-sort').selectOption('oldest');
      assert.match(await page.locator('.memory-card').first().innerText(), /The First Meeting/);
    });
    await check('anniversary create, today countdown, edit, and delete are real', async () => {
      await go('anniversaries'); await page.getByRole('button', { name: 'Add Date', exact: true }).click();
      await page.getByLabel('Title', { exact: true }).fill('A date for today');
      await page.getByLabel('Repeat every year').uncheck();
      await page.getByRole('button', { name: 'Save date', exact: true }).click();
      await page.locator('dialog').waitFor({ state: 'hidden' });
      assert.match(await page.locator('.next-card').innerText(), /A date for today/);
      assert.match(await page.locator('.countdown').innerText(), /today/);
      await page.getByRole('button', { name: 'Edit A date for today', exact: true }).click();
      await page.getByLabel('Title', { exact: true }).fill('A date to keep');
      await page.getByRole('button', { name: 'Save date', exact: true }).click();
      await page.locator('dialog').waitFor({ state: 'hidden' });
      await page.getByRole('button', { name: 'Delete A date to keep', exact: true }).click();
      await page.getByRole('button', { name: 'Keep it', exact: true }).click();
      assert.equal(await page.getByRole('button', { name: 'Delete A date to keep', exact: true }).count(), 1);
      await page.getByRole('button', { name: 'Delete A date to keep', exact: true }).click();
      await page.getByRole('button', { name: 'Delete', exact: true }).click();
      await page.locator('dialog').waitFor({ state: 'hidden' });
      assert.equal(await page.getByRole('button', { name: 'Delete A date to keep', exact: true }).count(), 0);
    });
    await check('settings update names, start date, and a real custom cover', async () => {
      await go('settings');
      await page.getByLabel('Your name', { exact: true }).fill('Alice');
      await page.getByLabel('Their name', { exact: true }).fill('Jamie');
      await page.getByLabel('Together since').fill('2023-05-12');
      await page.locator('#cover-file').setInputFiles(upload('cover.png'));
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('form[data-dirty="true"]'));
      await go('home');
      assert.equal(await page.locator('.couple-names').innerText(), 'Alice & Jamie');
      assert.equal(await page.locator('.hero.custom').count(), 1);
      assert.match(await page.locator('.duration-number').innerText(), new RegExp(String(C.daysBetween('2023-05-12', C.today())).replace(/\B(?=(\d{3})+(?!\d))/g, ',')));
      await go('settings'); await page.getByRole('button', { name: 'Use seaside cover' }).click(); await page.getByRole('button', { name: 'Save changes' }).click();
      await page.waitForFunction(() => !document.querySelector('form[data-dirty="true"]'));
    });
    let backupPath, backedUp;
    await check('backup download contains portable embedded photos and complete project data', async () => {
      const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download backup', exact: true }).click();
      const download = await pending; backupPath = path.join(output, 'test-backup.json'); await download.saveAs(backupPath);
      const value = JSON.parse(await fs.readFile(backupPath, 'utf8')); backedUp = C.parseBackup(JSON.stringify(value));
      assert.equal(backedUp.settings.name1, 'Alice'); assert.equal(backedUp.memories.length, 5);
      assert.ok(backedUp.memories.every(m => m.photos.every(p => p.startsWith('data:image/'))));
      assert.ok(backedUp.settings.cover.startsWith('data:image/'));
    });
    await check('Memory Book generates editable pages from selected memories', async () => {
      await go('collection');
      await page.getByLabel('Book title', { exact: true }).fill('Every little summer');
      await page.getByRole('button', { name: 'Create Memory Book', exact: true }).click();
      await page.locator('#book-page-canvas[data-page-id]').waitFor();
      await page.waitForFunction(() => document.querySelector('#book-save-status')?.textContent === 'All changes saved');
      assert.equal(await page.locator('.book-page-thumb').count(), 7);
      assert.equal(await page.getByRole('button', { name: 'Export PDF', exact: true }).isEnabled(), true);
      await shot('book-desktop');
    });
    await check('malformed backup and invalid image leave saved state unchanged', async () => {
      await go('settings');
      await page.locator('#restore-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
      await page.waitForFunction(() => document.querySelector('#restore-error').textContent.includes('not valid JSON'));
      assert.equal(await page.getByLabel('Your name', { exact: true }).inputValue(), 'Alice');
      const broken = C.createDemo(); broken.memories[0].photos = ['data:image/png;base64,YWJj'];
      await page.locator('#restore-file').setInputFiles({ name: 'bad-image.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(broken)) });
      await page.waitForFunction(() => document.querySelector('#restore-error').textContent.includes('photo could not'));
      assert.equal(await page.locator('dialog').isVisible(), false);
      assert.equal(await page.getByLabel('Your name', { exact: true }).inputValue(), 'Alice');
    });
    await check('restore cancellation preserves edits, confirmation restores names and uploaded photos', async () => {
      await page.getByLabel('Your name', { exact: true }).fill('Changed'); await page.getByRole('button', { name: 'Save changes' }).click();
      await page.waitForFunction(() => !document.querySelector('form[data-dirty="true"]'));
      await page.locator('#restore-file').setInputFiles(backupPath); await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      assert.equal(await page.getByLabel('Your name', { exact: true }).inputValue(), 'Changed');
      await page.locator('#restore-file').setInputFiles(backupPath); await page.getByRole('button', { name: 'Replace & restore', exact: true }).click();
      await page.locator('dialog').waitFor({ state: 'hidden' });
      assert.equal(await page.getByLabel('Your name', { exact: true }).inputValue(), 'Alice');
      await go('home'); assert.equal(await page.locator('.hero.custom').count(), 0, 'Bundled cover appearance survives backup restoration');
      await go('memories'); await page.getByRole('button', { name: 'Open <b>Our quiet day</b>', exact: true }).click();
      assert.ok(await page.locator('.detail-photo').evaluate(i => i.complete && i.naturalWidth === 80)); await page.keyboard.press('Escape');
    });
    await check('simulated save failure shows an error and does not replace stored data', async () => {
      await go('settings'); await page.evaluate(() => { OLDStore.save = async () => { throw new Error('Storage test: device full. Your changes were not saved.'); }; });
      await page.getByLabel('Your name', { exact: true }).fill('Must not persist'); await page.getByRole('button', { name: 'Save changes' }).click();
      await page.waitForFunction(() => document.querySelector('#settings-form .inline-error').textContent.includes('device full'));
      page.once('dialog', d => d.accept()); await page.reload(); await page.locator('#settings-form').waitFor();
      assert.equal(await page.getByLabel('Your name', { exact: true }).inputValue(), 'Alice');
    });
    await check('concurrent-window conflict cannot silently overwrite a newer save', async () => {
      const other = await context.newPage(); observe(other); await other.goto(url + '#settings'); await other.locator('#settings-form').waitFor();
      await page.getByLabel('Your name', { exact: true }).fill('First window'); await page.getByRole('button', { name: 'Save changes' }).click();
      await page.waitForFunction(() => !document.querySelector('form[data-dirty="true"]'));
      await other.getByLabel('Your name', { exact: true }).fill('Stale window'); await other.getByRole('button', { name: 'Save changes' }).click();
      await other.waitForFunction(() => document.querySelector('#settings-form .inline-error').textContent.includes('another window'));
      await other.close({ runBeforeUnload: false });
      await page.reload(); await page.locator('#settings-form').waitFor(); assert.equal(await page.getByLabel('Your name', { exact: true }).inputValue(), 'First window');
    });
    await check('deleting a selected memory removes it from collections and survives reload', async () => {
      await go('memories'); await page.getByRole('button', { name: 'Open The First Meeting', exact: true }).click();
      await page.getByRole('button', { name: 'Delete memory', exact: true }).click(); await page.getByRole('button', { name: 'Delete', exact: true }).click();
      await page.locator('dialog').waitFor({ state: 'hidden' }); await page.reload(); await page.locator('.memory-grid').waitFor();
      assert.equal(await page.getByRole('button', { name: 'Open The First Meeting', exact: true }).count(), 0);
      await go('collection'); assert.equal(await page.locator('[name="book-source"][value="memory:first-meeting"]').count(), 0);
    });
    await check('empty-memory states remain usable and book generation needs a selection', async () => {
      const empty = C.createDemo(); empty.memories = []; empty.collection.selected = [];
      await restore(empty); await go('memories'); assert.equal(await page.locator('.empty').count(), 1);
      await go('collection'); assert.equal(await page.getByRole('button', { name: 'Create Memory Book' }).isDisabled(), true);
      assert.equal(await page.locator('[name="book-source"]').count(), 2, 'Anniversaries can be selected without any memories');
      await restore(C.createDemo()); await go('collection');
      for (const value of await page.locator('[name="book-source"]:checked').evaluateAll(nodes => nodes.map(n => n.value))) await page.locator(`[name="book-source"][value="${value}"]`).uncheck();
      assert.equal(await page.getByRole('button', { name: 'Create Memory Book' }).isDisabled(), true);
    });
    await check('all sections fit phone and tablet viewports without horizontal overflow', async () => {
      for (const width of [390, 768, 1280]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
        for (const route of ['home', 'memories', 'anniversaries', 'collection', 'settings']) {
          await go(route);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px ${route}`);
          assert.ok(await page.locator('main h1').isVisible());
          if (width === 390) await shot(route + '-mobile');
        }
      }
    });
    await check('long names, titles, and notes stay contained on a small phone', async () => {
      const long = C.createDemo(); long.settings.name1 = 'Alexandertheextraordinarilylongname'; long.settings.name2 = 'A second person with a long name'; long.memories[0].title = 'A'.repeat(80); long.memories[0].note = 'A long memory. '.repeat(65); long.anniversaries[0].title = 'An exceptionally long anniversary title for a day to remember';
      await restore(long); await page.setViewportSize({ width: 320, height: 740 });
      for (const route of ['home', 'memories', 'anniversaries', 'settings']) { await go(route); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `long text ${route}`); }
      await restore(C.createDemo());
    });
    await check('browser restart retains the saved book without internet', async () => {
      await page.getByLabel('Your name', { exact: true }).fill('Reopened'); await page.getByRole('button', { name: 'Save changes' }).click();
      await page.waitForFunction(() => !document.querySelector('form[data-dirty="true"]'));
      await context.close(); context = await chromium.launchPersistentContext(profile, options); page = context.pages()[0]; observe(page);
      await page.goto(url + '#settings'); await page.locator('#settings-form').waitFor();
      assert.equal(await page.getByLabel('Your name', { exact: true }).inputValue(), 'Reopened');
    });
    await check('runtime is free of app console errors and external requests', async () => {
      // One failed image decode is deliberately exercised by the malformed-backup test.
      assert.deepEqual(errors, []); assert.deepEqual(requests, []);
    });
    await fs.writeFile(path.join(output, 'browser-results.json'), JSON.stringify({ app, url, browser: options.channel, offline: true, count: passed.length, passed, errors, externalRequests: requests }, null, 2));
    console.log(`\n${passed.length} browser workflows passed. Evidence: ${output}`);
  } catch (error) {
    try { await shot('failure'); } catch {}
    console.error(error);
    try { console.error('Storage diagnostic:', await page.evaluate(() => new Promise(resolve => { const r = indexedDB.open('qa-diagnostic'); r.onerror = () => resolve({ name: r.error.name, message: r.error.message }); r.onsuccess = () => { r.result.close(); resolve('available'); }; }))); } catch {}
    process.exitCode = 1;
  } finally { await context.close(); }
})();


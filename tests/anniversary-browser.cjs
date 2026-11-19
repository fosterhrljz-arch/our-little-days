/* Real offline anniversary -> editable book -> downloaded PDF/PNG workflows. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const app = path.resolve(process.env.OLD_APP_DIR || path.join(__dirname, '..'));
  const output = process.env.OLD_QA_DIR || await fs.mkdtemp(path.join(os.tmpdir(), 'our-little-days-anniversaries-'));
  await fs.mkdir(output, { recursive: true });
  const profile = await fs.mkdtemp(path.join(output, 'anniversary-profile-'));
  const options = { channel: process.env.OLD_BROWSER_CHANNEL || 'chrome', headless: true, offline: true, reducedMotion: 'reduce', acceptDownloads: true, downloadsPath: path.join(output, 'downloads'), viewport: { width: 1698, height: 1132 } };
  let context = await chromium.launchPersistentContext(profile, options), page = context.pages()[0];
  const errors = [], requests = [], passed = [];
  const watch = p => {
    p.setDefaultTimeout(20000);
    p.on('pageerror', err => errors.push(err.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    p.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
  };
  watch(page);
  const url = pathToFileURL(path.join(app, 'index.html')).href;
  const check = async (name, fn) => { await fn(); passed.push(name); console.log('PASS ' + name); };
  const stored = () => page.evaluate(async () => (await OLDStore.load()).data);
  const book = async () => (await stored()).memoryBook;
  const saved = () => page.waitForFunction(() => document.querySelector('#book-save-status')?.textContent === 'All changes saved');
  const go = async route => { await page.locator(`nav a[href="#${route}"]`).click(); await page.waitForFunction(r => document.querySelector('nav a[aria-current="page"]')?.getAttribute('href') === '#' + r, route); };
  const close = () => page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  const saveDate = async () => { await page.getByRole('button', { name: 'Save date', exact: true }).click(); await page.locator('#dialog').waitFor({ state: 'hidden' }); };
  const shot = name => page.screenshot({ path: path.join(output, name + '.png'), fullPage: true, animations: 'disabled' });
  const turn = async n => { await page.locator('.book-page-thumb').nth(n).click(); await saved(); const id = (await book()).activePageId; await page.waitForFunction(id => document.querySelector('#book-page-canvas')?.dataset.pageId === id, id); };
  async function download(label, name) {
    const pending = page.waitForEvent('download', { timeout: 120000 });
    await page.getByRole('button', { name: label, exact: true }).click();
    const item = await pending; await item.saveAs(path.join(output, name)); return path.join(output, name);
  }
  async function upload(files, count) {
    await page.locator('#anniversary-photos').setInputFiles(files);
    await page.waitForFunction(n => document.querySelectorAll('#photo-strip img').length === n && !document.querySelector('#anniversary-photos').disabled, count);
  }
  try {
    await page.goto(url + '#anniversaries'); await page.getByRole('button', { name: 'Add Date', exact: true }).waitFor();
    const original = await stored();
    const fixture = async (source, type, name) => {
      const data = await page.evaluate(async ({ source, type }) => {
        const image = await OLDImages.load(source), canvas = document.createElement('canvas');
        canvas.width = 900; canvas.height = Math.round(image.naturalHeight * 900 / image.naturalWidth);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL(type, .95).split(',')[1];
      }, { source, type });
      return { name, mimeType: type, buffer: Buffer.from(data, 'base64') };
    };
    const files = [await fixture('crossing', 'image/jpeg', 'seaside-crossing.jpg'), await fixture('sparklers', 'image/png', 'summer-evening.png'), await fixture('hydrangeas', 'image/webp', 'blue-hydrangeas.webp')];
    const extra = await fixture('shore', 'image/jpeg', 'quiet-shore.jpeg');
    const note = 'We took the coastal train, stayed for the sparklers, and brought home blue hydrangeas.\nA little summer, just for us.';
    let anniversaryId, sourceAnniversary;

    await check('anniversary form explains supported formats and rejects HEIC/HEIF without adding photos', async () => {
      assert.equal(await page.title(), 'Anniversaries · Our Little Days');
      await page.getByRole('button', { name: 'Add Date', exact: true }).click();
      assert.match(await page.locator('#date-form').innerText(), /JPEG.*PNG.*WebP/);
      assert.match(await page.locator('#photo-format-help').innerText(), /HEIC\/HEIF is not supported/);
      for (const [name, mimeType] of [['phone.HEIC', 'image/heic'], ['phone.heif', 'image/heif'], ['phone.heic', 'application/octet-stream']]) {
        await page.locator('#anniversary-photos').setInputFiles({ name, mimeType, buffer: Buffer.from('unsupported phone image') });
        await page.waitForFunction(() => document.querySelector('#date-form .inline-error').textContent.includes('Convert to JPEG'));
        assert.equal(await page.locator('#photo-strip img').count(), 0);
      }
      assert.deepEqual(await stored(), original);
    });
    await check('create an anniversary with JPEG, PNG, WebP and a note without creating a memory', async () => {
      await page.getByLabel('Title', { exact: true }).fill('Our Seaside Anniversary');
      await page.getByLabel('Date', { exact: true }).fill('2026-06-18');
      await page.getByLabel('A little note', { exact: true }).fill(note);
      await upload(files, 3); await shot('anniversary-form-desktop'); await saveDate();
      const state = await stored(); sourceAnniversary = state.anniversaries.find(a => a.title === 'Our Seaside Anniversary'); anniversaryId = sourceAnniversary.id;
      assert.equal(sourceAnniversary.note, note); assert.equal(sourceAnniversary.photos.length, 3);
      assert.ok(sourceAnniversary.photos.every(src => src.startsWith('data:image/jpeg')));
      assert.deepEqual(state.memories, original.memories);
      assert.equal(await page.locator(`[data-anniversary="${anniversaryId}"] .date-photos img`).count(), 3);
      await shot('anniversaries-desktop');
    });
    await check('anniversary gallery shows every attachment, and reordering or removing can be cancelled', async () => {
      await page.getByRole('button', { name: 'Open Our Seaside Anniversary', exact: true }).click();
      for (let i = 0; i < 3; i++) {
        const src = await page.locator('.detail-photo').getAttribute('src'); assert.equal(src, sourceAnniversary.photos[i]);
        await page.waitForFunction(() => document.querySelector('.detail-photo').naturalWidth > 0);
        if (i < 2) await page.getByRole('button', { name: 'Next photo', exact: true }).click();
      }
      assert.equal(await page.locator('.detail-note').innerText(), note);
      await page.getByRole('button', { name: 'Edit anniversary', exact: true }).click();
      await page.getByRole('button', { name: 'Make this the first photo', exact: true }).last().click();
      await page.getByRole('button', { name: 'Remove photo 2', exact: true }).click();
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      assert.deepEqual((await stored()).anniversaries.find(a => a.id === anniversaryId), sourceAnniversary);
      await page.getByRole('button', { name: 'Edit Our Seaside Anniversary', exact: true }).click();
      await page.getByRole('button', { name: 'Make this the first photo', exact: true }).last().click(); await saveDate();
      const reordered = (await stored()).anniversaries.find(a => a.id === anniversaryId);
      assert.deepEqual(reordered.photos, [sourceAnniversary.photos[2], ...sourceAnniversary.photos.slice(0, 2)]);
      sourceAnniversary = reordered;
    });
    await check('relationship anniversary accepts attachments and keeps them after editing Settings', async () => {
      await page.getByRole('button', { name: 'Edit relationship anniversary', exact: true }).click();
      assert.equal(await page.getByLabel('Date', { exact: true }).getAttribute('readonly'), '');
      await page.getByLabel('A little note', { exact: true }).fill('Back to the shore where we began.');
      await upload([extra], 1); await saveDate(); const expected = (await stored()).settings.anniversary;
      await go('settings'); assert.match(await page.locator('#cover-format-help').innerText(), /HEIC\/HEIF/);
      await page.getByLabel('Your name', { exact: true }).fill('Haru');
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('#settings-form [type=submit]').disabled);
      assert.deepEqual((await stored()).settings.anniversary, expected);
    });
    await check('anniversary list and upload form remain usable from 320px to desktop', async () => {
      await go('anniversaries');
      for (const width of [768, 390, 320]) {
        await page.setViewportSize({ width, height: 844 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `list ${width}`);
        if (width === 390) await shot('anniversaries-mobile');
        await page.getByRole('button', { name: 'Edit Our Seaside Anniversary', exact: true }).click();
        assert.ok(await page.locator('#dialog').evaluate(el => el.scrollWidth <= el.clientWidth), `dialog ${width}`);
        await page.getByRole('button', { name: 'Save date', exact: true }).scrollIntoViewIfNeeded();
        if (width === 390) await shot('anniversary-form-mobile');
        await close();
      }
      await page.setViewportSize({ width: 1698, height: 1132 });
    });
    await check('selecting the anniversary generates one page per photo with its date and note', async () => {
      await go('collection');
      for (const value of await page.locator('[name="book-source"]:checked').evaluateAll(nodes => nodes.map(n => n.value))) await page.locator(`[name="book-source"][value="${value}"]`).uncheck();
      await page.locator(`[name="book-source"][value="anniversary:${anniversaryId}"]`).check();
      await page.getByRole('button', { name: 'Create Memory Book', exact: true }).click();
      await page.locator('#book-page-canvas[data-page-id]').waitFor(); await saved();
      const doc = await book(); assert.equal(doc.pages.length, 4);
      assert.deepEqual(doc.pages.slice(1).flatMap(p => p.elements.filter(e => e.type === 'image').map(e => doc.assets[e.asset])), sourceAnniversary.photos);
      assert.ok(doc.pages.slice(1).every(p => p.source.id === anniversaryId && p.elements.some(e => e.text === 'June 18, 2026')));
      assert.ok(doc.pages[1].elements.some(e => e.text === note));
      assert.match(await page.locator('#book-photo-help').innerText(), /HEIC\/HEIF/);
    });
    await check('edit anniversary page text, undo/redo, and move its photo without changing the saved anniversary', async () => {
      await turn(1);
      await page.getByRole('button', { name: 'Edit text: Our Seaside Anniversary', exact: true }).click();
      await page.getByLabel('Edit page text', { exact: true }).fill('The summer we kept');
      await page.getByRole('button', { name: 'Center', exact: true }).click(); await saved();
      await page.getByRole('button', { name: 'Undo', exact: true }).click(); await saved();
      await page.getByRole('button', { name: 'Redo', exact: true }).click(); await saved();
      const doc = await book(), photo = doc.pages[1].elements.find(e => e.type === 'image');
      await page.locator(`[data-element-id="${photo.id}"]`).click();
      const handle = await page.getByRole('button', { name: 'Move selected element', exact: true }).boundingBox();
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2); await page.mouse.down();
      await page.mouse.move(handle.x + handle.width / 2 + 3, handle.y + handle.height / 2 + 6, { steps: 4 }); await page.mouse.up(); await saved();
      assert.notEqual((await book()).pages[1].elements.find(e => e.id === photo.id).y, photo.y);
      assert.deepEqual((await stored()).anniversaries.find(a => a.id === anniversaryId), sourceAnniversary);
    });
    await check('additional book photo is inserted only on the chosen page and can be undone', async () => {
      await turn(2); const before = await book();
      await page.getByRole('button', { name: 'Add photo', exact: true }).click();
      await page.locator('#book-photo-input').setInputFiles(extra);
      await page.waitForFunction(() => document.querySelectorAll('#book-objects [data-element-id]').length > 0); await saved();
      const after = await book(); assert.equal(after.pages[2].elements.length, before.pages[2].elements.length + 1);
      for (const i of [0, 1, 3]) assert.deepEqual(after.pages[i], before.pages[i]);
      await page.getByRole('button', { name: 'Undo', exact: true }).click(); await saved();
      assert.deepEqual((await book()).pages, before.pages);
      assert.deepEqual((await stored()).anniversaries.find(a => a.id === anniversaryId), sourceAnniversary);
    });
    await check('photos, notes, edited pages and active page survive a full browser restart', async () => {
      const expected = await stored(); await context.close();
      context = await chromium.launchPersistentContext(profile, options); page = context.pages()[0]; watch(page);
      await page.goto(url + '#collection'); await page.locator('#book-page-canvas[data-page-id]').waitFor();
      assert.deepEqual(await stored(), expected);
    });
    await check('all anniversary images decode and all exported text fits its page boxes', async () => {
      const inspection = await page.evaluate(async () => {
        const doc = (await OLDStore.load()).data.memoryBook, canvas = document.createElement('canvas');
        const result = [];
        for (const p of doc.pages) {
          const overflow = await BookRender.draw(doc, p, canvas);
          result.push({ page: p.title, overflow, images: p.elements.filter(e => e.type === 'image').length, texts: p.elements.filter(e => e.type === 'text').map(e => e.text) });
        }
        return result;
      });
      assert.ok(inspection.every(p => p.overflow.length === 0));
      assert.ok(inspection.slice(1).every(p => p.images === 1));
      assert.ok(inspection[1].texts.includes('The summer we kept')); assert.ok(inspection[1].texts.includes(note));
      await fs.writeFile(path.join(output, 'content-verification.json'), JSON.stringify(inspection, null, 2));
    });
    await check('edited anniversary collection downloads as complete PDF and high-resolution PNG pages', async () => {
      const doc = await book(); await fs.writeFile(path.join(output, 'export-document.json'), JSON.stringify(doc, null, 2));
      for (let i = 0; i < doc.pages.length; i++) {
        await turn(i); await page.keyboard.press('Escape');
        const base64 = await page.locator('#book-page-canvas').evaluate(c => c.toDataURL('image/png').split(',')[1]);
        await fs.writeFile(path.join(output, `preview-${String(i + 1).padStart(2, '0')}.png`), Buffer.from(base64, 'base64'));
      }
      await download('PNG pages', 'edited-pages.zip'); await download('Export PDF', 'edited-book.pdf');
      assert.equal((await fs.readFile(path.join(output, 'edited-book.pdf'))).subarray(0, 8).toString(), '%PDF-1.4');
      await turn(1); await shot('anniversary-book-desktop');
      await page.setViewportSize({ width: 390, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await shot('anniversary-book-mobile'); await page.setViewportSize({ width: 1698, height: 1132 });
    });
    await check('portable backup and restore preserve custom and relationship photos and edited book pages', async () => {
      const expected = await stored(); await go('settings');
      const backupPath = await download('Download backup', 'anniversary-backup.json');
      const data = JSON.parse(await fs.readFile(backupPath, 'utf8')).data;
      assert.equal(data.version, 3); assert.ok(data.anniversaries.find(a => a.id === anniversaryId).photos.every(src => src.startsWith('data:image/')));
      assert.ok(data.settings.anniversary.photos.every(src => src.startsWith('data:image/')));
      await page.locator('#restore-file').setInputFiles(backupPath);
      await page.getByRole('button', { name: 'Replace & restore', exact: true }).click(); await page.locator('#dialog').waitFor({ state: 'hidden' });
      assert.deepEqual(await stored(), expected);
    });
    await check('invalid anniversary photo in a backup is rejected before replacing saved data', async () => {
      const expected = await stored(), broken = structuredClone(expected);
      broken.anniversaries.find(a => a.id === anniversaryId).photos = ['data:image/png;base64,YWJj'];
      await page.locator('#restore-file').setInputFiles({ name: 'broken-photo.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(broken)) });
      await page.waitForFunction(() => document.querySelector('#restore-error').textContent.includes('could not be opened'));
      assert.deepEqual(await stored(), expected); assert.equal(await page.locator('#dialog').isVisible(), false);
    });
    await check('editing and removing anniversary attachments does not overwrite existing edited book pages', async () => {
      const expected = (await stored()).memoryBook; await go('anniversaries');
      await page.getByRole('button', { name: 'Edit Our Seaside Anniversary', exact: true }).click();
      await page.getByRole('button', { name: 'Remove photo 1', exact: true }).click();
      await page.getByLabel('A little note', { exact: true }).fill('Changed only on the anniversary.'); await saveDate();
      assert.equal((await stored()).anniversaries.find(a => a.id === anniversaryId).photos.length, 2);
      assert.deepEqual((await stored()).memoryBook, expected);
    });
    await check('legacy V3 backup restores date-only anniversaries and existing edited pages intact', async () => {
      const legacy = await stored(); legacy.version = 2; delete legacy.settings.anniversary;
      for (const a of legacy.anniversaries) { delete a.photos; delete a.note; }
      await go('settings');
      await page.locator('#restore-file').setInputFiles({ name: 'v3-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(legacy)) });
      await page.getByRole('button', { name: 'Replace & restore', exact: true }).click(); await page.locator('#dialog').waitFor({ state: 'hidden' });
      const migrated = await stored(); assert.equal(migrated.version, 3);
      assert.deepEqual(migrated.memories, legacy.memories); assert.deepEqual(migrated.memoryBook, legacy.memoryBook);
      assert.ok(migrated.anniversaries.every(a => a.photos.length === 0 && a.note === ''));
    });
    await check('offline workflow has no runtime errors or external requests', async () => { assert.deepEqual(errors, []); assert.deepEqual(requests, []); });
    await fs.writeFile(path.join(output, 'anniversary-browser-results.json'), JSON.stringify({ count: passed.length, passed, errors, externalRequests: requests, offline: true, app }, null, 2));
    console.log(`\n${passed.length} anniversary browser workflows passed. Evidence: ${output}`);
  } catch (error) { try { await shot('anniversary-failure'); } catch {} console.error(error); process.exitCode = 1; }
  finally { await context.close(); }
})();

/* End-to-end editor tests. All authoring and export actions use the actual UI. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
(async () => {
  const app = path.resolve(process.env.OLD_APP_DIR || path.join(__dirname, '..'));
  const output = process.env.OLD_QA_DIR || await fs.mkdtemp(path.join(os.tmpdir(), 'our-little-days-editor-'));
  await fs.mkdir(output, { recursive: true });
  const profile = await fs.mkdtemp(path.join(output, 'editor-profile-'));
  const config = { channel: process.env.OLD_BROWSER_CHANNEL || 'chrome', headless: true, offline: true, reducedMotion: 'reduce', acceptDownloads: true, downloadsPath: path.join(output, 'downloads'), viewport: { width: 1698, height: 1132 } };
  let context = await chromium.launchPersistentContext(profile, config), page = context.pages()[0];
  const errors = [], requests = [], passed = [];
  const watch = p => { p.on('pageerror', err => errors.push(err.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); p.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); }); };
  watch(page); page.setDefaultTimeout(20000);
  const url = pathToFileURL(path.join(app, 'index.html')).href;
  const check = async (name, fn) => { await fn(); passed.push(name); console.log('PASS ' + name); };
  const saved = async () => { await page.waitForFunction(() => document.querySelector('#book-save-status')?.textContent === 'All changes saved'); };
  const stored = () => page.evaluate(async () => (await OLDStore.load()).data);
  const book = async () => (await stored()).memoryBook;
  const go = async route => { await page.locator(`nav a[href="#${route}"]`).click(); await page.waitForFunction(r => document.querySelector('nav a[aria-current="page"]')?.getAttribute('href') === '#' + r, route); };
  const turn = async index => { await page.locator('.book-page-thumb').nth(index).click(); await saved(); const id = (await book()).activePageId; await page.waitForFunction(id => document.querySelector('#book-page-canvas')?.dataset.pageId === id, id); };
  const screenshot = name => page.screenshot({ path: path.join(output, name + '.png'), fullPage: true, animations: 'disabled' });
  async function download(action, filename) { const pending = page.waitForEvent('download', { timeout: 120000 }); await page.getByRole('button', { name: action, exact: true }).click(); const d = await pending; await d.saveAs(path.join(output, filename)); return path.join(output, filename); }
  try {
    await page.goto(url + '#collection'); await page.locator('.book-setup').waitFor();
    const original = await stored();
    await check('selection includes saved anniversaries and allows explicit item ordering', async () => {
      for (const value of await page.locator('[name="book-source"]:checked').evaluateAll(nodes => nodes.map(n => n.value))) await page.locator(`[name="book-source"][value="${value}"]`).uncheck();
      await page.locator('[name="book-source"][value="memory:first-meeting"]').check();
      await page.locator('[name="book-source"][value="anniversary:aoi-birthday"]').check();
      await page.getByRole('button', { name: 'Move item earlier', exact: true }).nth(1).click();
      await saved(); assert.deepEqual((await book()).setup.selection.map(x => x.id), ['aoi-birthday', 'first-meeting']);
      await screenshot('book-setup');
    });
    await check('three template choices generate distinct editable page styles', async () => {
      for (const [id, name, color] of [['blue', 'Blue Memories', '#e7f2fb'], ['film', 'Film Diary', '#f5f5f3'], ['summer', 'Pure Summer', '#ffffff']]) {
        await page.locator(`[data-book-action="template"][data-template="${id}"]`).click();
        if (id === 'blue') await page.getByRole('button', { name: 'Create Memory Book', exact: true }).click();
        else { await page.getByRole('button', { name: 'Regenerate pages', exact: true }).click(); await page.locator('.book-confirm').getByRole('button', { name: 'Regenerate pages' }).click(); }
        await page.locator('#book-page-canvas[data-page-id]').waitFor(); await saved();
        const doc = await book(); assert.equal(doc.template, id); assert.equal(doc.pages[0].background, color); assert.equal(doc.pages.length, 3);
        assert.equal(doc.pages[1].source.id, 'aoi-birthday'); assert.equal(doc.pages[2].source.id, 'first-meeting');
        await screenshot('template-' + id);
        if (id !== 'summer') await page.getByRole('button', { name: 'Content & template', exact: true }).click();
      }
    });
    let textId;
    await check('click-to-edit changes existing page text without altering source memories', async () => {
      await page.getByRole('button', { name: 'Edit text: Our days, together', exact: true }).click();
      await page.getByLabel('Edit page text', { exact: true }).fill('A summer worth keeping');
      await page.getByRole('button', { name: 'Center', exact: true }).click(); await saved();
      const doc = await book(), text = doc.pages[0].elements.find(el => el.text === 'A summer worth keeping'); textId = text.id;
      assert.equal(text.align, 'center'); assert.deepEqual((await stored()).memories, original.memories);
      assert.deepEqual((await stored()).anniversaries, original.anniversaries);
    });
    await check('font size, color, alignment, and typeface controls persist', async () => {
      await page.getByLabel('Font size', { exact: true }).fill('34'); await page.getByLabel('Font size', { exact: true }).press('Tab');
      await page.getByLabel('Text color', { exact: true }).evaluate(el => { el.value = '#1a698a'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
      await page.getByLabel('Typeface', { exact: true }).selectOption('serif');
      await page.getByRole('button', { name: 'Right', exact: true }).click(); await saved();
      const text = (await book()).pages[0].elements.find(e => e.id === textId);
      assert.equal(text.fontSize, 34); assert.equal(text.color, '#1a698a'); assert.equal(text.align, 'right'); assert.equal(text.font, 'serif');
      await page.getByRole('button', { name: 'Undo', exact: true }).click(); await saved(); assert.equal((await book()).pages[0].elements.find(e => e.id === textId).align, 'center');
      await page.getByRole('button', { name: 'Redo', exact: true }).click(); await saved(); assert.equal((await book()).pages[0].elements.find(e => e.id === textId).align, 'right');
    });
    let addedTextId;
    await check('add a text box at a chosen position, then drag and resize it with pointer handles', async () => {
      await page.getByRole('button', { name: 'Add text', exact: true }).click();
      const sheet = await page.locator('#book-sheet').boundingBox(), zoom = sheet.width / 600;
      await page.locator('#book-sheet').click({ position: { x: 75 * zoom, y: 660 * zoom } });
      await page.getByLabel('Edit page text', { exact: true }).fill('Just the two of us.');
      const handle = page.getByRole('button', { name: 'Move selected element' }); const box = await handle.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 35 * zoom, box.y + box.height / 2 - 90 * zoom, { steps: 6 }); await page.mouse.up(); await saved();
      let el = (await book()).pages[0].elements.find(el => el.text === 'Just the two of us.'); addedTextId = el.id;
      assert.ok(Math.abs(el.x - 110) < 3); assert.ok(Math.abs(el.y - 570) < 3);
      const resize = await page.getByRole('button', { name: 'Resize se', exact: true }).boundingBox();
      await page.mouse.move(resize.x + resize.width / 2, resize.y + resize.height / 2); await page.mouse.down(); await page.mouse.move(resize.x + resize.width / 2 + 35 * zoom, resize.y + resize.height / 2 + 20 * zoom, { steps: 5 }); await page.mouse.up(); await saved();
      el = (await book()).pages[0].elements.find(e => e.id === addedTextId); assert.ok(el.w > 285); assert.ok(el.h > 120);
    });
    await check('text deletion and undo/redo restore the same editable element', async () => {
      await page.getByRole('button', { name: 'Delete text', exact: true }).click(); await saved();
      assert.ok(!(await book()).pages[0].elements.some(e => e.id === addedTextId));
      await page.getByRole('button', { name: 'Undo', exact: true }).click(); await saved();
      assert.ok((await book()).pages[0].elements.some(e => e.id === addedTextId));
      await page.getByRole('button', { name: 'Redo', exact: true }).click(); await saved();
      assert.ok(!(await book()).pages[0].elements.some(e => e.id === addedTextId));
    });
    const fixture = color => page.evaluate(color => { const c = document.createElement('canvas'); c.width = 120; c.height = 80; const ctx = c.getContext('2d'); ctx.fillStyle = color; ctx.fillRect(0, 0, 120, 80); ctx.fillStyle = '#ffffff'; ctx.fillRect(20, 20, 40, 25); return c.toDataURL('image/png').split(',')[1]; }, color);
    const blue = Buffer.from(await fixture('#83c7eb'), 'base64'), green = Buffer.from(await fixture('#86ad8e'), 'base64');
    let uploadedId, uploadedPageId;
    await check('an upload stays on the chosen page even when the user switches pages during processing', async () => {
      const before = await book(); uploadedPageId = before.pages[0].id;
      await page.evaluate(() => { const read = OLDImages.read; OLDImages.read = async file => { await new Promise(r => setTimeout(r, 650)); return read(file); }; });
      await page.getByRole('button', { name: 'Add photo', exact: true }).click();
      await page.locator('#book-photo-input').setInputFiles({ name: 'extra.png', mimeType: 'image/png', buffer: blue });
      await page.locator('.book-page-thumb').nth(1).click(); await saved();
      const after = await book(); assert.equal(after.pages[0].elements.length, before.pages[0].elements.length + 1);
      assert.deepEqual(after.pages[1].elements, before.pages[1].elements); assert.deepEqual(after.pages[2].elements, before.pages[2].elements);
      uploadedId = after.pages[0].elements.at(-1).id; assert.ok(after.assets[after.pages[0].elements.at(-1).asset].startsWith('data:image/jpeg'));
      assert.deepEqual((await stored()).memories, original.memories);
    });
    await check('replace, move, resize, and delete an inserted photo without changing another page', async () => {
      await turn(0); await page.locator(`[data-element-id="${uploadedId}"]`).click();
      const prior = await book(); const otherPages = JSON.stringify(prior.pages.slice(1));
      const oldAsset = prior.pages[0].elements.find(e => e.id === uploadedId).asset;
      await page.getByRole('button', { name: 'Replace photo', exact: true }).click();
      await page.locator('#book-photo-input').setInputFiles({ name: 'replacement.png', mimeType: 'image/png', buffer: green }); await saved();
      assert.notEqual((await book()).pages[0].elements.find(e => e.id === uploadedId).asset, oldAsset);
      await page.getByLabel('Photo fit', { exact: true }).selectOption('contain'); await saved();
      assert.equal((await book()).pages[0].elements.find(e => e.id === uploadedId).fit, 'contain');
      const h = await page.getByRole('button', { name: 'Move selected element' }).boundingBox();
      await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await page.mouse.down(); await page.mouse.move(h.x + 45, h.y + 55, { steps: 4 }); await page.mouse.up(); await saved();
      const r = await page.getByRole('button', { name: 'Resize se' }).boundingBox();
      await page.mouse.move(r.x + 6, r.y + 6); await page.mouse.down(); await page.mouse.move(r.x - 35, r.y - 25, { steps: 4 }); await page.mouse.up(); await saved();
      assert.equal(JSON.stringify((await book()).pages.slice(1)), otherPages);
      await page.getByRole('button', { name: 'Delete photo', exact: true }).click(); await saved(); assert.ok(!(await book()).pages[0].elements.some(e => e.id === uploadedId));
      await page.getByRole('button', { name: 'Undo', exact: true }).click(); await saved(); assert.ok((await book()).pages[0].elements.some(e => e.id === uploadedId));
    });
    await check('page navigation, reordering, adding, and deleting pages participate in undo', async () => {
      await turn(2); const before = await book(), id = before.pages[2].id;
      await page.getByRole('button', { name: 'Move page earlier' }).click(); await saved(); assert.equal((await book()).pages[1].id, id);
      await page.getByRole('button', { name: 'Undo', exact: true }).click(); await saved(); assert.equal((await book()).pages[2].id, id);
      await page.getByRole('button', { name: 'Add page', exact: true }).click(); await saved(); assert.equal((await book()).pages.length, 4);
      await page.getByRole('button', { name: 'Delete page', exact: true }).click(); await page.locator('.book-confirm').getByRole('button', { name: 'Delete page' }).click(); await saved(); assert.equal((await book()).pages.length, 3);
    });
    await check('unfinished book and current page survive a full browser restart', async () => {
      await turn(1); const expected = await book(); await context.close();
      context = await chromium.launchPersistentContext(profile, config); page = context.pages()[0]; watch(page); page.setDefaultTimeout(20000);
      await page.goto(url + '#collection'); await page.locator('#book-page-canvas[data-page-id]').waitFor();
      assert.deepEqual(await book(), expected); assert.equal(await page.locator('.book-setup').count(), 0);
      assert.equal(await page.locator('#book-page-counter').innerText(), 'Page 2 of 3');
    });
    let backupPath;
    await check('project backup and restore include the unfinished book and page-only uploads', async () => {
      const expected = await book(); await go('settings'); backupPath = await download('Download backup', 'editor-backup.json');
      const backup = JSON.parse(await fs.readFile(backupPath, 'utf8')); assert.equal(backup.data.version, 3); assert.equal(backup.data.memoryBook.pages.length, 3);
      assert.ok(Object.values(backup.data.memoryBook.assets).every(src => src.startsWith('data:image/')));
      await page.locator('#restore-file').setInputFiles(backupPath); await page.getByRole('button', { name: 'Replace & restore' }).click(); await page.locator('#dialog').waitFor({ state: 'hidden' });
      await go('collection'); await page.locator('#book-page-canvas[data-page-id]').waitFor(); assert.deepEqual(await book(), expected);
    });
    await check('source memory editing and deletion do not rewrite existing book pages', async () => {
      const pages = JSON.stringify((await book()).pages); await go('memories');
      await page.getByRole('button', { name: 'Open The First Meeting', exact: true }).click(); await page.getByRole('button', { name: 'Edit memory', exact: true }).click();
      await page.getByLabel('Title', { exact: true }).fill('Edited source only'); await page.getByRole('button', { name: 'Save memory', exact: true }).click(); await page.locator('#dialog').waitFor({ state: 'hidden' });
      await page.getByRole('button', { name: 'Open Edited source only', exact: true }).click(); await page.getByRole('button', { name: 'Delete memory', exact: true }).click(); await page.getByRole('button', { name: 'Delete', exact: true }).click(); await page.locator('#dialog').waitFor({ state: 'hidden' });
      await go('collection'); assert.equal(JSON.stringify((await book()).pages), pages);
    });
    await check('page text remains literal and overflow is reported before export', async () => {
      await turn(0); await page.getByRole('button', { name: 'Edit text: A summer worth keeping', exact: true }).click();
      await page.getByLabel('Edit page text', { exact: true }).fill('<b>Our summer</b>');
      await page.getByRole('button', { name: 'Center', exact: true }).click();
      assert.equal(await page.locator('#book-properties b').count(), 0);
      await page.getByLabel('Text', { exact: true }).fill('A very long note. '.repeat(100)); await page.getByLabel('Text', { exact: true }).press('Tab');
      assert.equal(await page.locator('#book-overflow').isVisible(), true);
      await page.getByLabel('Text', { exact: true }).fill('A summer worth keeping'); await page.getByLabel('Text', { exact: true }).press('Tab'); await saved();
      assert.equal(await page.locator('#book-overflow').isVisible(), false);
    });
    await check('keyboard Undo and Redo work during direct text editing', async () => {
      await page.getByRole('button', { name: 'Edit text: A summer worth keeping', exact: true }).click();
      await page.getByLabel('Edit page text', { exact: true }).fill('A keyboard edit');
      await page.keyboard.press('Control+z'); await saved();
      assert.ok((await book()).pages[0].elements.some(e => e.text === 'A summer worth keeping'));
      await page.keyboard.press('Control+Shift+z'); await saved();
      assert.ok((await book()).pages[0].elements.some(e => e.text === 'A keyboard edit'));
      await page.keyboard.press('Control+z'); await saved();
    });
    await check('all edited pages export as a multi-page PDF and numbered high-resolution PNGs', async () => {
      // Remove the artificial test swatch before the final export; its page-only behavior was already verified.
      await page.locator(`[data-element-id="${uploadedId}"]`).click(); await page.getByRole('button', { name: 'Delete photo', exact: true }).click(); await saved();
      const current = await book();
      await fs.writeFile(path.join(output, 'export-document.json'), JSON.stringify(current, null, 2));
      for (let i = 0; i < current.pages.length; i++) {
        await turn(i); await page.keyboard.press('Escape');
        // A settled preview carries its page ID after asynchronous canvas painting.
        await page.waitForFunction(id => document.querySelector('#book-page-canvas')?.dataset.pageId === id, current.pages[i].id);
        const base64 = await page.locator('#book-page-canvas').evaluate(c => c.toDataURL('image/png').split(',')[1]);
        await fs.writeFile(path.join(output, `preview-${String(i + 1).padStart(2, '0')}.png`), Buffer.from(base64, 'base64'));
      }
      await download('PNG pages', 'edited-pages.zip');
      await download('Export PDF', 'edited-book.pdf');
      const pdf = await fs.readFile(path.join(output, 'edited-book.pdf')); assert.equal(pdf.subarray(0, 8).toString(), '%PDF-1.4');
      assert.ok(pdf.length > 100000); assert.ok((await fs.stat(path.join(output, 'edited-pages.zip'))).size > 100000);
      await saved(); await turn(0); await screenshot('editor-final');
    });
    await check('editor fits tablet and phone screens with working touch-sized controls', async () => {
      for (const width of [1280, 768, 390, 320]) {
        await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `editor ${width}`);
        await turn(1); assert.equal(await page.locator('#book-page-counter').innerText(), 'Page 2 of 3');
        if (width === 390) await screenshot('editor-mobile');
      }
      await page.setViewportSize({ width: 1698, height: 1132 });
    });
    await check('failed autosave stays visibly unsaved, blocks navigation, and offers a draft backup', async () => {
      await turn(0); const savedBefore = await book();
      await page.evaluate(() => { OLDStore.save = async () => { throw new Error('Test storage failure: no space.'); }; });
      await page.getByRole('button', { name: 'Edit text: A summer worth keeping', exact: true }).click(); await page.getByLabel('Edit page text', { exact: true }).fill('Unsaved but recoverable'); await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.querySelector('#book-save-status')?.textContent === 'Changes not saved');
      assert.deepEqual(await book(), savedBefore);
      await page.locator('nav a[href="#home"]').click(); await page.waitForFunction(() => location.hash === '#collection');
      const recovery = await download('Download draft backup', 'unsaved-draft.json');
      const parsed = JSON.parse(await fs.readFile(recovery, 'utf8')); assert.ok(parsed.data.memoryBook.pages[0].elements.some(e => e.text === 'Unsaved but recoverable'));
      page.once('dialog', d => d.accept()); await page.reload(); await page.locator('#book-page-canvas[data-page-id]').waitFor(); assert.deepEqual(await book(), savedBefore);
    });
    await check('no app runtime errors or external requests occurred while offline', async () => { assert.deepEqual(errors, []); assert.deepEqual(requests, []); });
    await fs.writeFile(path.join(output, 'book-browser-results.json'), JSON.stringify({ count: passed.length, passed, errors, externalRequests: requests, offline: true, app }, null, 2));
    console.log(`\n${passed.length} Memory Book browser workflows passed. Evidence: ${output}`);
  } catch (err) { try { await screenshot('book-failure'); } catch {} console.error(err); process.exitCode = 1; }
  finally { await context.close(); }
})();

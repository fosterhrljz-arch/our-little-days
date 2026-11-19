const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/core.js');
const B = require('../js/book-model.js');
const setup = (template = 'summer', id = 'aoi-birthday') => ({ title: 'Days by the sea', template, selection: [{ kind: 'anniversary', id }] });

for (const version of [1, 2]) test(`schema ${version} dates migrate with empty attachments and preserve edited books`, () => {
  const original = C.createDemo(); original.version = version;
  delete original.settings.anniversary;
  for (const a of original.anniversaries) { delete a.photos; delete a.note; }
  original.memoryBook = B.generate(original, setup());
  original.memoryBook.pages[1].elements[0].text = 'An existing personal edit';
  const before = structuredClone(original), migrated = C.parseBackup(JSON.stringify(original));
  assert.equal(migrated.version, 3);
  assert.deepEqual(migrated.settings.anniversary, { note: '', photos: [] });
  assert.deepEqual(migrated.anniversaries[0], { ...original.anniversaries[0], note: '', photos: [] });
  assert.deepEqual(migrated.memories, original.memories);
  assert.deepEqual(migrated.memoryBook, original.memoryBook);
  assert.deepEqual(original, before);
});
test('backup round trip retains custom and relationship anniversary attachments', () => {
  const state = C.createDemo();
  state.anniversaries[0].photos = ['shore', 'sparklers']; state.anniversaries[0].note = 'One year\nAnother sea.';
  state.settings.anniversary = { note: 'Still us.', photos: ['crossing'] };
  const after = C.parseBackup(C.backup(state)); assert.deepEqual(after, state);
  assert.deepEqual(C.allAnniversaries(after).find(a => a.id === 'relationship').photos, ['crossing']);
});
test('anniversary photos are optional, bounded, and limited to local raster data', () => {
  for (const builtin of [true, false]) {
    for (const bad of [null, 'shore', Array(13).fill('shore'), ['https://example.com/photo.jpg'], ['data:image/heic;base64,YWJj'], ['data:image/svg+xml;base64,YWJj']]) {
      const state = C.createDemo(); (builtin ? state.settings.anniversary : state.anniversaries[0]).photos = bad;
      assert.throws(() => C.validateState(state));
    }
    const state = C.createDemo(); const a = builtin ? state.settings.anniversary : state.anniversaries[0];
    a.photos = Array(12).fill('shore'); C.validateState(state);
    a.note = 'a'.repeat(1001); assert.throws(() => C.validateState(state), /Anniversary note/);
    a.note = null; assert.throws(() => C.validateState(state), /Anniversary note/);
  }
});
test('photo accounting and restore verification include both anniversary types', () => {
  const state = C.createDemo(); state.settings.anniversary.photos = ['relationship-photo'];
  state.anniversaries[0].photos = ['anniversary-photo'];
  const photos = C.photoSources(state);
  assert.ok(photos.includes('relationship-photo')); assert.ok(photos.includes('anniversary-photo'));
});
for (const template of ['summer', 'blue', 'film']) test(`${template} includes every anniversary photo and complete note in source order`, () => {
  for (const id of ['aoi-birthday', 'relationship']) {
    const state = C.createDemo(), a = id === 'relationship' ? state.settings.anniversary : state.anniversaries[0];
    a.photos = ['hydrangeas', 'shore', 'sparklers']; a.note = 'A summer worth remembering. '.repeat(30).trim();
    const before = structuredClone(state), book = B.generate(state, setup(template, id));
    const images = book.pages.slice(1).flatMap(p => p.elements.filter(e => e.type === 'image'));
    assert.deepEqual(images.map(e => book.assets[e.asset]), a.photos);
    assert.ok(images.every(e => e.fit === 'contain'));
    const notes = book.pages.slice(1).flatMap(p => p.elements.filter(e => e.type === 'text' && e.fontSize === 15).map(e => e.text));
    assert.equal(notes.join(' '), a.note);
    B.validate(book, C.imageSource);
    book.pages[1].elements.find(e => e.type === 'text').text = 'Book only';
    book.assets[images[0].asset] = 'crossing'; assert.deepEqual(state, before);
    const snapshot = structuredClone(book); a.photos = []; a.note = ''; state.anniversaries = [];
    assert.deepEqual(book, snapshot);
  }
});
test('date-only legacy anniversaries retain the existing cover fallback', () => {
  const state = C.createDemo(), book = B.generate(state, setup());
  const image = book.pages[1].elements.find(e => e.type === 'image');
  assert.equal(book.assets[image.asset], state.settings.cover); assert.equal(image.y, 230); assert.equal(image.h, 225);
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const zlib = require('node:zlib');
const C = require('../js/core.js');
const B = require('../js/book-model.js');
const E = require('../js/book-export.js');
const setup = (template = 'summer') => ({ title: 'Our summer', template, selection: [{ kind: 'memory', id: 'first-meeting' }, { kind: 'anniversary', id: 'relationship' }] });

test('v1 project data migrates without changing source memories or collection selection', () => {
  const before = C.createDemo(); before.version = 1; delete before.memoryBook;
  const after = C.validateState(before);
  assert.equal(after.version, 3); assert.equal(after.memoryBook, null);
  assert.deepEqual(after.memories, before.memories); assert.deepEqual(after.collection, before.collection);
});
test('a new unfinished book uses the old collection selection as its starting point', () => {
  const book = B.empty(C.createDemo()); assert.equal(book.stage, 'setup'); assert.equal(book.pages.length, 0);
  assert.equal(book.setup.selection.length, 4); assert.equal(book.setup.template, 'summer');
});
test('memories and anniversaries have unambiguous selection keys', () => {
  const source = B.sources(C.createDemo());
  assert.ok(source.some(s => s.kind === 'anniversary' && s.id === 'relationship'));
  assert.equal(new Set(source.map(B.key)).size, source.length);
});
test('generation preserves chosen order rather than sorting by date', () => {
  const config = setup(); config.selection.reverse();
  const book = B.generate(C.createDemo(), config);
  assert.equal(book.pages[1].source.kind, 'anniversary'); assert.equal(book.pages[2].source.kind, 'memory');
});
test('every original photo and all note text are included across generated pages', () => {
  const state = C.createDemo(); const long = ('A long but meaningful memory. ').repeat(30).trim(); state.memories[1].note = long;
  const book = B.generate(state, { ...setup(), selection: [{ kind: 'memory', id: 'first-trip' }] });
  const images = book.pages.slice(1).flatMap(p => p.elements.filter(e => e.type === 'image').map(e => book.assets[e.asset]));
  assert.deepEqual(images, ['sparklers', 'shore']);
  const notes = book.pages.slice(1).flatMap(p => p.elements.filter(e => e.type === 'text' && e.fontSize === 15).map(e => e.text));
  assert.equal(notes.join(' '), long);
});
test('all three named templates generate distinct, validated documents', () => {
  const documents = Object.keys(B.THEMES).map(t => B.generate(C.createDemo(), setup(t)));
  assert.deepEqual(Object.values(B.THEMES).map(t => t.name), ['Pure Summer', 'Blue Memories', 'Film Diary']);
  assert.equal(new Set(documents.map(d => d.pages[0].background)).size, 3);
  documents.forEach(d => assert.deepEqual(B.validate(B.compact(d), C.imageSource), B.compact(d)));
  assert.equal(documents[2].pages[0].elements.find(e => e.type === 'text').font, 'mono');
});
test('editing a book never changes a source memory or anniversary', () => {
  const state = C.createDemo(), original = structuredClone(state);
  const book = B.generate(state, setup()); book.pages[1].elements.find(e => e.type === 'text').text = 'Changed only here';
  book.pages[1].elements.splice(0, 1); assert.deepEqual(state, original);
});
test('book assets are deduplicated and images remain independent elements', () => {
  const book = B.generate(C.createDemo(), setup());
  const a = B.addAsset(book, 'shore'), b = B.addAsset(book, 'shore'); assert.equal(a, b);
  const el = B.imageElement(book, 'shore'); book.pages[0].elements.push(el);
  el.asset = B.addAsset(book, 'sparklers');
  assert.ok(book.pages[1].elements.filter(e => e.type === 'image').every(e => book.assets[e.asset] === 'crossing'));
});
test('compaction retains only assets referenced by current pages', () => {
  const book = B.generate(C.createDemo(), setup()); const unused = B.addAsset(book, 'sparklers');
  const compact = B.compact(book); assert.equal(compact.assets[unused], undefined);
  assert.ok(book.assets[unused]);
});
test('book backup round trip retains page text, order, active page, and photo assets', () => {
  const state = C.createDemo(); state.memoryBook = B.compact(B.generate(state, setup('blue')));
  state.memoryBook.activePageId = state.memoryBook.pages[1].id;
  state.memoryBook.pages[1].elements[0].text = 'A new caption';
  assert.deepEqual(C.parseBackup(C.backup(state)), state);
});
test('deleted source records do not invalidate an existing edited book', () => {
  const state = C.createDemo(); state.memoryBook = B.compact(B.generate(state, setup()));
  state.memories = []; state.collection.selected = []; state.anniversaries = [];
  assert.equal(C.validateState(state).memoryBook.pages.length, 3);
});
test('moving items is stable, bounded, and does not mutate its input', () => {
  const a = ['a', 'b', 'c']; assert.deepEqual(B.move(a, 2, 0), ['c', 'a', 'b']); assert.deepEqual(a, ['a', 'b', 'c']);
  assert.deepEqual(B.move(a, 0, -1), a); assert.deepEqual(B.move(a, 4, 0), a);
});
test('drag bounds prevent elements escaping the page', () => {
  const el = B.textElement('Hello', 0, 0, 100, 100);
  assert.equal(B.bounded(el, { x: -20 }).x, 0); assert.equal(B.bounded(el, { x: 900 }).x, 500);
  assert.equal(B.bounded(el, { y: 900 }).y, 700);
  assert.equal(B.bounded(el, { w: 5 }).w, 24); assert.equal(B.bounded(el, { h: 900 }).h, 800);
});
test('undo and redo restore immutable snapshots; a new edit clears redo', () => {
  const h = B.history(); const a = { value: 1 }; h.push(a); a.value = 99;
  assert.deepEqual(h.undo({ value: 2 }), { value: 1 });
  assert.deepEqual(h.redo({ value: 1 }), { value: 2 });
  h.undo({ value: 2 }); h.push({ value: 3 }); assert.equal(h.canRedo, false);
});
test('history is bounded and does not clone image data into every step', () => {
  const h = B.history(2); h.push({ n: 1 }); h.push({ n: 2 }); h.push({ n: 3 });
  assert.equal(h.undo({ n: 4 }).n, 3); assert.equal(h.undo({ n: 3 }).n, 2); assert.equal(h.undo({ n: 2 }), null);
  assert.equal(B.snapshot(B.generate(C.createDemo(), setup())).assets, undefined);
});
test('invalid numeric positions, colors, IDs, and missing assets are rejected', () => {
  for (const mutate of [b => { b.pages[0].elements[0].x = NaN; }, b => { b.pages[0].elements[0].color = 'url(https://evil)'; }, b => { b.pages[0].elements[0].x = 700; }, b => { b.pages[0].elements[1].id = b.pages[0].elements[0].id; }, b => { b.pages[0].elements.find(e => e.type === 'image').asset = 'missing'; }]) {
    const b = B.compact(B.generate(C.createDemo(), setup())); mutate(b); assert.throws(() => B.validate(b, C.imageSource), /invalid/);
  }
});
test('remote image sources and oversized books are rejected before restore', () => {
  const b = B.compact(B.generate(C.createDemo(), setup())); b.assets[Object.keys(b.assets)[0]] = 'https://example.com/image.jpg'; assert.throws(() => B.validate(b, C.imageSource), /embedded/);
  const tooMany = B.compact(B.generate(C.createDemo(), setup())); tooMany.pages = Array(41).fill(tooMany.pages[0]); assert.throws(() => B.validate(tooMany, C.imageSource), /invalid/);
});
test('generation rejects empty, duplicate, missing, and excessive selections', () => {
  const state = C.createDemo();
  assert.throws(() => B.generate(state, { ...setup(), selection: [] }), /between 1 and 12/);
  assert.throws(() => B.generate(state, { ...setup(), selection: Array(2).fill({ kind: 'memory', id: 'first-trip' }) }), /only once/);
  assert.throws(() => B.generate(state, { ...setup(), selection: [{ kind: 'memory', id: 'deleted' }] }), /removed/);
  state.memories = Array.from({ length: 4 }, (_, i) => ({ id: 'm' + i, title: 'Memory', note: '', date: '2024-01-01', photos: Array(12).fill('shore') }));
  assert.throws(() => B.generate(state, { ...setup(), selection: state.memories.map(m => ({ kind: 'memory', id: m.id })) }), /40 pages/);
});
test('CRC32 matches the standard test vector', () => assert.equal(E.crc32(Buffer.from('123456789')), 0xcbf43926));
test('PNG ZIP writer has valid headers, file bytes, CRC, and end directory', async () => {
  const blob = E.zip([{ name: 'page-01.png', bytes: Buffer.from('actual test bytes') }]); const bytes = Buffer.from(await blob.arrayBuffer());
  assert.equal(bytes.readUInt32LE(0), 0x04034b50); assert.equal(bytes.readUInt32LE(14), E.crc32(Buffer.from('actual test bytes')));
  assert.equal(bytes.readUInt32LE(bytes.length - 22), 0x06054b50); assert.equal(bytes.readUInt16LE(bytes.length - 14), 1);
  assert.ok(bytes.includes(Buffer.from('actual test bytes')));
});
test('PDF image stream is losslessly compressed RGB with correct pages and xref offsets', async () => {
  const rgb = Uint8Array.from([255, 0, 0, 0, 255, 0]); const compressed = await E.deflate(rgb);
  assert.deepEqual(zlib.inflateSync(compressed), Buffer.from(rgb));
  const blob = E.makePDF([{ width: 2, height: 1, bytes: compressed }, { width: 2, height: 1, bytes: compressed }]);
  const bytes = Buffer.from(await blob.arrayBuffer()), text = bytes.toString('latin1');
  assert.ok(text.startsWith('%PDF-1.4')); assert.match(text, /\/Count 2/); assert.match(text, /\/ColorSpace \/DeviceRGB/);
  const offset = Number(text.match(/startxref\n(\d+)/)[1]); assert.equal(text.slice(offset, offset + 4), 'xref');
  const entries = text.slice(offset).split('\n').slice(3, 11);
  entries.forEach((line, i) => { assert.ok(text.slice(Number(line.slice(0, 10))).startsWith(`${i + 1} 0 obj`)); });
});

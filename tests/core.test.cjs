const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/core.js');

test('demo book is valid and has usable photos, dates, and notes', () => {
  const book = C.validateState(C.createDemo());
  assert.equal(book.memories.length, 4);
  assert.ok(book.memories.every(m => m.photos.length && m.note && C.validDate(m.date)));
  assert.equal(book.collection.selected.length, 4);
});
test('date validation rejects impossible dates and loose formats', () => {
  for (const date of ['2025-02-29', '2024-04-31', '2024-1-1', '1899-12-31', '2201-01-01', '', null]) assert.equal(C.validDate(date), false, String(date));
  assert.equal(C.validDate('2024-02-29'), true);
});
test('elapsed days counts completed calendar days, including day zero', () => {
  assert.equal(C.daysBetween('2024-06-18', '2024-06-18'), 0);
  assert.equal(C.daysBetween('2024-06-18', '2025-06-18'), 365);
  assert.equal(C.daysBetween('2024-02-28', '2024-03-01'), 2);
});
test('day differences are independent of daylight-saving transitions', () => {
  assert.equal(C.daysBetween('2026-03-07', '2026-03-09'), 2);
  assert.equal(C.daysBetween('2026-10-31', '2026-11-02'), 2);
});
test('today uses local date fields, not an accidental UTC conversion', () => {
  assert.equal(C.today(new Date(2026, 0, 1, 0, 5)), '2026-01-01');
});
test('annual recurrence includes today and rolls past dates to next year', () => {
  const event = { date: '2020-06-18', repeat: true };
  assert.equal(C.nextOccurrence(event, '2026-06-17'), '2026-06-18');
  assert.equal(C.nextOccurrence(event, '2026-06-18'), '2026-06-18');
  assert.equal(C.nextOccurrence(event, '2026-06-19'), '2027-06-18');
});
test('a future annual event cannot occur before its initial date', () => {
  assert.equal(C.nextOccurrence({ date: '2030-05-01', repeat: true }, '2026-04-01'), '2030-05-01');
});
test('February 29 anniversaries clamp to February 28 in common years', () => {
  const event = { date: '2024-02-29', repeat: true };
  assert.equal(C.nextOccurrence(event, '2025-01-01'), '2025-02-28');
  assert.equal(C.nextOccurrence(event, '2025-03-01'), '2026-02-28');
  assert.equal(C.nextOccurrence(event, '2028-01-01'), '2028-02-29');
});
test('one-time past dates never recur', () => {
  assert.equal(C.nextOccurrence({ date: '2026-04-01', repeat: false }, '2026-04-02'), null);
  assert.equal(C.nextOccurrence({ date: '2026-04-01', repeat: false }, '2026-04-01'), '2026-04-01');
});
test('next anniversary sorts dates and includes the relationship anniversary', () => {
  const book = C.createDemo();
  book.anniversaries.push({ id: 'past', title: 'Past', date: '2020-01-01', repeat: false });
  const dates = C.allAnniversaries(book, '2026-06-12');
  assert.equal(dates[0].id, 'relationship');
  assert.equal(dates[0].remaining, 6);
  assert.equal(dates.at(-1).id, 'past');
});
test('backup round trip preserves notes, settings, and selected IDs', () => {
  const book = C.createDemo(); book.memories[0].note = 'A line\nAnother line & <a memory>';
  assert.deepEqual(C.parseBackup(C.backup(book)), book);
});
test('malformed JSON and unsupported backup versions are rejected', () => {
  assert.throws(() => C.parseBackup('{broken'), /not valid JSON/);
  assert.throws(() => C.validateState({ ...C.createDemo(), version: 42 }), /not a supported/);
  assert.throws(() => C.parseBackup('null'), /not a supported/);
});
test('unknown fields are discarded rather than assigned to prototypes', () => {
  const book = C.createDemo(); book.unexpected = 'ignored'; book.settings.unknown = 'ignored';
  const result = C.validateState(book);
  assert.equal(result.unexpected, undefined); assert.equal(result.settings.unknown, undefined);
});
test('backups cannot reference remote images, SVG, scripts, or paths', () => {
  for (const source of ['https://example.com/x.jpg', 'file:///private.jpg', 'javascript:alert(1)', 'data:image/svg+xml;base64,PHN2Zz4=', '../image.png']) {
    const book = C.createDemo(); book.memories[0].photos = [source]; assert.throws(() => C.validateState(book), /embedded/);
  }
});
test('embedded raster images pass structural validation', () => {
  assert.equal(C.imageSource('data:image/png;base64,YWJj'), 'data:image/png;base64,YWJj');
});
test('duplicate IDs and reserved anniversary ID are rejected', () => {
  const book = C.createDemo(); book.memories[1].id = book.memories[0].id; assert.throws(() => C.validateState(book), /duplicate/);
  const other = C.createDemo(); other.anniversaries[0].id = 'relationship'; assert.throws(() => C.validateState(other), /invalid data/);
});
test('missing and duplicate collection references are rejected', () => {
  const book = C.createDemo(); book.collection.selected = ['missing']; assert.throws(() => C.validateState(book), /missing memory/);
  book.collection.selected = ['birthday', 'birthday']; assert.throws(() => C.validateState(book), /different memories/);
});
test('empty or whitespace-only required text and oversized notes are rejected', () => {
  const book = C.createDemo(); book.settings.name1 = ' '; assert.throws(() => C.validateState(book), /First name/);
  const other = C.createDemo(); other.memories[0].note = 'a'.repeat(1001); assert.throws(() => C.validateState(other), /Memory note/);
});
test('memory photo count is bounded and empty projects remain valid', () => {
  const book = C.createDemo(); book.memories[0].photos = []; assert.throws(() => C.validateState(book), /1–12/);
  book.memories[0].photos = Array(13).fill('shore'); assert.throws(() => C.validateState(book), /1–12/);
  book.memories = []; book.collection.selected = []; assert.equal(C.validateState(book).memories.length, 0);
});
test('future relationship dates are rejected', () => {
  const book = C.createDemo(); book.settings.startDate = '2199-01-01'; assert.throws(() => C.validateState(book), /on or before today/);
});
test('user-supplied text is escaped for HTML, including attribute delimiters', () => {
  assert.equal(C.escapeHTML('<img onerror="x"> & \'a\''), '&lt;img onerror=&quot;x&quot;&gt; &amp; &#39;a&#39;');
});
test('English date formatting is stable across time zones', () => {
  assert.equal(C.formatDate('2024-06-18'), 'Jun 18, 2024');
  assert.equal(C.dottedDate('2024-06-18'), '2024.06.18');
});

/* Pure date, validation, and state helpers; shared by browser and Node tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OLD = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const Book = typeof module === 'object' && module.exports ? require('./book-model.js') : globalThis.BookModel;
  const DAY = 86400000;
  const MEDIA_KEYS = ['hero', 'crossing', 'sparklers', 'hydrangeas', 'shore'];
  const LIMITS = Object.freeze({ memories: 250, anniversaries: 100, photos: 12, collection: 12, backupBytes: 128 * 1024 * 1024, imageChars: 18000000 });
  function today(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split('-').map(Number);
    if (y < 1900 || y > 2200) return false;
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  }
  function dayNumber(value) {
    if (!validDate(value)) throw new Error('Please choose a valid date between 1900 and 2200.');
    const [y, m, d] = value.split('-').map(Number);
    return Date.UTC(y, m - 1, d) / DAY;
  }
  function daysBetween(a, b) { return dayNumber(b) - dayNumber(a); }
  function formatDate(date) {
    const [y, m, d] = date.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
  }
  function dottedDate(date) { return date.replaceAll('-', '.'); }
  function nextOccurrence(event, asOf = today()) {
    dayNumber(event.date); dayNumber(asOf);
    if (!event.repeat) return event.date >= asOf ? event.date : null;
    const [originalYear, month, day] = event.date.split('-').map(Number);
    let year = Math.max(Number(asOf.slice(0, 4)), originalYear);
    function inYear(y) {
      const last = new Date(Date.UTC(y, month, 0)).getUTCDate();
      return `${y}-${String(month).padStart(2, '0')}-${String(Math.min(day, last)).padStart(2, '0')}`;
    }
    let next = inYear(year);
    if (next < asOf) next = inYear(++year);
    return next;
  }
  function allAnniversaries(state, asOf = today()) {
    return [{ id: 'relationship', title: 'Our Anniversary', date: state.settings.startDate, repeat: true, builtIn: true, ...attachments(state.settings.anniversary) }, ...state.anniversaries]
      .map(item => { const next = nextOccurrence(item, asOf); return { ...item, next, remaining: next ? daysBetween(asOf, next) : null }; })
      .sort((a, b) => (a.next || '9999').localeCompare(b.next || '9999') || a.title.localeCompare(b.title));
  }
  function text(value, max, label, empty = false) {
    if (typeof value !== 'string' || value.length > max || (!empty && !value.trim())) throw new Error(`${label} must be ${empty ? 'at most' : 'between 1 and'} ${max} characters.`);
    return value.trim();
  }
  function id(value) {
    if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(value)) throw new Error('A saved item has an invalid ID.');
    return value;
  }
  function imageSource(value) {
    if (MEDIA_KEYS.includes(value)) return value;
    if (typeof value !== 'string' || value.length > LIMITS.imageChars || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new Error('Photos must be embedded PNG, JPEG, or WebP images.');
    return value;
  }
  function unique(items) { if (new Set(items.map(x => x.id)).size !== items.length) throw new Error('The backup contains duplicate item IDs.'); }
  function attachments(value) {
    if (value !== undefined && (!value || typeof value !== 'object' || Array.isArray(value))) throw new Error('An anniversary has invalid attachments.');
    const photos = value?.photos === undefined ? [] : value.photos;
    if (!Array.isArray(photos) || photos.length > LIMITS.photos) throw new Error('Each anniversary can have up to 12 photos.');
    return { note: text(value?.note === undefined ? '' : value.note, 1000, 'Anniversary note', true), photos: photos.map(imageSource) };
  }
  function photoSources(state) {
    return [state.settings.cover, ...(state.settings.anniversary?.photos || []), ...state.memories.flatMap(m => m.photos), ...state.anniversaries.flatMap(a => a.photos || []), ...Object.values(state.memoryBook?.assets || {})];
  }
  function validateState(raw) {
    if (!raw || ![1, 2, 3].includes(raw.version) || !raw.settings || !Array.isArray(raw.memories) || !Array.isArray(raw.anniversaries)) throw new Error('This is not a supported Our Little Days backup (version 1, 2, or 3).');
    if (raw.memories.length > LIMITS.memories || raw.anniversaries.length > LIMITS.anniversaries) throw new Error('This backup exceeds the project item limit.');
    const settings = { name1: text(raw.settings.name1, 40, 'First name'), name2: text(raw.settings.name2, 40, 'Second name'), startDate: raw.settings.startDate, cover: imageSource(raw.settings.cover), anniversary: attachments(raw.settings.anniversary) };
    if (!validDate(settings.startDate) || settings.startDate > today()) throw new Error('The relationship start date must be a valid date on or before today.');
    const memories = raw.memories.map(m => {
      if (!m || !validDate(m.date)) throw new Error('A memory has an invalid date.');
      if (!Array.isArray(m.photos) || !m.photos.length || m.photos.length > LIMITS.photos) throw new Error('Each memory needs 1–12 photos.');
      return { id: id(m.id), title: text(m.title, 80, 'Memory title'), date: m.date, note: text(m.note, 1000, 'Memory note', true), photos: m.photos.map(imageSource) };
    });
    const anniversaries = raw.anniversaries.map(a => {
      if (!a || !validDate(a.date) || typeof a.repeat !== 'boolean' || a.id === 'relationship') throw new Error('An anniversary has invalid data.');
      return { id: id(a.id), title: text(a.title, 80, 'Anniversary title'), date: a.date, repeat: a.repeat, ...attachments(a) };
    });
    unique(memories); unique(anniversaries);
    const collection = raw.collection || { title: 'Our days, together', selected: [] };
    if (!Array.isArray(collection.selected) || collection.selected.length > LIMITS.collection || new Set(collection.selected).size !== collection.selected.length) throw new Error('A collection can contain up to 12 different memories.');
    const known = new Set(memories.map(m => m.id));
    if (collection.selected.some(value => !known.has(value))) throw new Error('The collection refers to a missing memory.');
    return { version: 3, settings, memories, anniversaries, collection: { title: text(collection.title, 80, 'Collection title'), selected: [...collection.selected] }, memoryBook: Book.validate(raw.memoryBook, imageSource) };
  }
  function parseBackup(content) {
    let value;
    try { value = JSON.parse(content); } catch { throw new Error('The backup is not valid JSON. Your current book has not changed.'); }
    return validateState(value?.app === 'Our Little Days' ? value.data : value);
  }
  function backup(state) { return JSON.stringify({ app: 'Our Little Days', version: 3, exportedAt: new Date().toISOString(), data: validateState(state) }, null, 2); }
  function createDemo() {
    return {
      version: 3,
      memoryBook: null,
      settings: { name1: 'Haru', name2: 'Aoi', startDate: '2024-06-18', cover: 'hero', anniversary: { note: '', photos: [] } },
      memories: [
        { id: 'first-meeting', title: 'The First Meeting', date: '2024-06-18', photos: ['crossing'], note: 'We missed the train and walked toward the sea instead. The beginning of our favorite detour.' },
        { id: 'first-trip', title: 'Our First Trip', date: '2024-08-10', photos: ['sparklers', 'shore'], note: 'Salt in our hair, sand in our shoes, and a pocketful of sparklers. We stayed until the last light left the water.' },
        { id: 'birthday', title: 'Your Birthday', date: '2025-06-10', photos: ['hydrangeas'], note: 'Blue hydrangeas, a little cake, and nowhere else we needed to be. A whole day just for you.' },
        { id: 'anniversary', title: 'Our Anniversary', date: '2025-06-18', photos: ['shore', 'hero'], note: 'Back to the same shore, a year of little days later. Still my favorite place, as long as you are here.' }
      ],
      anniversaries: [{ id: 'aoi-birthday', title: "Aoi’s Birthday", date: '2000-06-10', repeat: true, note: '', photos: [] }],
      collection: { title: 'Our days, together', selected: ['first-meeting', 'first-trip', 'birthday', 'anniversary'] }
    };
  }
  function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
  function makeId() { return 'item-' + (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`); }
  return { LIMITS, today, validDate, dayNumber, daysBetween, formatDate, dottedDate, nextOccurrence, allAnniversaries, validateState, parseBackup, backup, createDemo, escapeHTML, makeId, imageSource, photoSources };
});

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BookModel = api;
})(globalThis, function () {
  'use strict';
  const WIDTH = 600, HEIGHT = 800;
  const LIMITS = Object.freeze({ selections: 12, pages: 40, elements: 40, assets: 160, history: 50 });
  const THEMES = Object.freeze({
    summer: { name: 'Pure Summer', background: '#ffffff', ink: '#193647', muted: '#657f91', accent: '#4c87ae', font: 'sans', frame: '#ffffff', radius: 8 },
    blue: { name: 'Blue Memories', background: '#e7f2fb', ink: '#234e70', muted: '#537c9b', accent: '#397eae', font: 'sans', frame: '#ffffff', radius: 4 },
    film: { name: 'Film Diary', background: '#f5f5f3', ink: '#282d31', muted: '#747b81', accent: '#526977', font: 'serif', frame: '#272d32', radius: 0 }
  });
  const clone = value => structuredClone(value);
  const uid = () => 'b-' + (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  function key(item) { return `${item.kind}:${item.id}`; }
  function sources(state) {
    return [
      ...state.memories.map(m => ({ ...m, kind: 'memory', subtitle: 'Memory' })),
      { id: 'relationship', kind: 'anniversary', title: 'Our Anniversary', date: state.settings.startDate, note: state.settings.anniversary?.note || '', photos: state.settings.anniversary?.photos || [], subtitle: 'Anniversary' },
      ...state.anniversaries.map(a => ({ ...a, kind: 'anniversary', photos: a.photos || [], note: a.note || '', subtitle: a.repeat ? 'Annual date' : 'One-time date' }))
    ];
  }
  function empty(state) {
    return { version: 1, stage: 'setup', setup: { title: state.collection?.title || 'Our days, together', template: 'summer', selection: (state.collection?.selected || []).map(id => ({ kind: 'memory', id })) }, template: 'summer', title: state.collection?.title || 'Our days, together', assets: {}, pages: [], activePageId: null };
  }
  function bounded(el, delta = {}) {
    const value = { ...el, ...delta };
    value.w = Math.max(24, Math.min(WIDTH, value.w)); value.h = Math.max(24, Math.min(HEIGHT, value.h));
    value.x = Math.max(0, Math.min(WIDTH - value.w, value.x)); value.y = Math.max(0, Math.min(HEIGHT - value.h, value.y));
    for (const k of ['x', 'y', 'w', 'h']) value[k] = Math.round(value[k] * 100) / 100;
    return value;
  }
  function move(array, from, to) {
    const result = [...array];
    if (from < 0 || from >= array.length || to < 0 || to >= array.length) return result;
    result.splice(to, 0, result.splice(from, 1)[0]); return result;
  }
  function snapshot(book) { const { assets, ...document } = book; return clone(document); }
  function history(limit = LIMITS.history) {
    const undo = [], redo = [];
    return {
      push(before) { undo.push(clone(before)); if (undo.length > limit) undo.shift(); redo.length = 0; },
      undo(current) { if (!undo.length) return null; redo.push(clone(current)); return undo.pop(); },
      redo(current) { if (!redo.length) return null; undo.push(clone(current)); return redo.pop(); },
      get canUndo() { return undo.length > 0; }, get canRedo() { return redo.length > 0; }
    };
  }
  function compact(book) {
    const needed = new Set(book.pages.flatMap(p => p.elements.filter(e => e.type === 'image').map(e => e.asset)));
    return { ...snapshot(book), assets: Object.fromEntries([...needed].map(id => [id, book.assets[id]])) };
  }
  function addAsset(book, source) {
    const found = Object.keys(book.assets).find(id => book.assets[id] === source);
    if (found) return found;
    const id = uid(); book.assets[id] = source; return id;
  }
  function textElement(text, x = 60, y = 80, w = 320, h = 90, options = {}) {
    return bounded({ id: uid(), type: 'text', text, x, y, w, h, fontSize: 24, color: '#193647', align: 'left', font: 'sans', weight: 400, ...options });
  }
  function imageElement(book, source, x = 90, y = 160, w = 360, h = 300, theme = THEMES.summer) {
    return bounded({ id: uid(), type: 'image', asset: addAsset(book, source), x, y, w, h, fit: 'cover', radius: theme.radius, frame: theme.frame, frameWidth: theme === THEMES.film ? 10 : theme === THEMES.blue ? 8 : 0 });
  }
  function chunks(text, size = 350) {
    const parts = []; let remaining = text || '';
    while (remaining.length > size) {
      const space = remaining.lastIndexOf(' ', size); const cut = space > size / 2 ? space : size;
      parts.push(remaining.slice(0, cut)); remaining = remaining.slice(cut).trimStart();
    }
    if (remaining) parts.push(remaining); return parts;
  }
  function dateLabel(date) { return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z')); }
  function generate(state, setup, previousAssets = {}) {
    if (!setup.title.trim()) throw new Error('Give your book a title.');
    if (!THEMES[setup.template]) throw new Error('Choose one of the three templates.');
    if (!setup.selection.length || setup.selection.length > LIMITS.selections) throw new Error('Choose between 1 and 12 memories or anniversaries.');
    const all = new Map(sources(state).map(s => [key(s), s]));
    const chosen = setup.selection.map(s => { const item = all.get(key(s)); if (!item) throw new Error('A selected item was removed. Choose your content again.'); return item; });
    if (new Set(setup.selection.map(key)).size !== setup.selection.length) throw new Error('Choose each memory or anniversary only once.');
    const book = { version: 1, stage: 'edit', setup: clone(setup), title: setup.title.trim(), template: setup.template, assets: { ...previousAssets }, pages: [], activePageId: null };
    const t = THEMES[setup.template], blue = setup.template === 'blue', film = setup.template === 'film';
    function txt(value, x, y, w, h, size, more = {}) { return textElement(value, x, y, w, h, { fontSize: size, color: t.ink, font: t.font, ...more }); }
    function page(title, source = null) { const p = { id: uid(), title: title.slice(0, 100), background: t.background, source, elements: [] }; book.pages.push(p); return p; }
    const cover = page('Cover');
    cover.elements.push(txt('OUR LITTLE DAYS', 48, 52, 504, 26, 12, { color: t.accent, font: film ? 'mono' : 'sans', align: blue ? 'center' : 'left' }));
    cover.elements.push(txt(book.title, 48, 111, 504, 130, book.title.length > 45 ? 30 : film ? 44 : 42, { align: blue ? 'center' : 'left' }));
    cover.elements.push(txt(`${state.settings.name1} & ${state.settings.name2}`, 48, 250, 504, 64, 20, { color: t.muted, align: blue ? 'center' : 'left' }));
    cover.elements.push(imageElement(book, state.settings.cover, film ? 60 : 48, 374, film ? 480 : 504, 225, t));
    cover.elements.push(txt('A record of our days, big and small.', 48, 712, 504, 45, 15, { color: t.muted, align: blue ? 'center' : 'left' }));
    for (const source of chosen) {
      const note = chunks(source.note, 350), photos = source.photos.length ? source.photos : [state.settings.cover];
      const count = Math.max(photos.length, note.length, 1);
      for (let i = 0; i < count; i++) {
        const anniversary = source.kind === 'anniversary', panoramicCover = anniversary && !source.photos.length;
        const p = page(i ? `${source.title} · ${i + 1}` : source.title, { kind: source.kind, id: source.id });
        p.elements.push(txt(source.kind === 'anniversary' ? 'A DAY TO REMEMBER' : 'A LITTLE DAY', 48, 40, 504, 25, 11, { color: t.accent, font: film ? 'mono' : 'sans' }));
        p.elements.push(txt(source.title, 48, 81, 504, 90, source.title.length > 55 ? 23 : 31, { align: blue ? 'center' : 'left' }));
        if (photos[i]) {
          const image = imageElement(book, photos[i], 48, panoramicCover ? 230 : 185, 504, panoramicCover ? 225 : note[i] ? 300 : 390, t);
          if (anniversary && source.photos.length) image.fit = 'contain';
          p.elements.push(image);
        }
        p.elements.push(txt(dateLabel(source.date), 48, photos[i] ? (panoramicCover || note[i] ? 510 : 604) : 198, 504, 32, 13, { color: t.muted, font: film ? 'mono' : 'sans', align: blue ? 'center' : 'left' }));
        if (note[i]) p.elements.push(txt(note[i], 48, photos[i] ? 561 : 266, 504, photos[i] ? 175 : 420, 15, { color: t.muted }));
        p.elements.push(txt(String(book.pages.length).padStart(2, '0'), 48, 754, 504, 24, 11, { color: t.muted, align: 'right', font: 'sans' }));
      }
    }
    if (book.pages.length > LIMITS.pages) throw new Error('These items would create more than 40 pages. Choose fewer memories or photos.');
    book.activePageId = book.pages[0].id; return book;
  }
  function validate(raw, validateSource) {
    if (raw == null) return null;
    const fail = () => { throw new Error('The Memory Book contains invalid or unsupported page data.'); };
    const isId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
    const isText = (value, max) => typeof value === 'string' && value.length <= max;
    const isColor = value => typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
    const finite = (n, min, max) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
    if (raw.version !== 1 || !['setup', 'edit'].includes(raw.stage) || !THEMES[raw.template] || !isText(raw.title, 80) || !raw.assets || Array.isArray(raw.assets) || typeof raw.assets !== 'object' || !raw.setup) fail();
    const setup = raw.setup;
    if (!isText(setup.title, 80) || !THEMES[setup.template] || !Array.isArray(setup.selection) || setup.selection.length > LIMITS.selections) fail();
    const selection = setup.selection.map(s => { if (!s || !['memory', 'anniversary'].includes(s.kind) || !isId(s.id)) fail(); return { kind: s.kind, id: s.id }; });
    if (new Set(selection.map(key)).size !== selection.length) fail();
    const entries = Object.entries(raw.assets); if (entries.length > LIMITS.assets) fail();
    const assets = Object.fromEntries(entries.map(([id, src]) => { if (!isId(id) || ['__proto__', 'constructor', 'prototype'].includes(id)) fail(); return [id, validateSource(src)]; }));
    if (!Array.isArray(raw.pages) || raw.pages.length > LIMITS.pages || (raw.stage === 'edit' && !raw.pages.length)) fail();
    const pageIds = new Set(); const objectIds = new Set();
    const pages = raw.pages.map(p => {
      if (!p || !isId(p.id) || pageIds.has(p.id) || !isText(p.title, 100) || !isColor(p.background) || !Array.isArray(p.elements) || p.elements.length > LIMITS.elements) fail();
      pageIds.add(p.id);
      let source = null;
      if (p.source) { if (!['memory', 'anniversary'].includes(p.source.kind) || !isId(p.source.id)) fail(); source = { kind: p.source.kind, id: p.source.id }; }
      const elements = p.elements.map(el => {
        if (!el || !isId(el.id) || objectIds.has(el.id) || !['text', 'image'].includes(el.type) || !finite(el.w, 24, WIDTH) || !finite(el.h, 24, HEIGHT) || !finite(el.x, 0, WIDTH - el.w + .01) || !finite(el.y, 0, HEIGHT - el.h + .01)) fail();
        objectIds.add(el.id);
        const base = { id: el.id, type: el.type, x: el.x, y: el.y, w: el.w, h: el.h };
        if (el.type === 'text') {
          if (!isText(el.text, 5000) || !finite(el.fontSize, 8, 96) || !isColor(el.color) || !['left', 'center', 'right'].includes(el.align) || !['sans', 'serif', 'mono'].includes(el.font) || ![400, 600].includes(el.weight)) fail();
          return { ...base, text: el.text, fontSize: el.fontSize, color: el.color, align: el.align, font: el.font, weight: el.weight };
        }
        if (!Object.hasOwn(assets, el.asset) || !['cover', 'contain'].includes(el.fit) || !finite(el.radius, 0, 40) || !isColor(el.frame) || !finite(el.frameWidth, 0, 20)) fail();
        return { ...base, asset: el.asset, fit: el.fit, radius: el.radius, frame: el.frame, frameWidth: el.frameWidth };
      });
      return { id: p.id, title: p.title, background: p.background, source, elements };
    });
    if (pages.length ? !pageIds.has(raw.activePageId) : raw.activePageId !== null) fail();
    return { version: 1, stage: raw.stage, setup: { title: setup.title, template: setup.template, selection }, template: raw.template, title: raw.title, assets, pages, activePageId: raw.activePageId };
  }
  return { WIDTH, HEIGHT, LIMITS, THEMES, clone, uid, key, sources, empty, bounded, move, snapshot, history, compact, addAsset, textElement, imageElement, chunks, generate, validate };
});

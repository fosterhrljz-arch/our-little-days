(function () {
  'use strict';
  const fonts = { sans: 'Arial, sans-serif', serif: 'Georgia, serif', mono: '"Courier New", monospace' };
  const images = new Map();
  function image(source) {
    if (!images.has(source)) { const pending = OLDImages.load(source).catch(error => { images.delete(source); throw error; }); images.set(source, pending); }
    return images.get(source);
  }
  function lines(ctx, text, width) {
    const output = [];
    for (const paragraph of text.replace(/\r/g, '').split('\n')) {
      if (!paragraph) { output.push(''); continue; }
      let line = '';
      for (let word of paragraph.split(/\s+/)) {
        const proposed = line ? line + ' ' + word : word;
        if (ctx.measureText(proposed).width <= width) { line = proposed; continue; }
        if (line) { output.push(line); line = ''; }
        while (ctx.measureText(word).width > width && word.length > 1) {
          let end = word.length;
          while (end > 1 && ctx.measureText(word.slice(0, end)).width > width) end--;
          output.push(word.slice(0, end)); word = word.slice(end);
        }
        line = word;
      }
      output.push(line);
    }
    return output;
  }
  function textLayout(ctx, el) {
    ctx.font = `${el.weight} ${el.fontSize}px ${fonts[el.font]}`;
    const wrapped = lines(ctx, el.text, Math.max(1, el.w - 4));
    return { lines: wrapped, lineHeight: el.fontSize * 1.35, overflow: wrapped.length * el.fontSize * 1.35 > el.h + .5 };
  }
  async function draw(book, page, canvas, scale = 4, omittedId = null) {
    // Preload before touching the target canvas, so stale async paints can be discarded by callers.
    const loaded = new Map();
    for (const el of page.elements) if (el.type === 'image') loaded.set(el.id, await image(book.assets[el.asset]));
    canvas.width = Math.round(BookModel.WIDTH * scale); canvas.height = Math.round(BookModel.HEIGHT * scale);
    const ctx = canvas.getContext('2d'); ctx.scale(scale, scale);
    ctx.fillStyle = page.background; ctx.fillRect(0, 0, BookModel.WIDTH, BookModel.HEIGHT);
    const overflows = [];
    for (const el of page.elements) {
      if (el.id === omittedId) continue;
      ctx.save();
      if (el.type === 'image') {
        ctx.beginPath(); ctx.roundRect(el.x, el.y, el.w, el.h, Math.min(el.radius, el.w / 2, el.h / 2)); ctx.clip();
        ctx.fillStyle = el.frame; ctx.fillRect(el.x, el.y, el.w, el.h);
        const frame = Math.min(el.frameWidth, el.w / 4, el.h / 4), x = el.x + frame, y = el.y + frame, w = el.w - frame * 2, h = el.h - frame * 2;
        const img = loaded.get(el.id);
        const ratio = (el.fit === 'cover' ? Math.max : Math.min)(w / img.naturalWidth, h / img.naturalHeight);
        ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
        ctx.drawImage(img, x + (w - img.naturalWidth * ratio) / 2, y + (h - img.naturalHeight * ratio) / 2, img.naturalWidth * ratio, img.naturalHeight * ratio);
      } else {
        const layout = textLayout(ctx, el); if (layout.overflow) overflows.push(el.id);
        ctx.beginPath(); ctx.rect(el.x, el.y, el.w, el.h); ctx.clip();
        ctx.fillStyle = el.color; ctx.textAlign = el.align; ctx.textBaseline = 'top';
        const x = el.align === 'center' ? el.x + el.w / 2 : el.align === 'right' ? el.x + el.w - 2 : el.x + 2;
        layout.lines.forEach((line, index) => ctx.fillText(line, x, el.y + index * layout.lineHeight));
      }
      ctx.restore();
    }
    return overflows;
  }
  async function page(book, value, scale = 4, omittedId = null) { const canvas = document.createElement('canvas'); await draw(book, value, canvas, scale, omittedId); return canvas; }
  function blob(canvas) { return new Promise((resolve, reject) => canvas.toBlob(data => data ? resolve(data) : reject(new Error('This page could not be exported.')), 'image/png')); }
  function clear() { images.clear(); }
  window.BookRender = { fonts, lines, textLayout, draw, page, blob, clear };
})();

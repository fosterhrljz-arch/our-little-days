(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BookExport = api;
})(globalThis, function () {
  'use strict';
  const utf8 = value => new TextEncoder().encode(value);
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  function crc32(bytes) { let crc = 0xffffffff; for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8); return (crc ^ 0xffffffff) >>> 0; }
  function zip(entries) {
    const parts = [], central = []; let offset = 0, centralLength = 0;
    for (const entry of entries) {
      const name = utf8(entry.name), bytes = entry.bytes, crc = crc32(bytes);
      const local = new Uint8Array(30 + name.length), l = new DataView(local.buffer);
      l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x800, true); l.setUint16(12, 0x21, true);
      l.setUint32(14, crc, true); l.setUint32(18, bytes.length, true); l.setUint32(22, bytes.length, true); l.setUint16(26, name.length, true); local.set(name, 30);
      const record = new Uint8Array(46 + name.length), d = new DataView(record.buffer);
      d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true); d.setUint16(8, 0x800, true); d.setUint16(14, 0x21, true);
      d.setUint32(16, crc, true); d.setUint32(20, bytes.length, true); d.setUint32(24, bytes.length, true); d.setUint16(28, name.length, true); d.setUint32(42, offset, true); record.set(name, 46);
      parts.push(local, bytes); central.push(record); offset += local.length + bytes.length; centralLength += record.length;
    }
    const end = new Uint8Array(22), view = new DataView(end.buffer);
    view.setUint32(0, 0x06054b50, true); view.setUint16(8, entries.length, true); view.setUint16(10, entries.length, true); view.setUint32(12, centralLength, true); view.setUint32(16, offset, true);
    return new Blob([...parts, ...central, end], { type: 'application/zip' });
  }
  async function deflate(bytes) {
    if (typeof CompressionStream === 'undefined') throw new Error('PDF export needs a browser with CompressionStream support. Use an up-to-date Chrome or Edge browser, or export PNG pages.');
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
  }
  function makePDF(pages) {
    const parts = [], offsets = [0]; let length = 0;
    const append = value => { const bytes = typeof value === 'string' ? utf8(value) : value; parts.push(bytes); length += bytes.length; };
    function object(id, body) { offsets[id] = length; append(`${id} 0 obj\n`); for (const part of Array.isArray(body) ? body : [body]) append(part); append('\nendobj\n'); }
    append('%PDF-1.4\n% Our Little Days\n');
    object(1, '<< /Type /Catalog /Pages 2 0 R >>');
    object(2, `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] >>`);
    pages.forEach((p, i) => {
      const n = 3 + i * 3;
      object(n, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /XObject << /Im0 ${n + 1} 0 R >> >> /Contents ${n + 2} 0 R >>`);
      object(n + 1, [`<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${p.bytes.length} >>\nstream\n`, p.bytes, '\nendstream']);
      const content = 'q\n600 0 0 800 0 0 cm\n/Im0 Do\nQ';
      object(n + 2, `<< /Length ${utf8(content).length} >>\nstream\n${content}\nendstream`);
    });
    const xref = length;
    append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
    for (let i = 1; i < offsets.length; i++) append(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
    append(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(parts, { type: 'application/pdf' });
  }
  async function exportBook(book, format, onProgress = () => {}) {
    if (!book.pages.length) throw new Error('Generate your book before exporting.');
    const output = [];
    for (let i = 0; i < book.pages.length; i++) {
      onProgress(i + 1, book.pages.length);
      const canvas = await BookRender.page(book, book.pages[i], 4);
      if (format === 'png') output.push({ name: `page-${String(i + 1).padStart(2, '0')}.png`, bytes: new Uint8Array(await (await BookRender.blob(canvas)).arrayBuffer()) });
      else {
        const rgba = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        const rgb = new Uint8Array(canvas.width * canvas.height * 3);
        for (let src = 0, dst = 0; src < rgba.length; src += 4) { rgb[dst++] = rgba[src]; rgb[dst++] = rgba[src + 1]; rgb[dst++] = rgba[src + 2]; }
        output.push({ width: canvas.width, height: canvas.height, bytes: await deflate(rgb) });
      }
      canvas.width = canvas.height = 1;
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    return format === 'png' ? zip(output) : makePDF(output);
  }
  return { crc32, zip, deflate, makePDF, exportBook };
});

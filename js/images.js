(function () {
  'use strict';
  const accept = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
  const formatHelp = 'JPEG (.jpg, .jpeg), PNG, or WebP. Up to 20 MB each.';
  const heicHelp = 'HEIC/HEIF is not supported. Convert to JPEG, PNG, or WebP before uploading.';
  const source = value => window.OLD_MEDIA[value] || value;
  function load(value) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('A photo could not be opened. Please choose a valid JPEG, PNG, or WebP file.'));
      img.src = source(value);
    });
  }
  async function read(file) {
    if (/^image\/hei[cf](?:-sequence)?$/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) throw new Error(heicHelp);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && !(file.type === '' && /\.(jpe?g|png|webp)$/i.test(file.name))) throw new Error('Please choose a JPEG, PNG, or WebP image. ' + heicHelp);
    if (file.size > 20 * 1024 * 1024) throw new Error('Each original photo must be under 20 MB.');
    const url = URL.createObjectURL(file);
    try {
      const img = await load(url);
      if (img.naturalWidth * img.naturalHeight > 80000000) throw new Error('This photo is too large to process. Please use an image below 80 megapixels.');
      const scale = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale); canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.9);
    } finally { URL.revokeObjectURL(url); }
  }
  async function verify(state) {
    const sources = new Set(window.OLD.photoSources(state));
    for (const value of sources) {
      const img = await load(value);
      if (!img.naturalWidth || img.naturalWidth * img.naturalHeight > 80000000) throw new Error('The backup contains an unsupported photo.');
    }
  }
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  window.OLDImages = { source, load, read, verify, download, accept, formatHelp, heicHelp };
})();

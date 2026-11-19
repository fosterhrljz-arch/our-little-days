(async function () {
  'use strict';
  const C = window.OLD, I = window.OLDImages, e = C.escapeHTML;
  const main = document.querySelector('#main'), dialog = document.querySelector('#dialog');
  const routes = ['home', 'memories', 'anniversaries', 'collection', 'settings'];
  let state, revision = 0, saving = false, sort = 'oldest', toastTimer, lastDay = C.today();
  let draftPhotos = [], draftCover, returnFocus, rawSaved;
  let bookEditor = null, commitQueue = Promise.resolve(), navigationVersion = 0;
  const paths = {
    home: '<path d="m3 10 9-7 9 7v11H7V10h10v11M10 21v-7h4v7"/>',
    memories: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>',
    anniversaries: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18m-13 5 3 3 5-5"/>',
    collection: '<path d="m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
    settings: '<path d="m9 3-.5 3-2 .9L4 6l-2 3 2.4 2v2L2 15l2 3 2.5-.9 2 .9.5 3h6l.5-3 2-.9 2.5.9 2-3-2.4-2v-2L22 9l-2-3-2.5.9-2-.9L15 3H9Z"/><circle cx="12" cy="12" r="3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>', left: '<path d="m15 5-7 7 7 7"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    edit: '<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15l-1 5Z"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>'
  };
  function icon(name) { return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.memories}</svg>`; }
  function photo(src, alt, cls = '') { return `<img class="${cls}" src="${e(I.source(src))}" alt="${e(alt)}" draggable="false">`; }
  function button(label, action, style = '', symbol = '', extra = '') { return `<button type="button" class="button ${style}" data-action="${action}" ${extra}>${symbol ? icon(symbol) : ''}${label}</button>`; }
  function iconButton(label, action, symbol, extra = '') { return `<button type="button" class="icon-button" aria-label="${e(label)}" title="${e(label)}" data-action="${action}" ${extra}>${icon(symbol)}</button>`; }
  function toast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 4200); }
  function showError(message, scope = dialog.open ? dialog : main) { const target = scope.querySelector('.inline-error'); if (target) { target.textContent = message; target.scrollIntoView({ block: 'nearest' }); } else toast(message); }
  function commit(next) {
    const operation = async () => {
      const validated = C.validateState(typeof next === 'function' ? next(state) : next);
      const photoSize = C.photoSources(validated).reduce((sum, src) => sum + I.source(src).length, 0);
      if (photoSize > 100 * 1024 * 1024) throw new Error('This project has reached its 100 MB photo limit. Download a backup, then remove some photos before adding more.');
      saving = true;
      try { revision = await OLDStore.save(validated, revision); state = validated; }
      finally { saving = false; }
    };
    const pending = commitQueue.then(operation);
    commitQueue = pending.catch(() => {});
    return pending;
  }
  function copy() { return structuredClone(state); }
  function currentRoute() { const key = location.hash.slice(1); return routes.includes(key) ? key : 'home'; }
  function orderedMemories() { return [...state.memories].sort((a, b) => (sort === 'oldest' ? 1 : -1) * a.date.localeCompare(b.date)); }
  function titleHead(title, subtitle, action = '') { return `<header class="page-head"><div><h1>${title}</h1><p>${subtitle}</p></div>${action}</header>`; }
  function memoryCard(m, expanded = false) {
    return `<button class="memory-card" data-action="open-memory" data-id="${m.id}" data-memory="${m.id}" aria-label="Open ${e(m.title)}">${photo(m.photos[0], m.title)}<span class="card-copy"><time class="card-date" datetime="${m.date}">${C.dottedDate(m.date)}</time><h3>${e(m.title)}</h3>${expanded ? `<p class="memory-note">${e(m.note)}</p><span class="photo-count">${m.photos.length} ${m.photos.length === 1 ? 'photo' : 'photos'}</span>` : ''}</span></button>`;
  }
  function nextCard(interactive = true) {
    const next = C.allAnniversaries(state).find(a => a.next);
    if (!next) return '';
    const tag = interactive ? 'button' : 'section';
    return `<${tag} class="next-card" ${interactive ? 'data-action="go-anniversaries" aria-label="View upcoming anniversaries"' : 'aria-label="Next anniversary"'}><div class="next-content"><div class="next-label">${icon('anniversaries')} Next Anniversary</div><div class="next-info"><div><h3>${e(next.title)}</h3><time datetime="${next.next}">${C.dottedDate(next.next)}</time></div><div class="countdown"><strong>${next.remaining === 0 ? '0' : next.remaining}</strong><span>${next.remaining === 0 ? 'today' : next.remaining === 1 ? 'day' : 'days'}</span></div></div></div>${photo('sky', 'Soft clouds in a summer sky', 'next-image')}</${tag}>`;
  }
  function home() {
    const s = state.settings;
    const memories = [...state.memories].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
    return `<section class="view home-page"><div class="hero ${s.cover !== 'hero' ? 'custom' : ''}"><div class="hero-copy"><p class="eyebrow">OUR LITTLE DAYS</p><h1>Together</h1><p class="hero-subtitle">A record of our days, big and small.</p><p class="couple-names">${e(s.name1)} &amp; ${e(s.name2)}</p><div class="duration"><p>In a relationship for</p><div class="duration-number">${C.daysBetween(s.startDate, C.today()).toLocaleString('en-US')}<span>days</span></div></div><a href="#memories" class="hero-link">Explore memories ${icon('arrow')}</a></div>${photo(s.cover, 'A couple sitting together beside the summer sea', 'hero-image')}</div><div class="home-bottom"><section><div class="section-bar"><h2>Our Memories</h2>${button('Add Memory', 'add-memory', '', 'plus')}</div>${memories.length ? `<div class="memory-grid">${memories.map(m => memoryCard(m)).join('')}</div><div class="view-all"><a class="text-link" href="#memories">View all memories ${icon('chevron')}</a></div>` : `<div class="empty"><h3>The beginning of your story</h3><p>Add a photo and a little note to remember this day.</p></div>`}</section>${nextCard()}</div></section>`;
  }
  function memoriesPage() {
    return `<section class="view memories-page">${titleHead('Our Memories', 'The moments we want to keep.', button('Add Memory', 'add-memory', 'primary', 'plus'))}<div class="toolbar"><span>${state.memories.length} ${state.memories.length === 1 ? 'memory' : 'memories'}</span><label class="select-control">Sort by <select id="memory-sort"><option value="oldest" ${sort === 'oldest' ? 'selected' : ''}>Oldest first</option><option value="newest" ${sort === 'newest' ? 'selected' : ''}>Newest first</option></select></label></div>${state.memories.length ? `<div class="memory-grid">${orderedMemories().map(m => memoryCard(m, true)).join('')}</div>` : `<div class="empty"><h2>A little moment, worth keeping.</h2><p>Your first memory can start right here.</p>${button('Add Memory', 'add-memory', 'primary', 'plus')}</div>`}</section>`;
  }
  function anniversariesPage() {
    const all = C.allAnniversaries(state);
    return `<section class="view">${titleHead('Anniversaries', 'A few dates. A lot to look forward to.', button('Add Date', 'add-date', 'primary', 'plus'))}<div class="anniversary-layout">${nextCard(false)}<div><div class="date-list">${all.map(a => {
      const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(a.date + 'T12:00:00Z'));
      return `<article class="date-row" data-anniversary="${a.id}"><div class="date-tile"><span>${month}</span><strong>${Number(a.date.slice(8))}</strong></div><div class="date-text"><h3><button class="date-title" data-action="open-date" data-id="${a.id}" aria-label="Open ${e(a.title)}">${e(a.title)}</button></h3><p>${C.formatDate(a.date)} · ${a.repeat ? 'Every year' : 'One time'}</p><span class="count-label">${a.remaining === null ? 'Past date' : a.remaining === 0 ? 'Today' : `${a.remaining} ${a.remaining === 1 ? 'day' : 'days'} to go`}</span>${a.note ? `<p class="date-note">${e(a.note)}</p>` : ''}${a.photos.length ? `<button class="date-photos" data-action="open-date" data-id="${a.id}" aria-label="View ${a.photos.length} photos for ${e(a.title)}">${a.photos.slice(0, 3).map((src, i) => photo(src, `${a.title}, photo ${i + 1}`)).join('')}<span>${a.photos.length} ${a.photos.length === 1 ? 'photo' : 'photos'}</span></button>` : ''}</div><div class="date-actions">${iconButton(a.builtIn ? 'Edit relationship anniversary' : `Edit ${a.title}`, 'edit-date', 'edit', `data-id="${a.id}"`)}${a.builtIn ? '' : iconButton(`Delete ${a.title}`, 'delete-date', 'trash', `data-id="${a.id}"`)}</div></article>`;
    }).join('')}</div><p class="small-note">Your relationship anniversary follows the start date in Settings. February 29 anniversaries fall on February 28 in other years.</p></div></div></section>`;
  }
  function settingsPage() {
    draftCover = state.settings.cover;
    const s = state.settings;
    return `<section class="view">${titleHead('Settings', 'Make this little space your own.')}<div class="settings-layout"><form id="settings-form" class="panel"><h2>The two of you</h2><div class="field-row"><label class="field">Your name<input name="name1" value="${e(s.name1)}" maxlength="40" required autocomplete="off"></label><label class="field">Their name<input name="name2" value="${e(s.name2)}" maxlength="40" required autocomplete="off"></label></div><label class="field">Together since<input type="date" name="startDate" value="${s.startDate}" min="1900-01-01" max="${C.today()}" required></label><div class="divider"></div><h3>Cover image</h3><p class="data-copy">A view that feels like the two of you.</p><div id="cover-preview">${photo(s.cover, 'Current cover image', 'cover-preview')}</div><div class="data-actions"><label class="button small file-button">${icon('upload')} Change cover<input id="cover-file" class="visually-hidden" type="file" accept="${I.accept}" aria-describedby="cover-format-help"></label>${button('Use seaside cover', 'reset-cover', 'small ghost')}</div><p id="cover-format-help" class="small-note">${I.formatHelp} ${I.heicHelp} Photos are stored at up to 2,400 pixels on the long edge.</p><p class="inline-error" role="alert"></p><div class="form-actions"><button type="submit" class="button primary">Save changes</button></div></form><section class="panel"><h2>Your data, with you</h2><h3>Only on this device</h3><p class="data-copy">Your memory book is saved in this browser. No accounts, cloud storage, or tracking.</p><p class="small-note">Clearing browser data, using a private window, or moving the app folder can make your saved book unavailable. Keep a backup somewhere safe.</p><div class="divider"></div><h3>Backup &amp; restore</h3><p class="data-copy">Download your names, dates, memories, photos, and unfinished Memory Book in one backup file. Restore it here or on another device.</p><div class="data-actions">${button('Download backup', 'backup', '', 'download')}<label class="button ghost file-button">${icon('upload')} Restore backup<input id="restore-file" class="visually-hidden" type="file" accept=".json,application/json"></label></div><p id="restore-error" class="inline-error" role="alert"></p><div class="divider"></div><p class="data-copy">The first book contains fictional memories for Haru and Aoi, with AI-generated sample photographs. Edit them or replace them with your own.</p><p class="small-note">Our Little Days · Version 4.0</p><a class="text-link landing-return-link" href="landing.html" data-action="go-landing">About Our Little Days ${icon('arrow')}</a></section></div></section>`;
  }
  function collectionPage() { return '<section class="view" id="book-root"></section>'; }
  function render(focus = false) {
    const route = currentRoute();
    bookEditor?.dispose(); bookEditor = null;
    main.classList.toggle('memory-book-route', route === 'collection');
    document.querySelector('#navigation').innerHTML = routes.map(r => `<a class="nav-link" href="#${r}" aria-label="${r[0].toUpperCase() + r.slice(1)}" ${r === route ? 'aria-current="page"' : ''}>${icon(r)}<span>${r[0].toUpperCase() + r.slice(1)}</span></a>`).join('');
    main.innerHTML = ({ home, memories: memoriesPage, anniversaries: anniversariesPage, collection: collectionPage, settings: settingsPage })[route]();
    if (route === 'collection') bookEditor = OLDMemoryBook.mount(main.querySelector('#book-root'), {
      getState: () => state,
      save: document => commit(current => ({ ...current, memoryBook: document })),
      backup: document => downloadBackup(document), icon, toast
    });
    document.title = `${route[0].toUpperCase() + route.slice(1)} · Our Little Days`;
    if (focus) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
  }
  function openDialog(content, wide = false) {
    if (!dialog.open) returnFocus = document.activeElement;
    dialog.className = wide ? 'dialog-wide' : '';
    dialog.innerHTML = `<div class="dialog-inner">${content}</div>`;
    if (!dialog.open) dialog.showModal();
    const focus = dialog.querySelector('[autofocus],input,button'); focus?.focus();
  }
  function modalHead(title) { return `<div class="dialog-head"><h2 id="dialog-title">${title}</h2>${iconButton('Close dialog', 'close-dialog', 'close')}</div>`; }
  function closeDialog() { dialog.close(); dialog.replaceChildren(); if (returnFocus?.isConnected) returnFocus.focus(); else document.querySelector('.nav-link[aria-current]')?.focus(); }
  function openMemory(id, index = 0) {
    const m = state.memories.find(m => m.id === id); if (!m) return;
    const current = (index + m.photos.length) % m.photos.length;
    openDialog(`<div class="dialog-detail">${modalHead(e(m.title))}<p class="detail-date">${C.formatDate(m.date)}</p>${photo(m.photos[current], `${m.title}, photo ${current + 1}`, 'detail-photo')}${m.photos.length > 1 ? `<div class="gallery-controls">${iconButton('Previous photo', 'gallery', 'left', `data-id="${m.id}" data-index="${current - 1}"`)}<span>Photo ${current + 1} of ${m.photos.length}</span>${iconButton('Next photo', 'gallery', 'chevron', `data-id="${m.id}" data-index="${current + 1}"`)}</div>` : ''}<p class="detail-note">${e(m.note)}</p><div class="form-actions spread">${button('Delete memory', 'delete-memory', 'ghost', 'trash', `data-id="${m.id}"`)}${button('Edit memory', 'edit-memory', '', 'edit', `data-id="${m.id}"`)}</div></div>`, true);
  }
  function photoStrip() {
    const strip = dialog.querySelector('#photo-strip'); if (!strip) return;
    strip.innerHTML = draftPhotos.map((src, i) => `<div class="photo-edit">${photo(src, `Selected photo ${i + 1}`)}<div class="photo-edit-actions">${i > 0 ? iconButton('Make this the first photo', 'photo-first', 'left', `data-index="${i}"`) : '<span></span>'}${iconButton(`Remove photo ${i + 1}`, 'photo-remove', 'close', `data-index="${i}"`)}</div>${i === 0 ? '<small>Cover photo</small>' : ''}</div>`).join('');
    dialog.querySelector('#photo-count').textContent = `${draftPhotos.length} of 12 photos`;
  }
  function photoUpload(inputId) {
    return `<label class="upload-area">${icon('plus')} Add photos <small>${I.formatHelp}</small><input class="visually-hidden" id="${inputId}" type="file" accept="${I.accept}" aria-describedby="photo-format-help" multiple></label><p id="photo-format-help" class="small-note">${I.heicHelp}</p><div id="photo-strip" class="photo-strip"></div><p id="photo-count" class="small-note"></p>`;
  }
  function memoryForm(id) {
    const m = state.memories.find(m => m.id === id);
    if (!m && state.memories.length >= C.LIMITS.memories) return toast('This book has reached its 250-memory limit.');
    draftPhotos = m ? [...m.photos] : [];
    openDialog(`${modalHead(m ? 'Edit memory' : 'A little day to remember')}<form id="memory-form" data-id="${m?.id || ''}"><label class="field">Title<input name="title" maxlength="80" required value="${e(m?.title || '')}" placeholder="A day by the sea" autofocus></label><label class="field">Date<input type="date" name="date" min="1900-01-01" max="2200-12-31" required value="${m?.date || C.today()}"></label><label class="field">A little note<textarea name="note" aria-label="A little note" maxlength="1000" rows="3" placeholder="What made this day yours?">${e(m?.note || '')}</textarea></label>${photoUpload('memory-photos')}<p class="inline-error" role="alert"></p><div class="form-actions">${button('Cancel', 'close-dialog', 'ghost')}<button type="submit" class="button primary">Save memory</button></div></form>`);
    photoStrip();
  }
  function dateForm(id) {
    const a = C.allAnniversaries(state).find(a => a.id === id);
    if (!a && state.anniversaries.length >= C.LIMITS.anniversaries) return toast('This book has reached its 100-date limit.');
    draftPhotos = [...(a?.photos || [])];
    openDialog(`${modalHead(a ? 'Edit important date' : 'Something to look forward to')}<form id="date-form" data-id="${a?.id || ''}"><label class="field">Title<input name="title" maxlength="80" required value="${e(a?.title || '')}" placeholder="Our favorite day" ${a?.builtIn ? 'readonly' : ''} autofocus></label><label class="field">Date<input type="date" name="date" min="1900-01-01" max="2200-12-31" required value="${a?.date || C.today()}" ${a?.builtIn ? 'readonly' : ''}></label>${a?.builtIn ? '<p class="small-note">This date follows Together since in <a href="#settings">Settings</a>.</p>' : ''}<label class="check-line"><input type="checkbox" name="repeat" ${a?.repeat !== false ? 'checked' : ''} ${a?.builtIn ? 'disabled' : ''}> Repeat every year</label><label class="field">A little note<textarea name="note" aria-label="A little note" maxlength="1000" rows="3" placeholder="A few words to remember this day.">${e(a?.note || '')}</textarea></label>${photoUpload('anniversary-photos')}<p class="small-note">Photos and notes are optional. They are included when you create Memory Book pages from this anniversary.</p><p class="inline-error" role="alert"></p><div class="form-actions">${button('Cancel', 'close-dialog', 'ghost')}<button type="submit" class="button primary">Save date</button></div></form>`);
    photoStrip();
  }
  function openDate(id, index = 0) {
    const a = C.allAnniversaries(state).find(a => a.id === id); if (!a) return;
    const current = a.photos.length ? (index + a.photos.length) % a.photos.length : 0;
    openDialog(`<div class="dialog-detail">${modalHead(e(a.title))}<p class="detail-date">${C.formatDate(a.date)} · ${a.repeat ? 'Every year' : 'One time'}</p>${a.photos.length ? photo(a.photos[current], `${a.title}, photo ${current + 1}`, 'detail-photo') : ''}${a.photos.length > 1 ? `<div class="gallery-controls">${iconButton('Previous photo', 'date-gallery', 'left', `data-id="${a.id}" data-index="${current - 1}"`)}<span>Photo ${current + 1} of ${a.photos.length}</span>${iconButton('Next photo', 'date-gallery', 'chevron', `data-id="${a.id}" data-index="${current + 1}"`)}</div>` : ''}<p class="detail-note">${e(a.note || (a.photos.length ? '' : 'Add photos and a little note to remember this date.'))}</p><div class="form-actions">${button('Edit anniversary', 'edit-date', '', 'edit', `data-id="${a.id}"`)}</div></div>`, true);
  }
  function confirmDelete(kind, id) {
    const list = kind === 'memory' ? state.memories : state.anniversaries;
    const item = list.find(x => x.id === id); if (!item) return;
    openDialog(`${modalHead(`Delete ${kind === 'memory' ? 'memory' : 'date'}?`)}<p class="confirm-copy">“${e(item.title)}” will be removed from this book${kind === 'memory' ? ' and the selection list. Existing Memory Book pages stay intact' : ''}. This cannot be undone. Your downloaded backups will stay unchanged.</p><p class="inline-error" role="alert"></p><div class="form-actions">${button('Keep it', 'close-dialog', 'ghost')}${button('Delete', 'confirm-delete', 'danger', '', `data-kind="${kind}" data-id="${id}"`)}</div>`);
  }
  function downloadBackup(bookOverride) {
    const data = copy();
    if (bookOverride) data.memoryBook = bookOverride;
    data.settings.cover = I.source(data.settings.cover);
    data.memories.forEach(m => { m.photos = m.photos.map(I.source); });
    data.anniversaries.forEach(a => { a.photos = a.photos.map(I.source); });
    data.settings.anniversary.photos = data.settings.anniversary.photos.map(I.source);
    if (data.memoryBook) data.memoryBook.assets = Object.fromEntries(Object.entries(data.memoryBook.assets).map(([id, src]) => [id, I.source(src)]));
    I.download(new Blob([C.backup(data)], { type: 'application/json' }), `our-little-days-backup-${C.today()}.json`);
    toast('Backup download started. Keep it somewhere safe.');
  }
  async function previewRestore(file) {
    if (file.size > C.LIMITS.backupBytes) throw new Error('This backup is larger than 128 MB.');
    const restored = C.parseBackup(await file.text());
    // Restore the identity of bundled photographs as well as their image bytes.
    const builtIns = new Map(['hero', 'crossing', 'sparklers', 'hydrangeas', 'shore'].map(key => [I.source(key), key]));
    restored.settings.cover = builtIns.get(restored.settings.cover) || restored.settings.cover;
    restored.memories.forEach(m => { m.photos = m.photos.map(src => builtIns.get(src) || src); });
    restored.anniversaries.forEach(a => { a.photos = a.photos.map(src => builtIns.get(src) || src); });
    restored.settings.anniversary.photos = restored.settings.anniversary.photos.map(src => builtIns.get(src) || src);
    if (restored.memoryBook) restored.memoryBook.assets = Object.fromEntries(Object.entries(restored.memoryBook.assets).map(([id, src]) => [id, builtIns.get(src) || src]));
    await I.verify(restored);
    openDialog(`${modalHead('Restore this memory book?')}<p class="confirm-copy">This will replace your current names, dates, memories, and unfinished Memory Book. Download a backup of your current book first if you want to keep it.</p><div class="restore-summary">${e(restored.settings.name1)} &amp; ${e(restored.settings.name2)}<br>${restored.memories.length} memories · ${restored.anniversaries.length + 1} important dates · ${restored.memoryBook?.pages.length || 0} book pages</div><p class="inline-error" role="alert"></p><div class="form-actions">${button('Back up current book', 'backup', 'ghost')}${button('Cancel', 'close-dialog', 'ghost')}${button('Replace & restore', 'restore-confirm', 'primary')}</div>`);
    dialog.querySelector('[data-action="restore-confirm"]').addEventListener('click', async function () {
      this.disabled = true;
      try { await commit(restored); closeDialog(); render(); toast('Your memory book has been restored.'); }
      catch (error) { showError(error.message); this.disabled = false; }
    });
  }
  document.addEventListener('click', async event => {
    const target = event.target.closest('[data-action]'); if (!target || target.disabled) return;
    const { action, id, index, kind } = target.dataset;
    if (action === 'go-landing' && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    try {
      switch (action) {
        case 'go-landing':
          event.preventDefault();
          if (bookEditor?.exporting) { toast('Please wait for your export to finish.'); break; }
          await bookEditor?.flush();
          location.assign(target.href);
          break;
        case 'go-anniversaries': location.hash = 'anniversaries'; break;
        case 'add-memory': memoryForm(); break;
        case 'edit-memory': memoryForm(id); break;
        case 'open-memory': openMemory(id); break;
        case 'gallery': openMemory(id, Number(index)); break;
        case 'close-dialog': closeDialog(); break;
        case 'photo-remove': draftPhotos.splice(Number(index), 1); photoStrip(); dialog.querySelector('form').dataset.dirty = 'true'; break;
        case 'photo-first': draftPhotos.unshift(draftPhotos.splice(Number(index), 1)[0]); photoStrip(); dialog.querySelector('form').dataset.dirty = 'true'; break;
        case 'add-date': dateForm(); break;
        case 'edit-date': dateForm(id); break;
        case 'open-date': openDate(id); break;
        case 'date-gallery': openDate(id, Number(index)); break;
        case 'delete-memory': confirmDelete('memory', id); break;
        case 'delete-date': confirmDelete('date', id); break;
        case 'confirm-delete': {
          target.disabled = true;
          const next = copy();
          if (kind === 'memory') { next.memories = next.memories.filter(m => m.id !== id); next.collection.selected = next.collection.selected.filter(x => x !== id); }
          else next.anniversaries = next.anniversaries.filter(a => a.id !== id);
          await commit(next); closeDialog(); render(); toast(kind === 'memory' ? 'Memory deleted.' : 'Date deleted.'); break;
        }
        case 'reset-cover': draftCover = 'hero'; main.querySelector('#cover-preview').innerHTML = photo(draftCover, 'Seaside cover preview', 'cover-preview'); main.querySelector('#settings-form').dataset.dirty = 'true'; break;
        case 'backup': downloadBackup(); break;

      }
    } catch (error) { if (target.isConnected) target.disabled = false; showError(error.message); }
  });
  document.addEventListener('change', async event => {
    const target = event.target;
    try {
      if (target.id === 'memory-sort') { sort = target.value; render(); main.querySelector('#memory-sort').focus(); }
      if (['memory-photos', 'anniversary-photos'].includes(target.id) && target.files.length) {
        if (draftPhotos.length + target.files.length > 12) throw new Error('Choose up to 12 photos per memory or anniversary.');
        const form = dialog.querySelector('form'), submit = form.querySelector('[type=submit]');
        submit.disabled = true; target.disabled = true;
        try { const added = []; for (const file of target.files) added.push(await I.read(file)); if (form.isConnected) { draftPhotos.push(...added); photoStrip(); form.dataset.dirty = 'true'; form.querySelector('.inline-error').textContent = ''; } }
        finally { submit.disabled = false; target.disabled = false; target.value = ''; }
      }
      if (target.id === 'cover-file' && target.files.length) {
        const form = main.querySelector('#settings-form'), submit = form.querySelector('[type=submit]'); submit.disabled = true; target.disabled = true;
        try { const converted = await I.read(target.files[0]); if (form.isConnected) { draftCover = converted; main.querySelector('#cover-preview').innerHTML = photo(draftCover, 'New cover preview', 'cover-preview'); form.dataset.dirty = 'true'; } }
        finally { submit.disabled = false; target.disabled = false; target.value = ''; }
      }
      if (target.id === 'restore-file' && target.files.length) {
        target.disabled = true;
        try { await previewRestore(target.files[0]); }
        finally { target.disabled = false; target.value = ''; }
      }

    } catch (error) {
      if (target.id === 'restore-file') main.querySelector('#restore-error').textContent = error.message;
      else showError(error.message);
      if (target.type === 'file') target.value = '';
    }
  });
  document.addEventListener('input', event => {
    const form = event.target.closest('form'); if (form) form.dataset.dirty = 'true';
  });
  document.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.target, values = new FormData(form), submit = form.querySelector('[type=submit]');
    if (!['settings-form', 'memory-form', 'date-form'].includes(form.id)) return;
    if (submit.disabled) return;
    submit.disabled = true;
    try {
      const next = copy();
      if (form.id === 'settings-form') {
        next.settings = { ...next.settings, name1: values.get('name1'), name2: values.get('name2'), startDate: values.get('startDate'), cover: draftCover };
      } else if (form.id === 'memory-form') {
        const memory = { id: form.dataset.id || C.makeId(), title: values.get('title'), date: values.get('date'), note: values.get('note'), photos: [...draftPhotos] };
        const index = next.memories.findIndex(m => m.id === memory.id);
        if (index < 0) next.memories.push(memory); else next.memories[index] = memory;
      } else if (form.dataset.id === 'relationship') {
        next.settings.anniversary = { note: values.get('note'), photos: [...draftPhotos] };
      } else {
        const date = { id: form.dataset.id || C.makeId(), title: values.get('title'), date: values.get('date'), repeat: values.get('repeat') === 'on', note: values.get('note'), photos: [...draftPhotos] };
        const index = next.anniversaries.findIndex(a => a.id === date.id);
        if (index < 0) next.anniversaries.push(date); else next.anniversaries[index] = date;
      }
      await commit(next); form.dataset.dirty = 'false';
      if (dialog.open) closeDialog(); render(); toast(form.id === 'settings-form' ? 'Your changes are saved.' : form.id === 'memory-form' ? 'Memory saved.' : 'Important date saved.');
    } catch (error) { showError(error.message, form); }
    finally { submit.disabled = false; }
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
  window.addEventListener('hashchange', async () => {
    if (!state) return;
    const ticket = ++navigationVersion;
    if (bookEditor) {
      if (bookEditor.exporting) { history.replaceState(null, '', '#collection'); toast('Please wait for your export to finish.'); return; }
      try { await bookEditor.flush(); }
      catch { history.replaceState(null, '', '#collection'); toast('Your book has unsaved changes. Retry saving or download a draft backup before leaving.'); return; }
    }
    if (ticket !== navigationVersion) return;
    if (dialog.open) closeDialog(); render(true);
  });
  window.addEventListener('beforeunload', event => {
    if (saving || bookEditor?.dirty || bookEditor?.exporting || document.querySelector('form[data-dirty="true"]')) { event.preventDefault(); event.returnValue = ''; }
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && C.today() !== lastDay && state) { lastDay = C.today(); if (['home', 'anniversaries'].includes(currentRoute())) render(); }
  });
  try {
    await OLDStore.open(); rawSaved = await OLDStore.load();
    if (rawSaved) { state = C.validateState(rawSaved.data); revision = rawSaved.revision; }
    else { state = C.createDemo(); await commit(state); }
    render();
  } catch (error) {
    document.querySelector('.sidebar-foot').hidden = true;
    main.innerHTML = `<section class="loading"><h1>Your book is still yours.</h1><p>${e(error.message)}</p><p class="small-note">No existing data has been replaced. Try reopening this app in a normal browser window.</p><div class="form-actions">${rawSaved ? '<button class="button" id="recover-data">Download stored data</button>' : ''}<button class="button primary" id="retry-load">Try again</button></div></section>`;
    document.querySelector('#retry-load').onclick = () => location.reload();
    document.querySelector('#recover-data')?.addEventListener('click', () => I.download(new Blob([JSON.stringify(rawSaved)], { type: 'application/json' }), 'our-little-days-recovery.json'));
  }
})();

(function () {
  'use strict';
  const B = BookModel, e = value => OLD.escapeHTML(value);
  function mount(root, options) {
    let book = B.clone(options.getState().memoryBook || B.empty(options.getState()));
    const history = B.history();
    let selected = null, editing = null, propertySession = null, placement = false, dragging = null;
    let version = 0, savedVersion = 0, saveTimer, savePromise, thumbnailTimer, paintToken = 0, thumbToken = 0;
    let disposed = false, busy = false, saveError = '', uploadTarget = null, dragIndex = null;
    const uploads = new Set();
    const active = () => book.pages.find(p => p.id === book.activePageId);
    const chosen = () => active()?.elements.find(el => el.id === selected);
    const icon = options.icon;
    const button = (label, action, cls = '', extra = '') => `<button type="button" class="button ${cls}" data-book-action="${action}" ${extra}>${label}</button>`;
    const small = (label, action, glyph, extra = '') => `<button type="button" class="icon-button" title="${e(label)}" aria-label="${e(label)}" data-book-action="${action}" ${extra}>${glyph}</button>`;
    function error(message) { saveError = message; updateStatus(); }
    function updateStatus() {
      if (disposed) return;
      const status = root.querySelector('#book-save-status');
      if (status) { status.textContent = saveError && savedVersion < version ? 'Changes not saved' : savedVersion < version || uploads.size ? 'Saving…' : 'All changes saved'; status.classList.toggle('unsaved', !!saveError && savedVersion < version); }
      const box = root.querySelector('#book-error');
      if (box) { box.hidden = !saveError; box.querySelector('p').textContent = saveError; }
      const undo = root.querySelector('[data-book-action="undo"]'), redo = root.querySelector('[data-book-action="redo"]');
      if (undo) undo.disabled = !history.canUndo || busy;
      if (redo) redo.disabled = !history.canRedo || busy;
    }
    function dirty() { version++; saveError = ''; clearTimeout(saveTimer); saveTimer = setTimeout(() => flush().catch(() => {}), 450); updateStatus(); }
    async function flush() {
      clearTimeout(saveTimer);
      if (uploads.size) await Promise.all([...uploads]);
      if (savePromise) { await savePromise; if (savedVersion < version) return flush(); return; }
      savePromise = (async () => {
        while (savedVersion < version) {
          const targetVersion = version, document = B.compact(book);
          await options.save(document); savedVersion = targetVersion; saveError = ''; updateStatus();
        }
      })();
      try { await savePromise; }
      catch (err) { error(err.message); throw err; }
      finally { savePromise = null; updateStatus(); }
    }
    function changed(before, repaint = true) {
      history.push(before); dirty();
      if (repaint) refresh();
    }
    function change(fn, repaint = true) { finishText(); propertySession = null; const before = B.snapshot(book); fn(); changed(before, repaint); }
    function header() {
      return `<header class="page-head book-head"><div><h1>Memory Book</h1><p>${book.stage === 'setup' ? 'Choose your days. Make them your own.' : e(book.title)}</p></div><span id="book-save-status" class="book-save-status" role="status"></span></header><div id="book-error" class="book-error" role="alert" hidden><p></p><div>${button('Retry save', 'retry-save', 'small')}${button('Download draft backup', 'draft-backup', 'small ghost')}</div></div>`;
    }
    function templateCard(id) {
      const t = B.THEMES[id];
      return `<button type="button" class="book-template template-${id}" data-book-action="template" data-template="${id}" aria-pressed="${book.setup.template === id}"><span class="template-paper"><span class="template-heading">${id === 'film' ? 'Days on film' : id === 'blue' ? 'Blue memories' : 'Our little summer'}</span><img src="${e(OLDImages.source(id === 'film' ? 'sparklers' : id === 'blue' ? 'shore' : 'hero'))}" alt=""><span class="template-lines"></span></span><strong>${t.name}</strong><span>${id === 'summer' ? 'Light, open, and quietly beautiful.' : id === 'blue' ? 'Sea-blue pages. A softer rhythm.' : 'Timeless type. A cinematic frame.'}</span></button>`;
    }
    function setupHTML() {
      const all = B.sources(options.getState()), lookup = new Map(all.map(s => [B.key(s), s])), selectedKeys = new Set(book.setup.selection.map(B.key));
      return `${header()}<div class="book-setup"><section class="panel book-content-panel"><div class="book-section-title"><span class="step-number">1</span><h2>Select &amp; arrange</h2><span>${book.setup.selection.length} / 12</span></div><p class="data-copy">Memories and anniversaries, in the order you choose.</p><div class="book-source-list">${all.map(item => `<label class="book-source"><input type="checkbox" name="book-source" value="${e(B.key(item))}" ${selectedKeys.has(B.key(item)) ? 'checked' : ''}><span class="book-source-image">${item.photos[0] ? `<img src="${e(OLDImages.source(item.photos[0]))}" alt="">` : icon('anniversaries')}</span><span><strong>${e(item.title)}</strong><small>${OLD.formatDate(item.date)} · ${item.subtitle}</small></span></label>`).join('')}</div><div class="book-order-title"><h3>Your page order</h3><small>Drag rows or use the arrows</small></div><ol class="book-order">${book.setup.selection.map((s, index) => `<li draggable="true" data-order-index="${index}"><span class="order-number">${index + 1}</span><span class="order-name">${e(lookup.get(B.key(s))?.title || 'Removed item — deselect to continue')}</span>${small('Move item earlier', 'item-up', icon('left'), `data-index="${index}" ${index === 0 ? 'disabled' : ''}`)}${small('Move item later', 'item-down', icon('chevron'), `data-index="${index}" ${index === book.setup.selection.length - 1 ? 'disabled' : ''}`)}${small('Remove selected item', 'item-remove', icon('close'), `data-index="${index}"`)}</li>`).join('') || '<li class="order-empty">Choose a few days to begin.</li>'}</ol></section><section class="book-template-panel"><div class="book-section-title"><span class="step-number">2</span><h2>Choose a feeling</h2></div><label class="field">Book title<input id="book-title" maxlength="80" value="${e(book.setup.title)}" placeholder="Our days, together"></label><div class="book-template-grid">${Object.keys(B.THEMES).map(templateCard).join('')}</div><div class="book-setup-foot"><p>Your photos, dates, and notes become editable pages. Your saved memories stay as they are.</p><div>${book.pages.length ? button('Return to editor', 'resume', 'ghost') : ''}${button(book.pages.length ? 'Regenerate pages' : 'Create Memory Book', 'generate', 'primary', book.setup.selection.length ? '' : 'disabled')}</div></div></section></div>`;
    }
    function editorHTML() {
      return `${header()}<div class="book-toolbar"><div>${button('Content & template', 'setup', 'small ghost')}${button(`${icon('plus')} Add text`, 'add-text', 'small')}${button(`${icon('memories')} Add photo`, 'add-photo', 'small')}</div><div class="book-history">${small('Undo', 'undo', '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5-5 5 5 5M3 10h10a7 7 0 0 1 7 7"/></svg>')}${small('Redo', 'redo', '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m16 5 5 5-5 5m5-5H11a7 7 0 0 0-7 7"/></svg>')}<span class="toolbar-divider"></span>${button('PNG pages', 'export-png', 'small')}${button(`${icon('download')} Export PDF`, 'export-pdf', 'small primary')}</div></div><p class="book-instruction" id="book-instruction">Click text to edit. Drag an element or use its corner handles to resize.</p><p class="book-upload-help" id="book-photo-help">${OLDImages.formatHelp} ${OLDImages.heicHelp}</p><div class="book-workspace"><aside class="book-pages" aria-label="Page navigator"><div class="book-pane-heading"><h2>Pages</h2><span>${book.pages.length}</span></div><div id="book-page-list"></div>${button(`${icon('plus')} Add page`, 'add-page', 'small ghost')}</aside><section class="book-stage" aria-label="Page workspace"><div class="book-page-meta"><span id="book-page-counter"></span><span>Preview matches export</span></div><div class="book-sheet" id="book-sheet"><canvas id="book-page-canvas" width="2400" height="3200" role="img" aria-label="Editable Memory Book page"></canvas><div class="book-objects" id="book-objects"></div></div><div class="book-page-actions">${small('Move page earlier', 'page-up', icon('left'))}<span>Page order</span>${small('Move page later', 'page-down', icon('chevron'))}${small('Delete page', 'delete-page', icon('trash'))}</div></section><aside class="book-properties" aria-label="Element properties" id="book-properties"></aside></div><input type="file" id="book-photo-input" accept="${OLDImages.accept}" aria-describedby="book-photo-help" class="visually-hidden"><div id="book-export-progress" class="book-export-progress" role="status" hidden></div>`;
    }
    function shell() {
      if (disposed) return;
      finishText(); root.innerHTML = book.stage === 'setup' ? setupHTML() : editorHTML();
      updateStatus();
      if (book.stage === 'edit') { renderNav(); properties(); objects(); paint(); }
    }
    function refresh() {
      updateStatus();
      if (book.stage === 'setup') { shell(); return; }
      properties(); objects(); paint();
      clearTimeout(thumbnailTimer); thumbnailTimer = setTimeout(renderNav, 200);
    }
    async function paint() {
      const p = active(); if (!p || book.stage !== 'edit' || disposed) return;
      const token = ++paintToken, page = B.clone(p), omitted = editing?.id || null;
      try {
        const canvas = await BookRender.page(book, page, dragging ? 1 : 4, omitted);
        if (disposed || token !== paintToken || book.activePageId !== page.id) return;
        const current = root.querySelector('#book-page-canvas');
        if (!current) return;
        current.width = canvas.width; current.height = canvas.height; current.getContext('2d').drawImage(canvas, 0, 0);
        current.setAttribute('aria-label', `Page ${book.pages.findIndex(p => p.id === page.id) + 1}: ${page.title}`);
        current.dataset.pageId = page.id;
        for (const el of page.elements) {
          const target = root.querySelector(`[data-element-id="${el.id}"]`);
          if (target && el.type === 'text') target.setAttribute('aria-label', `Edit text: ${el.text.slice(0, 90) || 'Empty text box'}`);
        }
        root.querySelector('#book-page-counter').textContent = `Page ${book.pages.findIndex(p => p.id === page.id) + 1} of ${book.pages.length}`;
        overflowHint();
      } catch (err) { error(err.message); }
    }
    async function renderNav() {
      if (book.stage !== 'edit' || disposed) return;
      const list = root.querySelector('#book-page-list'); if (!list) return;
      const scroll = list.scrollTop, token = ++thumbToken;
      list.innerHTML = book.pages.map((p, index) => `<button type="button" class="book-page-thumb" data-book-action="page" data-page-id="${p.id}" aria-label="Page ${index + 1}: ${e(p.title)}" aria-current="${p.id === book.activePageId ? 'page' : 'false'}"><canvas width="120" height="160" aria-hidden="true"></canvas><span>${String(index + 1).padStart(2, '0')} <strong>${e(p.title)}</strong></span></button>`).join('');
      list.scrollTop = scroll;
      for (const p of book.pages) {
        const thumbnail = list.querySelector(`[data-page-id="${p.id}"] canvas`); if (!thumbnail) continue;
        try {
          const canvas = await BookRender.page(book, B.clone(p), .2);
          if (disposed || token !== thumbToken) return;
          thumbnail.getContext('2d').drawImage(canvas, 0, 0);
        } catch (err) { error(err.message); return; }
      }
      const index = book.pages.findIndex(p => p.id === book.activePageId);
      root.querySelector('[data-book-action="page-up"]').disabled = index === 0;
      root.querySelector('[data-book-action="page-down"]').disabled = index === book.pages.length - 1;
      root.querySelector('[data-book-action="delete-page"]').disabled = book.pages.length <= 1;
    }
    function position(node, el) { Object.assign(node.style, { left: `${el.x / 6}%`, top: `${el.y / 8}%`, width: `${el.w / 6}%`, height: `${el.h / 8}%` }); }
    function objects() {
      const layer = root.querySelector('#book-objects'); if (!layer || !active()) return;
      layer.replaceChildren();
      for (const el of active().elements) {
        const node = document.createElement('div'); node.className = `book-object ${selected === el.id ? 'selected' : ''}`; node.dataset.elementId = el.id;
        node.tabIndex = 0; node.setAttribute('role', 'button'); node.setAttribute('aria-label', el.type === 'text' ? `Edit text: ${el.text.slice(0, 90) || 'Empty text box'}` : 'Select photo'); position(node, el);
        if (selected === el.id) {
          const move = document.createElement('button'); move.type = 'button'; move.className = 'book-move'; move.dataset.move = 'true'; move.setAttribute('aria-label', 'Move selected element'); move.title = 'Drag to move'; move.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18m-13-5 4-4 4 4m-8 10 4 4 4-4M7 8l-4 4 4 4m10-8 4 4-4 4"/></svg>'; node.append(move);
          for (const corner of ['nw', 'ne', 'sw', 'se']) { const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'book-resize ' + corner; handle.dataset.corner = corner; handle.setAttribute('aria-label', `Resize ${corner}`); node.append(handle); }
        }
        layer.append(node);
      }
      root.querySelector('#book-sheet')?.classList.toggle('placing-text', placement);
    }
    function properties() {
      const panel = root.querySelector('#book-properties'); if (!panel) return;
      const el = chosen();
      if (!el) { panel.innerHTML = `<div class="book-pane-heading"><h2>Make it yours</h2></div><div class="property-empty">${icon('edit')}<h3>A little personal touch</h3><p>Select text or a photo on the page to make a change.</p><p>Move with a drag. Resize from a corner. Your original memories stay untouched.</p></div><div class="book-draft-note">Your unfinished book is saved on this device.</div>`; return; }
      const text = el.type === 'text';
      panel.innerHTML = `<div class="book-pane-heading"><h2>${text ? 'Text' : 'Photo'}</h2><span>Selected</span></div>${text ? `<label class="field">Text<textarea aria-label="Text" id="book-text-content" maxlength="5000" rows="4">${e(el.text)}</textarea></label><div class="book-property-row"><label class="field">Font size<input id="book-font-size" type="number" min="8" max="96" step="1" value="${el.fontSize}"></label><label class="field">Text color<input id="book-text-color" type="color" value="${el.color}"></label></div><label class="field">Typeface<select id="book-font" aria-label="Typeface"><option value="sans" ${el.font === 'sans' ? 'selected' : ''}>Clean sans</option><option value="serif" ${el.font === 'serif' ? 'selected' : ''}>Classic serif</option><option value="mono" ${el.font === 'mono' ? 'selected' : ''}>Film caption</option></select></label><label class="field">Alignment</label><div class="book-align" role="group" aria-label="Text alignment">${['left', 'center', 'right'].map(a => button(a[0].toUpperCase() + a.slice(1), 'align', 'small', `data-align="${a}" aria-pressed="${el.align === a}"`)).join('')}</div>${button('Bold', 'bold', 'small ghost', `aria-pressed="${el.weight === 600}"`)}<p id="book-overflow" class="book-overflow" hidden>Some text is outside this box. Enlarge the box or reduce the font size before exporting.</p>` : `<p class="data-copy">This photo belongs to this page only.</p><label class="field book-photo-fit">Photo fit<select id="book-fit" aria-label="Photo fit"><option value="cover" ${el.fit === 'cover' ? 'selected' : ''}>Fill the frame</option><option value="contain" ${el.fit === 'contain' ? 'selected' : ''}>Show the whole photo</option></select></label>${button('Replace photo', 'replace-photo', 'small', '')}<p class="small-note">Replacing it will not change another page or the original saved memory or anniversary.</p>`}<div class="book-property-footer">${button(`${icon('trash')} Delete ${text ? 'text' : 'photo'}`, 'delete-element', 'small danger')}</div>`;
      overflowHint();
    }
    function overflowHint() {
      const hint = root.querySelector('#book-overflow'), el = chosen(); if (!hint || el?.type !== 'text') return;
      const ctx = document.createElement('canvas').getContext('2d'); hint.hidden = !BookRender.textLayout(ctx, el).overflow;
    }
    function finishText() {
      if (!editing) return;
      const textarea = root.querySelector('#book-inline-text'); editing = null; textarea?.remove(); paint();
    }
    function editText(id) {
      finishText(); selected = id; const el = chosen(); if (el?.type !== 'text') return;
      properties(); objects(); editing = { id, before: B.snapshot(book), pushed: false };
      const area = document.createElement('textarea'); area.id = 'book-inline-text'; area.className = 'book-inline-text'; area.value = el.text; area.maxLength = 5000; area.setAttribute('aria-label', 'Edit page text'); area.spellcheck = false;
      position(area, el); const zoom = root.querySelector('#book-sheet').getBoundingClientRect().width / 600;
      Object.assign(area.style, { fontFamily: BookRender.fonts[el.font], fontSize: `${el.fontSize * zoom}px`, fontWeight: String(el.weight), lineHeight: '1.35', color: el.color, textAlign: el.align });
      root.querySelector('#book-objects').append(area); paint(); area.focus(); area.select();
    }
    function selectPage(id) {
      finishText(); selected = null; placement = false; propertySession = null;
      if (book.activePageId !== id) { book.activePageId = id; dirty(); }
      refresh(); renderNav();
    }
    function confirm(title, copy, label) {
      return new Promise(resolve => {
        const modal = document.createElement('dialog'); modal.className = 'book-confirm'; modal.setAttribute('aria-label', title);
        modal.innerHTML = `<div class="dialog-inner"><div class="dialog-head"><h2>${e(title)}</h2></div><p class="confirm-copy">${e(copy)}</p><div class="form-actions"><button class="button ghost" type="button" data-answer="no">Cancel</button><button class="button primary" type="button" data-answer="yes">${e(label)}</button></div></div>`;
        root.append(modal); modal.showModal();
        const done = answer => { modal.close(); modal.remove(); resolve(answer); };
        modal.addEventListener('click', ev => { const b = ev.target.closest('[data-answer]'); if (b) done(b.dataset.answer === 'yes'); });
        modal.addEventListener('cancel', ev => { ev.preventDefault(); done(false); });
      });
    }
    async function generate() {
      finishText();
      if (book.pages.length && !await confirm('Regenerate your pages?', 'This replaces the current page designs with the selected content and template. You can Undo while this editor stays open. Your saved memories will not change.', 'Regenerate pages')) return;
      const before = B.snapshot(book);
      book = B.generate(options.getState(), book.setup, book.assets); selected = null;
      history.push(before); dirty(); shell();
    }
    function newText(x, y) {
      if (active().elements.length >= B.LIMITS.elements) throw new Error('A page can hold up to 40 text boxes and photos.');
      const before = B.snapshot(book), el = B.textElement('Your words here', x, y, 260, 110, { color: B.THEMES[book.template].ink, font: B.THEMES[book.template].font });
      active().elements.push(el); selected = el.id; placement = false; changed(before); editText(el.id); instruction();
    }
    function instruction() { const node = root.querySelector('#book-instruction'); if (node) node.textContent = placement ? 'Click anywhere on this page to place a text box. Press Escape to cancel.' : 'Click text to edit. Drag an element or use its corner handles to resize.'; }
    async function receivePhoto(file, target) {
      const source = await OLDImages.read(file);
      const p = book.pages.find(p => p.id === target.pageId); if (!p) throw new Error('The chosen page was removed before the photo finished loading. Please choose a page and try again.');
      const used = new Set(Object.values(B.compact(book).assets));
      if (!used.has(source) && used.size >= B.LIMITS.assets) throw new Error('A book can contain up to 160 different photos. Remove an unused photo before adding another.');
      const before = B.snapshot(book);
      if (target.elementId) {
        const element = p.elements.find(el => el.id === target.elementId && el.type === 'image');
        if (!element) throw new Error('The photo you wanted to replace was removed.');
        element.asset = B.addAsset(book, source);
      } else {
        if (p.elements.length >= B.LIMITS.elements) throw new Error('This page already has 40 elements.');
        const img = B.imageElement(book, source, 100, 210, 360, 300, B.THEMES[book.template]);
        p.elements.push(img); if (p.id === book.activePageId) selected = img.id;
      }
      changed(before); options.toast(`Photo added to ${p.title}.`);
    }
    async function exportPages(format) {
      finishText(); await flush(); busy = true; root.classList.add('book-busy');
      root.querySelectorAll('button,input,textarea,select').forEach(el => { el.disabled = true; });
      const progress = root.querySelector('#book-export-progress'); progress.hidden = false;
      try {
        const snapshot = B.compact(book);
        const blob = await BookExport.exportBook(snapshot, format, (i, total) => { progress.textContent = `Preparing page ${i} of ${total}…`; });
        OLDImages.download(blob, `our-little-days-memory-book.${format === 'png' ? 'zip' : 'pdf'}`);
        options.toast(format === 'png' ? 'Your PNG pages are downloading together in one ZIP.' : 'Your complete Memory Book PDF is downloading.');
      } finally { busy = false; root.classList.remove('book-busy'); shell(); }
    }
    async function click(event) {
      const control = event.target.closest('[data-book-action]'); if (!control || control.disabled || busy) return;
      event.preventDefault(); const action = control.dataset.bookAction;
      try {
        switch (action) {
          case 'template': change(() => { book.setup.template = control.dataset.template; }); break;
          case 'item-up': case 'item-down': change(() => { const i = Number(control.dataset.index); book.setup.selection = B.move(book.setup.selection, i, i + (action === 'item-up' ? -1 : 1)); }); break;
          case 'item-remove': change(() => book.setup.selection.splice(Number(control.dataset.index), 1)); break;
          case 'generate': await generate(); break;
          case 'setup': finishText(); book.stage = 'setup'; dirty(); shell(); break;
          case 'resume': book.stage = 'edit'; dirty(); shell(); break;
          case 'page': selectPage(control.dataset.pageId); break;
          case 'add-text': finishText(); placement = !placement; objects(); instruction(); break;
          case 'add-photo': case 'replace-photo': finishText(); uploadTarget = { pageId: book.activePageId, elementId: action === 'replace-photo' ? selected : null }; root.querySelector('#book-photo-input').click(); break;
          case 'delete-element': if (chosen()) change(() => { active().elements = active().elements.filter(el => el.id !== selected); selected = null; }); break;
          case 'align': change(() => { chosen().align = control.dataset.align; }); break;
          case 'bold': change(() => { chosen().weight = chosen().weight === 400 ? 600 : 400; }); break;
          case 'undo': case 'redo': {
            finishText(); const result = history[action](B.snapshot(book)); if (!result) break;
            book = { ...result, assets: book.assets }; selected = null; propertySession = null; placement = false; dirty(); shell(); break;
          }
          case 'page-up': case 'page-down': change(() => { const i = book.pages.findIndex(p => p.id === book.activePageId); book.pages = B.move(book.pages, i, i + (action === 'page-up' ? -1 : 1)); }); renderNav(); break;
          case 'add-page': {
            if (book.pages.length >= B.LIMITS.pages) throw new Error('A book can contain up to 40 pages.');
            change(() => { const p = { id: B.uid(), title: 'A new page', background: B.THEMES[book.template].background, source: null, elements: [] }; const i = book.pages.findIndex(p => p.id === book.activePageId); book.pages.splice(i + 1, 0, p); book.activePageId = p.id; selected = null; }); renderNav(); break;
          }
          case 'delete-page': if (book.pages.length > 1 && await confirm('Delete this page?', 'This removes this page from the book. You can bring it back with Undo.', 'Delete page')) { change(() => { const i = book.pages.findIndex(p => p.id === book.activePageId); book.pages.splice(i, 1); book.activePageId = book.pages[Math.min(i, book.pages.length - 1)].id; selected = null; }); shell(); } break;
          case 'export-png': await exportPages('png'); break;
          case 'export-pdf': await exportPages('pdf'); break;
          case 'retry-save': await flush(); break;
          case 'draft-backup': options.backup(B.compact(book)); break;
        }
      } catch (err) { error(err.message); }
    }
    function writeProperty(target) {
      const el = chosen(); if (!el) return;
      const map = { 'book-text-content': 'text', 'book-font-size': 'fontSize', 'book-text-color': 'color', 'book-font': 'font', 'book-fit': 'fit' }, prop = map[target.id];
      if (!prop) return;
      let value = target.value;
      if (prop === 'fontSize') { value = Number(value); if (!Number.isFinite(value) || value < 8 || value > 96) return; }
      if (el[prop] === value) return;
      if (!propertySession || propertySession.target !== target || propertySession.id !== el.id) { propertySession = { target, id: el.id }; history.push(B.snapshot(book)); }
      el[prop] = value; dirty(); paint(); overflowHint(); clearTimeout(thumbnailTimer); thumbnailTimer = setTimeout(renderNav, 300);
    }
    function input(event) {
      if (busy) return;
      const target = event.target;
      if (target.id === 'book-inline-text') {
        const el = chosen(); if (!editing || !el) return;
        if (!editing.pushed) { history.push(editing.before); editing.pushed = true; }
        el.text = target.value; const property = root.querySelector('#book-text-content'); if (property) property.value = el.text;
        dirty(); overflowHint(); return;
      }
      if (target.id === 'book-title') { book.setup.title = target.value; dirty(); return; }
      writeProperty(target);
    }
    function changeInput(event) {
      const target = event.target;
      try {
        if (target.id === 'book-font-size') target.value = target.value === '' ? String(chosen()?.fontSize || 24) : String(Math.max(8, Math.min(96, Number(target.value) || 24)));
        if (target.name === 'book-source') {
          const [kind, id] = target.value.split(':');
          if (target.checked && book.setup.selection.length >= 12) { target.checked = false; throw new Error('Choose up to 12 memories and anniversaries.'); }
          change(() => { if (target.checked) book.setup.selection.push({ kind, id }); else book.setup.selection = book.setup.selection.filter(s => B.key(s) !== target.value); });
        }
        if (target.id === 'book-photo-input' && target.files[0]) {
          const capture = uploadTarget || { pageId: book.activePageId, elementId: null };
          const task = receivePhoto(target.files[0], capture).catch(err => error(err.message)).finally(() => { uploads.delete(task); updateStatus(); });
          uploads.add(task); updateStatus(); target.value = '';
        }
        writeProperty(target); propertySession = null;
      } catch (err) { error(err.message); }
    }
    function pointerDown(event) {
      if (busy || event.button !== 0) return;
      const sheet = root.querySelector('#book-sheet'); if (!sheet?.contains(event.target) || event.target.id === 'book-inline-text') return;
      const rect = sheet.getBoundingClientRect(), zoom = rect.width / 600;
      if (placement) { event.preventDefault(); try { newText((event.clientX - rect.left) / zoom, (event.clientY - rect.top) / zoom); } catch (err) { error(err.message); } return; }
      const node = event.target.closest('[data-element-id]');
      if (!node) { finishText(); selected = null; properties(); objects(); return; }
      event.preventDefault(); finishText(); selected = node.dataset.elementId; const el = chosen(); if (!el) return;
      const corner = event.target.closest('[data-corner]')?.dataset.corner;
      dragging = { id: el.id, pointer: event.pointerId, x: event.clientX, y: event.clientY, zoom, original: { ...el }, before: B.snapshot(book), corner, moved: false, moveHandle: !!event.target.closest('[data-move]') };
      properties(); objects(); sheet.setPointerCapture(event.pointerId);
    }
    function pointerMove(event) {
      if (!dragging || event.pointerId !== dragging.pointer) return;
      const dx = (event.clientX - dragging.x) / dragging.zoom, dy = (event.clientY - dragging.y) / dragging.zoom;
      if (Math.abs(dx) + Math.abs(dy) < 2 && !dragging.moved) return;
      dragging.moved = true;
      const original = dragging.original; let next;
      if (dragging.corner) {
        let left = original.x, right = left + original.w, top = original.y, bottom = top + original.h;
        if (dragging.corner.includes('w')) left = Math.max(0, Math.min(right - 24, left + dx));
        if (dragging.corner.includes('e')) right = Math.min(600, Math.max(left + 24, right + dx));
        if (dragging.corner.includes('n')) top = Math.max(0, Math.min(bottom - 24, top + dy));
        if (dragging.corner.includes('s')) bottom = Math.min(800, Math.max(top + 24, bottom + dy));
        next = B.bounded(original, { x: left, y: top, w: right - left, h: bottom - top });
      } else next = B.bounded(original, { x: original.x + dx, y: original.y + dy });
      const index = active().elements.findIndex(el => el.id === dragging.id); active().elements[index] = next;
      const node = root.querySelector(`[data-element-id="${next.id}"]`); if (node) position(node, next); paint();
    }
    function pointerUp(event) {
      if (!dragging || event.pointerId !== dragging.pointer) return;
      const value = dragging; dragging = null;
      root.querySelector('#book-sheet')?.releasePointerCapture(event.pointerId);
      if (value.moved) changed(value.before);
      else if (chosen()?.type === 'text' && !value.corner && !value.moveHandle) editText(selected);
    }
    function pointerCancel(event) {
      if (!dragging || event.pointerId !== dragging.pointer) return;
      book = { ...dragging.before, assets: book.assets }; dragging = null; refresh();
    }
    function keydown(event) {
      if (busy || disposed || !root.isConnected || root.querySelector('dialog[open]')) return;
      const target = event.target, field = target.matches('input,textarea,select,[contenteditable]');
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && (event.key.toLowerCase() === 'z' || event.key.toLowerCase() === 'y') && (!field || target.id === 'book-inline-text')) {
        event.preventDefault(); finishText();
        root.querySelector(`[data-book-action="${event.key.toLowerCase() === 'y' || event.shiftKey ? 'redo' : 'undo'}"]`)?.click(); return;
      }
      if (event.key === 'Escape') { finishText(); placement = false; selected = null; objects(); properties(); instruction(); return; }
      if (field) return;
      const object = target.closest('[data-element-id]');
      if ((event.key === 'Enter' || event.key === ' ') && object) { event.preventDefault(); selected = object.dataset.elementId; if (chosen()?.type === 'text') editText(selected); else { properties(); objects(); } return; }
      if (!chosen()) return;
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); root.querySelector('[data-book-action="delete-element"]')?.click(); }
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault(); const step = event.shiftKey ? 10 : 1;
        change(() => { const el = chosen(), next = B.bounded(el, { x: el.x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0), y: el.y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0) }); Object.assign(el, next); });
      }
    }
    const focusOut = event => {
      if (event.target.id === 'book-inline-text') { finishText(); clearTimeout(thumbnailTimer); thumbnailTimer = setTimeout(renderNav, 200); }
      if (propertySession?.target === event.target) propertySession = null;
    };
    const dragStart = event => { const row = event.target.closest('[data-order-index]'); if (row) { dragIndex = Number(row.dataset.orderIndex); event.dataTransfer.setData('text/plain', String(dragIndex)); event.dataTransfer.effectAllowed = 'move'; } };
    const dragOver = event => { if (event.target.closest('[data-order-index]')) event.preventDefault(); };
    const drop = event => { const row = event.target.closest('[data-order-index]'); if (row && dragIndex != null) { event.preventDefault(); change(() => { book.setup.selection = B.move(book.setup.selection, dragIndex, Number(row.dataset.orderIndex)); }); dragIndex = null; } };
    const listeners = { click, input, change: changeInput, pointerdown: pointerDown, pointermove: pointerMove, pointerup: pointerUp, pointercancel: pointerCancel, focusout: focusOut, dragstart: dragStart, dragover: dragOver, drop };
    for (const [name, handler] of Object.entries(listeners)) root.addEventListener(name, handler);
    document.addEventListener('keydown', keydown);
    const resize = () => { if (editing) finishText(); };
    window.addEventListener('resize', resize);
    shell();
    return { flush, get dirty() { return savedVersion < version || uploads.size > 0 || !!savePromise || !!dragging; }, get exporting() { return busy; },
      dispose() { disposed = true; clearTimeout(saveTimer); clearTimeout(thumbnailTimer); paintToken++; thumbToken++; for (const [name, handler] of Object.entries(listeners)) root.removeEventListener(name, handler); document.removeEventListener('keydown', keydown); window.removeEventListener('resize', resize); BookRender.clear(); }
    };
  }
  window.OLDMemoryBook = { mount };
})();

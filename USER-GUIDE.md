# Our Little Days

A quiet memory book for two, inspired by Japanese summers: blue skies, seaside light, and room to breathe. Built with plain HTML, CSS, and JavaScript. Everything works offline, including the page editor, project backups, multi-page PDF export, and high-resolution PNG export.

Version 4 adds photos and short notes directly to anniversaries, including the built-in relationship anniversary. Select an anniversary in **Collection** to include its attachments in your editable Memory Book. The separate seaside landing page and existing design are preserved. Your saved memories and anniversaries remain independent of the book you design.

## Open your book

1. Extract the entire ZIP into a permanent folder, such as `Documents/Our Little Days`. Do not open it from inside the ZIP.
2. Open the extracted `our-little-days` folder.
3. Double-click `landing.html`. If necessary, right-click it and choose **Open with → Google Chrome** or **Microsoft Edge**.
4. Click **Start Our Story** to open the actual app.
5. Keep the folder in that location and use the same browser for future visits.

**Success:** the new landing page appears with a sunlit beach and the heading “Little days. A beautiful story.” **Start Our Story** opens your existing project, or the fictional Haru & Aoi demo on a first visit. It does not reset your data. You can disconnect from the internet before the first launch. No server, installation, account, API key, or build command is required.

`index.html` still opens the app directly, so existing app bookmarks continue to work. The app's entry file and storage database have not moved. Older saved data is read automatically; date-only anniversaries start with empty photo and note fields, and existing edited book pages stay intact. This release uses data schema 3. If you keep the existing app folder, updating its source files retains that storage location. Before upgrading or moving folders, download a JSON backup from the old app; restore it if the new location opens the demo.

Use a normal browser window. Private browsing may erase the book when the window closes. The complete workflow was tested in Chrome on Windows, directly from local files. Other browsers and mobile file-opening workflows have not been certified; the interface itself is responsive to phone and tablet widths.

## Explore the landing page

1. Use **The experience**, **Memory Book**, and **Made for two** to move between the page's feature sections.
2. **Explore memories**, **See anniversaries**, **Open Memory Book**, and **Explore settings & backup** open the corresponding real app sections.
3. Try **Pure Summer**, **Blue Memories**, and **Film Diary** under **Preview a style**. These controls change only the illustrative pages on the landing page, never your saved book.
4. In the app, use **About Our Little Days** in the desktop sidebar or Settings to return. Pending Memory Book edits save before leaving; a failed save keeps the editor open with recovery controls.

**Success:** navigation works both ways, and your saved memories, anniversaries, edited pages, and export controls remain available. Subtle entrance/reveal effects and anchor scrolling respect your system's reduced-motion setting. On mobile, the section links sit below the brand and Open app button. The landing page's content, credits, and links also work without JavaScript; the app and style preview require JavaScript.

The landing page never opens the project database, reads personal images, or loads the demo photo library. Its new hero and feature photograph are by **Tunafish** on Unsplash, bundled under the [Unsplash License](https://unsplash.com/license). The hero is exclusive to the landing page and is not reused from any memory, album, or user upload. **Photo credits** in the footer works offline; its optional source links require internet. See `assets/landing/CREDITS.md` for attribution, provenance, and the license summary.

## Make it yours

### Names, date, and cover

1. Open **Settings**.
2. Enter the two names and your relationship start date.
3. Optionally choose **Change cover** and select a JPEG, PNG, or WebP photo.
4. Click **Save changes**, then return to **Home**.

**Success:** your names, cover, and calculated duration appear on the home screen. The duration counts completed calendar days, so your starting day is day zero. The default seaside cover can be restored with **Use seaside cover**, followed by **Save changes**.

### Keep a memory

1. Click **Add Memory** on Home or Memories.
2. Give the memory a title and date; add a short note if you like.
3. Choose **Add photos**. You can select up to 12 photos.
4. Use the small left-arrow control under a photo to make it the cover. Use its remove button to remove it from the draft.
5. Click **Save memory**.

**Success:** a new card appears in Memories. Open it to read the note or browse the photos. **Edit memory** updates it. **Delete memory** asks for confirmation before removing the memory and its collection selection. Deletion cannot be undone without restoring a backup. Changes to forms are saved only when you click their save button; Cancel discards the draft.

### Remember an important date

1. Open **Anniversaries → Add Date**.
2. Enter a title and date.
3. Keep **Repeat every year** checked for birthdays and anniversaries, or turn it off for a one-time event.
4. Optionally write **A little note** and choose **Add photos**. Attach up to 12 photos directly to this anniversary; no separate memory is needed.
5. Use a photo's left-arrow control to make it first, or its remove button to remove it from the draft.
6. Click **Save date**.

**Success:** the date appears with its note and photo thumbnails, and the next upcoming date is shown prominently. Click its title or thumbnails to read the full note and browse every photo. Use the pencil button to edit it. Changes save only with **Save date**; Cancel leaves the saved anniversary unchanged.

The pencil button beside **Our Anniversary** also lets you add photos and a note. Its title and recurring date remain linked to **Settings → Together since**. Changing names, the cover, or the start date in Settings preserves these attachments. Past one-time events stay in the list but do not become the next event. A date happening today shows zero days and “today.” February 29 repeats on February 28 in non-leap years.

### Supported photo formats

All upload controls accept **JPEG (.jpg, .jpeg), PNG (.png), and WebP (.webp)**, up to **20 MB per file**. This applies to memories, anniversaries, the cover, and additional Memory Book images.

**HEIC/HEIF is not supported**, even if your device can preview the image. Export or convert it to JPEG, PNG, or WebP using a photo app before uploading. Renaming the extension does not convert an image. The app shows this limitation beside each upload control and gives a specific message if a HEIC/HEIF file is selected. Conversion is not performed or uploaded to a service by this app. SVG, GIF, video, and RAW files are also unsupported.

### Choose content and a template

1. Open **Collection**. Select between 1 and 12 saved memories or anniversaries, including the relationship anniversary if desired.
2. Arrange **Your page order** using the arrow buttons or by dragging the rows.
3. Enter a book title and choose **Pure Summer**, **Blue Memories**, or **Film Diary**.
4. Click **Create Memory Book**.

**Success:** the page editor opens with a cover and pages in your chosen order. Every selected memory or anniversary photo is included in its saved photo order. Anniversary photos initially use **Show the whole photo**. Dates, titles, and notes are copied into the book; long notes continue onto extra pages rather than being discarded. An anniversary without photos uses your cover image as a fallback. You can edit or replace these elements in the editor.

Pure Summer uses white pages and airy photography. Blue Memories uses soft blue paper, blue type, and white photo frames. Film Diary uses neutral paper, serif headings, and charcoal frames.

### Edit the pages

1. Select a page in the **Pages** navigator. The large canvas shows the page that will export.
2. Click existing text to type directly on the page. Click outside it or press Escape to finish. The **Text** field in the properties panel offers another way to edit the same text.
3. Use **Add text**, then click a position on the page. Type your new text.
4. Select a page, then use **Add photo** to insert a JPEG, PNG, or WebP image. It belongs only to that chosen page, even if you change pages while it is loading.
5. Drag an element to move it. Use its small move handle when editing text, and drag any corner handle to resize its box. Text size changes separately using **Font size**.
6. Use the compact properties panel for text color, alignment, typeface, and bold. For photos, choose **Fill the frame** or **Show the whole photo**, **Replace photo**, or **Delete photo**. Replacing an image affects only that element.
7. Use **Undo** and **Redo** to recover changes. On the canvas, Ctrl/Cmd+Z undoes, Ctrl/Cmd+Shift+Z redoes, arrow keys move a selected element, and Delete removes it. Shift+arrow moves it farther. Normal text-field shortcuts still apply in the properties panel.

**Success:** the preview reflects your edits and the status says **All changes saved**. Your original saved memories, photos, and anniversaries are unchanged. Editing or deleting a source memory or anniversary later also leaves the existing book pages intact. To bring newly added anniversary attachments into an already generated book, use **Content & template → Regenerate pages**; review the replacement confirmation because regeneration replaces page edits. You can instead add a photo directly to one book page.

Use **Add page** for a blank page after the current one. The arrows under the canvas move the current page earlier or later. **Delete page** asks for confirmation and can be undone. There is no layer panel or coordinate entry; select visible elements directly. The page navigator runs horizontally on small screens, with properties below the canvas.

If text exceeds its box, the properties panel shows a warning. Enlarge the box or reduce the font size. The export preserves the same clipping visible in the preview.

### Save, resume, and regenerate

Edits autosave locally after a short pause. Wait for **All changes saved** before closing the browser. Return to **Collection** in the same browser and folder to continue the unfinished book on the page you last selected. There is one current book per project. Up to 50 undo steps are available during an editing session; the undo history resets when leaving the editor or reopening the app, while the edited pages stay saved.

**Content & template** returns to setup without removing your pages. **Return to editor** keeps the existing design. **Regenerate pages** asks for confirmation, then replaces the pages using the selected content and template. It can be undone in the same session. Export or back up a completed book before starting another.

If a save fails, **Changes not saved** remains visible, navigation is held in the editor, and you can **Retry save** or **Download draft backup** to recover the current document.

### Export the finished book

1. Finish editing and review each page in the navigator.
2. Click **Export PDF** for one multi-page document, or **PNG pages** for a ZIP of numbered images.
3. Wait for the page progress message to finish, then open the downloaded file. Extract the PNG ZIP before opening its images.

**Success:** every page exports in navigator order. PNG pages are **2,400 × 3,200 pixels**. PDF pages are **600 × 800 points**, each containing the same losslessly compressed high-resolution rendering. Both formats share the preview renderer, preserving text, colors, placement, and photo crops. Selection outlines and editing controls are excluded. PDF text is rendered as an image, so it is not searchable or editable in a PDF editor; keep a JSON backup to preserve the editable source.

Large books take longer to export and use more memory. PDF export requires CompressionStream support, available in the tested Chrome environment. PNG export is an alternative if the browser reports that PDF export is unavailable.

## Back up and move your book

Browser storage is local convenience storage, not a permanent archive. Clearing browser data, uninstalling a browser, using a private window, changing browser profiles, or moving the app can make the saved book unavailable. Back up regularly, especially before moving folders or changing devices.

1. Open **Settings → Download backup**.
2. Keep the downloaded `.json` file somewhere safe. It includes settings, all photos, notes, dates, and the unfinished Memory Book: its pages, text, uploaded photos, order, and template.
3. On the destination device, extract this app and open `index.html` in a normal browser window.
4. Choose **Settings → Restore backup** and select the JSON file.
5. Review the displayed names and item counts. Download a backup of the current book if needed, then click **Replace & restore**.

**Success:** the restored names and memories appear and remain after reloading. A valid restore replaces the current project; it does not merge two projects. Invalid JSON, unsupported versions, remote image URLs, malformed photos, and duplicate IDs are rejected before replacement. A failed local save leaves the previous saved book intact. Concurrent edits in another window are rejected instead of silently overwriting newer data.

Data schema 1 and 2 backups are accepted and upgraded without changing original memories or existing edited pages. App V3 used schema 2; app V4 uses schema 3 to preserve anniversary attachments. New schema 3 backups require app V4 or later. Older app versions reject them rather than silently losing attachments. Keep your pre-upgrade backup if you may return to an older app. For an upgrade, download a backup in the old app first, extract this version into a permanent folder, and restore the backup. Keep the old backup until the restored project has been checked.

Backups contain personal photos and text in an unencrypted local file. Store and share them as carefully as your original photos. The app does not upload them. Images uploaded into the app are re-encoded to JPEG at up to 2,400 pixels on the long edge to manage storage; keep your camera originals separately. Transparent areas are flattened onto white. HEIC, SVG, GIF, video, and RAW files are not supported.

## Limits and privacy

- Maximum 250 memories, 100 additional important dates, and 12 photos per memory or anniversary (including the relationship anniversary).
- Maximum 12 selected memories and anniversaries, 40 book pages, 40 elements per page, and 160 distinct book image assets.
- Original image input: 20 MB per file, below 80 megapixels.
- Total expanded photo data: 100 MB per book, including base64 overhead and repeated photos. This keeps exported backups below the 128 MB import limit. Browser/device limits may be lower.
- Names: 40 characters each. Titles: 80 characters. Saved memory and anniversary notes: 1,000 characters. Editable book text boxes: 5,000 characters, with font sizes from 8 to 96.
- No remote requests, analytics, external fonts, CDNs, authentication, cloud sync, or service worker.
- IndexedDB stores your book on this browser/device. A restrictive Content Security Policy prevents app network connections and remote scripts.
- A JSON backup is the portable editable source. Exported PDF and PNG pages are presentation files, not restorable project backups.

If storage is blocked, the app shows an error and does not pretend your changes were saved. Reopen it in a normal Chrome/Edge window, check browser storage permissions, or free device space. If you move the folder and see demo data again, restore your backup. Some browsers group local-file storage differently; avoid editing multiple copies of the app at the same time.

## Project files

```text
landing.html           Separate landing page; start here
landing.css            Landing-page design and responsive layouts
js/landing.js          Style preview and reduced-motion-aware reveals
index.html             Original app entry point; direct bookmarks still work
styles.css             Responsive design system and UI styles
book.css               Memory Book setup, canvas, and properties styles
assets/icon.svg        Local vector app mark
assets/media.js        Embedded generated demo photographs
assets/landing/        New licensed photographs, credits, and hash manifest
js/core.js             Pure date, validation, backup, and state helpers
js/storage.js          Atomic IndexedDB persistence and conflict detection
js/images.js           Local photo processing and downloads
js/book-model.js       Independent book pages, templates, history, validation
js/book-render.js      Shared preview and high-resolution canvas renderer
js/book-export.js      Offline lossless PDF and PNG ZIP writers
js/book-editor.js      Page editing, pointer interactions, and autosave
js/app.js              Navigation, views, forms, and user interactions
tests/core.test.cjs     Data and calendar edge-case tests
tests/book.test.cjs     Book model, migration, history, PDF, and ZIP tests
tests/anniversary.test.cjs Anniversary attachments, migration, and template tests
tests/browser.cjs       Original app workflow and download regression tests
tests/book-browser.cjs  Editor, persistence, upload, and export UI tests
tests/anniversary-browser.cjs Full anniversary-to-book-to-export workflow
tests/landing-browser.cjs Landing navigation, data isolation, motion, and mobile tests
tests/verify-exports.py Independent PDF/PNG pixel and file verification
docs/DESIGN.md         Reference interpretation and visual review ledger
docs/MEMORY-BOOK.md    Editor design and architecture
docs/LANDING.md        Landing-page design and navigation/data boundaries
docs/ASSETS.md         Image provenance and generation prompts
```

The app has no runtime dependencies. You can edit the files directly and refresh the browser. Embedded photo data avoids file-origin canvas restrictions so PNG export also works when opening `index.html` directly. No package installation is needed to use the app.

## Run the tests

These commands are for developers or reviewers who want to repeat verification. They do not publish the app or modify a real memory book. Browser tests use a fresh isolated profile and generated test data. They write temporary screenshots, backups, and PNG files, so allow some free disk space.

### Unit tests

1. Install Node.js 20 or later if it is not already available.
2. Open a terminal in the `our-little-days` folder.
3. Run:

```sh
npm test
```

**Success:** 52 tests pass. They cover date edge cases, data validation, backups, legacy migration, anniversary attachments, independent book snapshots, all three templates, all photos and notes, page bounds, undo history, asset isolation, ZIP checksums, and PDF image streams and cross-reference offsets.

### Browser tests

1. Make sure Google Chrome is installed.
2. Install the test-only dependency if it is not already provided by your environment:

```sh
npm install --no-save --package-lock=false playwright@1.62.1
```

This optional installation downloads third-party development tooling from the npm registry. It is not needed for the offline app itself. Playwright 1.62.1 was used for delivery verification.

3. Run:

```sh
npm run test:browser
npm run test:book
npm run test:anniversaries
npm run test:landing
```

**Success:** each tested workflow prints `PASS`, and the final line reports all browser workflows passed. The output directory is printed at the end. Tests open local files with internet access disabled and assert that no HTTP/HTTPS requests occur. The original app suite covers 21 workflows. The editor suite covers 18 workflows, including direct text editing, pointer movement/resizing, page-specific delayed uploads, image replacement, undo/redo, browser restart, draft backup/restore, source-memory independence, actual PDF/PNG downloads, save failures, and responsive layouts down to 320 pixels.

The anniversary suite covers 16 workflows: format guidance and HEIC/HEIF rejection; direct JPEG/PNG/WebP attachments; gallery and ordering; relationship attachments; responsive forms; selected anniversary pages; text and photo editing; page-specific uploads; browser restart; image decoding and text fit; actual PDF and PNG downloads; portable backups; corrupted-image rejection; source independence; old V3 backups; and no external requests or runtime errors.

The landing suite covers 13 workflows: local loading without project access; photo identity, dimensions, and licensing metadata; anchor navigation; every app-entry link; desktop and mobile return paths; flushing pending edits before leaving; isolated template previews; failed-save protection; widths from 320 to 1,698 pixels; keyboard access and offline credits; reduced motion; JavaScript-disabled landing behavior; and absence of external requests or console errors. Browser tests use isolated profiles and do not touch your normal browser data.

### Independently verify exported files

After running the editor or anniversary browser suite, use its printed output directory in the command below. Python 3 with `pypdf` and `PyMuPDF` is needed only for this optional developer check. If necessary, install them with `python -m pip install pypdf PyMuPDF`; this downloads third-party test tools and does not change the offline app.

```sh
python tests/verify-exports.py "PATH_TO_BOOK_BROWSER_OUTPUT"
```

**Success:** `export-verification.json` reports three pages for the editor suite or four pages for the anniversary suite, whose preview, exported PNG, and decoded PDF image pixels are identical. The check also validates ZIP CRCs, page dimensions, PDF structure, and renders every PDF page through a second PDF engine. It writes rendered page images beside the test exports for visual inspection. The anniversary suite also writes `content-verification.json`, confirming every attached image decoded and every text box fit before export.

Optional environment variables:

- `OLD_QA_DIR`: a writable output directory for test profiles and evidence. Set this explicitly if your system restricts temporary browser folders.
- `OLD_APP_DIR`: test another extracted copy of the project.
- `OLD_BROWSER_CHANNEL`: defaults to `chrome`; `msedge` uses an installed Microsoft Edge browser.
- `NODE_PATH`: use an existing environment-provided Playwright installation without installing it in this project.

Run browser tests with normal local browser storage and download permissions. Some sandboxes allow the page to load but block Chrome's temporary database or download files. No personal browser profile is used.

## Demo content

Haru, Aoi, their dates, and the memory notes are fictional. The six in-app demo images were generated specifically for this project. They are sample photographs, not records of real people or events. The landing page uses two separate licensed photographs by Tunafish. See `docs/ASSETS.md` for the demo prompts, `assets/landing/CREDITS.md` for landing-photo provenance, and the design documents for both visual directions.

The reviewed V4 project is published on AgentGit. See the repository README for screenshots and the current release overview. Automatic future uploads remain disabled.

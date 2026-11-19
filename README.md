# Our Little Days

**A quiet place for the days you want to keep.**

Our Little Days is an offline memory book for couples: a place to collect photos, remember important dates, and turn shared moments into a collection you can make your own. Its spacious, Apple-inspired interface pairs clean typography with the light, ocean blues, and calm of a Japanese summer.

Built with **HTML, CSS, and JavaScript**, the app opens directly from local files. There are no accounts, subscriptions, cloud services, or runtime dependencies.

[Download the V4 project ZIP](https://agent-git.com/api/agents/fosterhrljz/our-little-days/file-content/our-little-days-v4-complete.zip?ref=main) · [Detailed usage guide](docs/USER-GUIDE.md) · [Authentic development session](https://agent-git.com/@fosterhrljz/our-little-days/s/agit-9108fe4674ffd38c3276325352b025f26281c1be?ref=development)

![Our Little Days dashboard with a seaside cover, relationship duration, memory cards, and the next anniversary](https://agent-git.com/api/agents/fosterhrljz/our-little-days/file-content/docs/screenshots/home.png?ref=main)

*The real V4 dashboard, shown with fictional Haru & Aoi demo content.*

## Who it is for

Our Little Days is designed for couples who want a small, personal photo journal, people making an anniversary keepsake, and anyone who prefers to keep their memories on their own device. It suits an occasional photo and a few thoughtful words, with enough creative control to design a finished book.

It is a single-browser project, without shared accounts or live collaboration. Transfer a project between devices with a backup file.

## Main features

| Area | What you can do |
| --- | --- |
| **Landing page** | Explore a separate seaside introduction and open the app with **Start Our Story**. Feature links lead to the real app sections. |
| **Home** | See your names, cover photo, relationship duration, key memories, and the next upcoming anniversary. |
| **Memories** | Add, edit, and delete photo-based memories with a title, date, and short note. Browse multiple photos and sort cards by date. |
| **Anniversaries** | Save annual or one-time dates, attach photos and a note directly, and see the next occasion and countdown. The relationship anniversary supports attachments too. |
| **Memory Book** | Select and order memories and anniversaries, choose one of three templates, then edit individual pages. |
| **Export** | Download the complete edited book as a multi-page PDF or a ZIP of high-resolution PNG pages. |
| **Settings & data** | Edit names, relationship start date, and cover; save locally; back up and restore the complete project. |

### Anniversaries with their own photos

An anniversary can hold up to 12 photos and a short note without creating a separate memory. Its title and thumbnail strip open a photo viewer; the pencil button opens its edit form. When selected for a new Memory Book, its photos appear in their saved order alongside its date and note.

![Anniversaries page showing a next-date countdown and an anniversary with its own note and three attached photos](https://agent-git.com/api/agents/fosterhrljz/our-little-days/file-content/docs/screenshots/anniversaries.png?ref=main)

*A real V4 test project demonstrating direct anniversary attachments.*

## Get started

1. Download the [V4 project ZIP](https://agent-git.com/api/agents/fosterhrljz/our-little-days/file-content/our-little-days-v4-complete.zip?ref=main) from this repository.
2. Extract the **entire** archive into a permanent folder. Do not open the app from inside the ZIP.
3. Open `our-little-days/landing.html` in a normal Chrome window.
4. Select **Start Our Story**. A first visit opens the fictional Haru & Aoi demo.
5. Open **Settings** to enter your names, relationship start date, and an optional cover photo, then select **Save changes**.

**You are ready when:** Home shows your saved names and relationship duration. No server, installation, package manager, API key, or build command is needed to use the app. You can disconnect from the internet before opening it for the first time.

`index.html` opens the app directly. Keep using the same browser and folder location to return to your saved project. Before upgrading or moving the folder, download a JSON backup from the old app.

### Add a memory or anniversary

- **Memory:** select **Add Memory**, enter a title and date, optionally write a note, add at least one photo, and select **Save memory**.
- **Anniversary:** open **Anniversaries → Add Date**, enter its title and date, choose whether it repeats every year, optionally add photos and a note, and select **Save date**.
- **Relationship anniversary:** use the pencil button beside **Our Anniversary** to edit its photos and note. Its date follows **Settings → Together since**.

Forms save when you select their save button; **Cancel** discards the draft. A photo's left-arrow control makes it the first photo. Open a saved item to browse its photos and read its full note.

### Supported images

Uploads accept **JPEG (.jpg, .jpeg), PNG, and WebP**, up to **20 MB per file**, with an 80-megapixel processing ceiling.

**HEIC and HEIF are not supported.** Export or convert these images to JPEG, PNG, or WebP in a photo app before uploading. Renaming a file extension does not convert it. The upload interface explains this limitation; the app does not send images to a conversion service. SVG, GIF, RAW images, and video are also unsupported.

Uploaded photos are resized to at most 2,400 pixels on the long edge and re-encoded as JPEG to manage storage. Transparent areas become white. Keep your original photographs separately.

## Design a Memory Book

### 1. Select and arrange

Open **Collection**, choose between 1 and 12 saved memories or anniversaries, and arrange **Your page order** with the arrow controls or by dragging the rows. Enter a book title.

### 2. Choose a template

| Template | Visual style |
| --- | --- |
| **Pure Summer** | White pages, clean type, and airy photography. |
| **Blue Memories** | Soft blue pages, blue typography, and white photo frames. |
| **Film Diary** | Neutral paper, serif headings, and charcoal photo frames. |

Select **Create Memory Book** to generate a cover and content pages. Every selected photo is included; long notes continue onto additional pages. Anniversary photos initially use **Show the whole photo**. An anniversary without attachments uses the project cover as a photo fallback.

### 3. Make each page yours

The editor has a page navigator, a central canvas, and a compact properties panel.

- Click existing text to edit it, or use the panel's **Text** field.
- Choose **Add text**, then click a position on the page to place a text box.
- Choose a page and use **Add photo** to insert another image. It is added only to that page, even if you change pages while the upload is processing.
- Drag text or photos to move them; use corner handles to resize their boxes.
- Adjust font size, text color, alignment, typeface, and bold. Replace or delete an image, or choose **Fill the frame** / **Show the whole photo**.
- Add, reorder, or delete pages. Use **Undo** and **Redo** to recover edits.

![Memory Book editor showing the page navigator, an editable Pure Summer cover, canvas, properties panel, and export controls](https://agent-git.com/api/agents/fosterhrljz/our-little-days/file-content/docs/screenshots/memory-book.png?ref=main)

*The working editor during V4 browser verification. Screenshots are app captures, not interface mockups.*

**Original items stay independent.** Editing a book does not overwrite saved memories or anniversaries. Later changes to a source item also leave existing book pages intact. To bring updated source content into an existing book, use **Content & template → Regenerate pages** and review its replacement confirmation. Regeneration replaces page edits; adding a photo directly to a page is another option.

### 4. Save, resume, and export

Book edits autosave locally. Wait for **All changes saved**, then return to **Collection** in the same browser and folder to resume on your last selected page. If saving fails, the editor reports it and offers **Retry save** and **Download draft backup**.

Review every page, then choose:

| Export | Output |
| --- | --- |
| **Export PDF** | One multi-page PDF; each page is 600 × 800 points and contains a losslessly compressed high-resolution rendering. |
| **PNG pages** | One ZIP containing numbered 2,400 × 3,200 PNG images, in page order. |

The preview and exports use the same renderer for text, colors, photo placement, and cropping. Selection outlines and editor controls are excluded. If text exceeds its box, the panel warns you: enlarge the box or reduce the font size before exporting. Export preserves the clipping visible in the preview.

PDF text is part of the rendered image, so it is not searchable or editable as PDF text. PDF and PNG exports are finished presentation files; keep a JSON backup to retain the editable project.

## Offline operation, privacy, and local data

The downloaded app works offline from its first launch. Its interface, photographs, page editor, backups, and PDF/PNG exports are local. It makes no HTTP/HTTPS requests during the tested app workflows and uses no analytics, external fonts, CDNs, cloud storage, or service worker. Optional links to photography sources require internet; their local credits remain available offline.

Project data is stored in **IndexedDB in the browser on your device**. There is no account, password system, synchronization service, or online photo upload. The separate landing page does not read the personal project database.

Local browser storage is not a permanent archive or an encrypted vault. Clearing browser data, using a private window, switching browser profiles, or moving the app may make the saved project unavailable. JSON backups contain unencrypted photos and text; keep them somewhere you trust. The public AgentGit repository contains the application and development material, not the personal projects people create while using the downloaded app.

### Back up and restore

1. Open **Settings → Download backup** and keep the downloaded `.json` file somewhere safe.
2. On the destination browser/device, open the extracted app and choose **Settings → Restore backup**.
3. Review the names and item counts. Back up the current project if needed, then choose **Replace & restore**.

**Success:** names, photos, memories, anniversary attachments, and the unfinished book are restored and remain after reloading. Restore replaces the current project; it does not merge projects. Invalid backups and malformed images are rejected before replacement.

V4 accepts earlier data schemas 1 and 2 and upgrades them to schema 3. Older date-only anniversaries receive empty attachment fields; existing edited book pages remain unchanged. New schema 3 backups require V4 or later. Keep a pre-upgrade backup if you may return to an older version.

## Verified testing

The V4 delivery was tested in **Chrome on Windows**, using isolated browser profiles and local `file://` pages with internet access disabled. Responsive layouts were checked at widths from **320 to 1,698 pixels**. These are recorded delivery results, not claims of continuous integration or exhaustive cross-browser coverage.

| Test suite | Passing checks | Coverage |
| --- | ---: | --- |
| Unit tests | **52** | Calendar edge cases, validation, legacy migration, backups, anniversary attachments, all three templates, independent book snapshots, history, bounds, ZIP checksums, and PDF structures. |
| App browser workflows | **21** | CRUD, real image uploads, persistence, backup/restore, save failures, concurrent-window conflicts, empty states, and responsive views. |
| Memory Book browser workflows | **18** | Selection, templates, direct editing, drag/resize, page-specific uploads, replacement, undo/redo, restart, recovery, and PDF/PNG downloads. |
| Anniversary browser workflows | **16** | JPEG/PNG/WebP attachments, HEIC/HEIF rejection, gallery/order, relationship attachments, book generation/editing, source independence, restart, backups, and exports. |
| Landing browser workflows | **13** | Navigation, photo separation and metadata, data isolation, saved-edit handoff, responsive behavior, keyboard access, reduced motion, and content without JavaScript. |

**Total: 52 unit tests and 68 browser workflows passed.** All four browser suites reported no app runtime errors or external HTTP/HTTPS requests.

The complete anniversary workflow was exercised: create an anniversary → attach three image formats and a note → select it for a book → edit the pages → export PDF and PNG. An independent Python check confirmed that **all four pages were pixel-identical across the preview, exported PNG, and decoded PDF image data**. The separate three-page editor export passed the same comparison. ZIP integrity, page dimensions, and PDF structure were checked, and the rendered PDFs were visually inspected for photo placement, readable text, and clipping.

### Run the tests yourself

The tests and source are included in the release ZIP. No test dependency is needed to use the app.

For unit tests, install Node.js 20 or later, open a terminal in the extracted `our-little-days` folder, and run:

```sh
npm test
```

For browser tests, use an installed Chrome browser and the test-only Playwright version used for delivery:

```sh
npm install --no-save --package-lock=false playwright@1.62.1
npm run test:browser
npm run test:book
npm run test:anniversaries
npm run test:landing
```

Installing Playwright downloads third-party developer tooling. The tests use isolated profiles and write local evidence files; they do not use your personal browser project. Each suite prints `PASS` results and its output directory.

For independent export comparison, install Python 3 with `pypdf` and `PyMuPDF`, then use the output directory printed by the editor or anniversary suite:

```sh
python tests/verify-exports.py "PATH_TO_BROWSER_TEST_OUTPUT"
```

**Success:** `export-verification.json` reports pixel-identical pages and successful ZIP/PDF validation. Rendered page images are written beside the exports for inspection. See the [detailed guide](docs/USER-GUIDE.md) for optional test environment variables.

## Known limitations

- **One current book per project.** Export or back up a finished book before starting another. Undo history is limited to 50 steps per editor session and resets when leaving or reopening the editor; saved pages remain.
- **No shared editing or sync.** There are no user accounts, cloud backups, live collaboration, or push reminders. Anniversary countdowns appear inside the app.
- **Browser support is not fully certified.** Delivery testing covered Chrome on Windows and responsive browser widths, not every browser or physical mobile file-opening workflow. This is a local web app, not a native or installable PWA.
- **Image processing changes uploads.** HEIC/HEIF and other unsupported formats require conversion; JPEG re-encoding, resizing, and transparency flattening mean uploads are not an archive of camera originals.
- **Export depends on device capacity.** Large books use more memory and take longer to export. PDF export requires browser `CompressionStream` support. Text overflow must be corrected in the editor.
- **Storage has limits.** Up to 250 memories, 100 additional dates, and 12 photos per memory or anniversary; up to 12 selected items, 40 book pages, 40 elements per page, and 160 distinct book image assets. Expanded photo data is capped at 100 MB per project, including repeated images and base64 overhead; browser quotas may be lower. Backup imports are limited to 128 MB.

## Demo content and photo credits

Haru, Aoi, their memories, and their notes are fictional. The six in-app demo photographs were AI-generated for this project. The separate landing page uses two locally bundled photographs by **Tunafish** on Unsplash, with provenance and licensing information in `assets/landing/CREDITS.md` inside the release. Its hero is separate from the demo memories and personal uploads.

The screenshots above show the actual app using fictional demo or test content. Source links and image provenance are documented in the release's `docs/ASSETS.md` and `assets/landing/manifest.json`.

## Repository and release

The `main` branch contains the complete application source at its root, this English README, screenshots in `docs/screenshots/`, the detailed `docs/USER-GUIDE.md`, all test scripts, and `our-little-days-v4-complete.zip`. Extract the ZIP to obtain the same runnable project and documentation. The archive does not contain another copy of itself. Its SHA-256 is recorded in the adjacent `our-little-days-v4-complete.sha256` file.

The `development` branch preserves the authentic imported Codex development session, including the original design, editor, landing page, and anniversary-photo work. This publication adds ordinary project files on `main`; it does not recreate the repository, duplicate the session, or rewrite development history. The previous reviewed V4 archive remains available under `artifacts/`.

This complete package refreshes documentation and screenshot packaging. The bundled demo-photo JavaScript is formatted across separate lines for AgentGit publication; all six decoded photo values were verified identical to V4. App behavior and saved-data schemas are unchanged. The 52 unit tests were rerun for this publication. The browser and export results above are the recorded V4 delivery results, with evidence summaries in `docs/testing/`.

For an offline copy of the screenshots, open the PNG files in `docs/screenshots/`. README image embeds and optional source links use public URLs for Hub compatibility; the application itself needs no network connection. Automatic future AgentGit uploads remain disabled.

# Memory Book design and architecture

The editor extends the approved cool-white, sky-blue Our Little Days interface. It keeps the existing application sidebar. The workflow is Select memories → Choose a template → Edit pages → Export. There is one unfinished book, saved locally and included in project backups.

## Layout specification

- Setup: ordered selected memories and anniversaries on the left; three visual template previews on the right. Reorder controls work with mouse, keyboard, and touch.
- Editing: narrow page navigator, central portrait canvas on a pale blue-gray workspace, compact properties panel. A short toolbar offers Add text, Add photo, Undo, Redo, and export. No layer list or coordinate fields.
- Use existing system typography, navy text, blue primary controls, rounded white surfaces, 24px outline icons, and restrained spacing. Document pages use local Arial, Georgia, or Courier New, rendered with one shared canvas engine.
- Pure Summer: white pages, generous margins, airy photography, navy sans-serif text.
- Blue Memories: pale blue pages, white photo frames, deeper blue headings and centered cover typography.
- Film Diary: neutral paper, charcoal photo frames, restrained serif headlines and monospaced date captions. No stickers, scrapbook embellishments, or cute motifs.
- Small screens: horizontal page navigator, canvas above properties. Touch/pointer handles use the same logical page coordinates as desktop. Editing chrome is never exported.

## Data and rendering

Book pages contain independent editable text and image objects. They are snapshots, not live references to saved memories. Image bytes are deduplicated in the book's asset pool. Upload operations capture the selected page before processing begins, so an image can never be broadcast to other pages.

Page dimensions are 600 × 800 logical units. Both the preview and every export use the same canvas renderer. PNG pages are 2,400 × 3,200 pixels and downloaded together in a ZIP. PDF pages contain losslessly compressed RGB renderings of those exact canvases, preserving fonts, crops, positioning, and colors without external libraries or requests.

One session supports 50 undo/redo steps; the persisted document includes the edited pages, current page, setup order, and template. Undo history itself is session-local. Autosave is debounced, serialized, and revision-checked. Pending saves are flushed before navigation or export; failures leave the editable document visible and show an unsaved warning.

Project schemas 1 and 2 migrate to schema 3 without changing source memories or existing edited pages. Schema 3 adds optional `note` and `photos` to custom anniversaries and `settings.anniversary` for the built-in relationship anniversary. Missing attachments default to empty values. The independent Memory Book document schema remains version 1. Old applications reject schema 3 backups instead of silently dropping anniversary attachments. Validation, storage accounting, backup embedding, and restore image decoding include both anniversary types.

## Visual review

The supplied seaside dashboard remains the visual reference. Home keeps its photographic hero, sidebar, cool white surfaces, navy typography, and pale blue navigation. The new editor extends those elements with quiet white tool panels around a blue-gray workspace. This is a functional expansion, not a replacement of the approved home layout.

Desktop and phone screenshots were inspected alongside the supplied reference. The three templates were reviewed in the running browser. A wide cover-photo frame keeps both people visible on the cover and on date-only anniversary pages. Anniversaries with attachments use one image per page in saved order, initially showing the whole photo. Notes continue onto extra pages as needed. The exported PDF pages were independently rendered and inspected for clipping, spacing, typography, and photo placement. Text and photo selection controls are excluded from exports.

The three-page edited test book has pixel-identical preview, PNG, and decoded PDF page images. An independent PDF engine also renders all pages successfully. Automated responsive checks cover 1,280, 768, 390, and 320 pixel widths; UI testing uses local files in offline Chrome on Windows.

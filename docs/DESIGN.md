# Our Little Days — design system

The approved reference is the user's seaside dashboard image, supplied on November 6, 2026. It is the main visual specification.

- **Palette:** cool near-white `#f6f8fc`, white surfaces, dark navy `#152331`, muted slate `#667587`, pale blue selected navigation `#e6edfc`, ocean blue `#3978a8`. Keep the background cool; no cream or scrapbook treatments.
- **Layout:** a 266px fixed left sidebar and an open main canvas with 30px gutters. A wide, rounded photographic hero leads into four memory cards and one upcoming-anniversary panel. The hero has no colored wash. Downstream pages reuse the same sidebar, spacing, photo frames, and restrained controls.
- **Type:** local system sans-serif; 84px large-desktop hero heading, 34px section headings, 17px navigation, 15px captions. Weight and negative tracking create hierarchy. No downloaded fonts.
- **Icons:** consistent 24px outline SVG, 1.7px rounded strokes: home, photo, calendar, layers, and settings. Small directional icons use the same family.
- **Components:** pill buttons, 24–30px rounded media, simple white photo cards, open page headers, clean form panels, native modal dialogs. No decorative stickers, ornamental badges, or unnecessary metrics.
- **Media:** one wide seaside-couple hero, four local sample photographs (crossing, sparklers, hydrangeas, shore), and a cloud-sky anniversary background. Generated photos are embedded in `assets/media.js` to support direct-file viewing and untainted canvas export. No network requests or image overlays on the default hero.
- **Motion:** small hover transitions and a short view reveal; disabled under reduced-motion preferences.
- **Responsive:** a compact horizontal navigation on tablets and a fixed bottom navigation on phones. On phones, hero copy sits above the photograph to retain contrast and keep the couple visible. Memory cards become two columns, then full-width for longer browsing content.

## Home copy inventory

Reference copy retained: Our Little Days; A memory book for us; Home; Memories; Anniversaries; Collection; Settings; OUR LITTLE DAYS; Together; A record of our days, big and small.; In a relationship for; days; Our Memories; Add Memory; Next Anniversary; Our Anniversary.

Intentional functional additions requested by the brief: couple names, an Explore memories entry, a View all link, real computed duration/countdowns, and editable fictional demo dates. These values are live rather than the frozen values in the reference. A small sidebar local-storage note explains the requested privacy model.

## Required states

Memories: date-sort controls, photo cards, multi-photo detail, add/edit/delete modal, empty state. Anniversaries: next upcoming event, annual and one-time date rows, optional photo attachments and notes, compact thumbnail strips, full photo viewer, add/edit/delete, past dates. The relationship anniversary supports attachments while retaining its Settings-linked date. The existing layout and colors remain unchanged. Every image-upload surface explains JPEG, PNG, WebP, the 20 MB limit, and the HEIC/HEIF conversion requirement. Collection: ordered selection of memories and anniversaries, three templates, editable pages, persistent draft, undo/redo, multi-page PDF and high-resolution PNG export. Settings: names, start date, cover preview/upload/reset, backup and validated restore with replacement confirmation. All user text is rendered as text, never executable markup. See `MEMORY-BOOK.md` for the editor specification.

The default custom-cover treatment places hero text on an opaque white panel because arbitrary user photographs may be dark or busy. This is an accessibility-driven deviation limited to user-uploaded covers.

## Visual fidelity ledger

The supplied 1,698 × 1,132 reference and browser-rendered home screen were opened with the image viewer for direct comparison. Chrome screenshots were captured by Playwright because the Browser plugin was not available. The reference's visual direction is faithfully implemented, with the intentional functional changes listed above.

| Comparison | Reference evidence | Implementation and resolution |
| --- | --- | --- |
| Sidebar and gutters | Approximately 266px sidebar; hero starts at x=296 | Corrected sidebar from 248px to 266px; retained 30px main gutter |
| Hero hierarchy | Small spaced label, large Together heading, muted subtitle, day count | Same hierarchy, 84px large-desktop heading, real computed count; added requested names and entry link |
| Palette | Cool near-white canvas, pale blue nav, navy text | Locked cool palette; no cream, decorative gradients, or photographic tint |
| Photo treatment | Bright sea, couple on the right, empty sky on the left | Dedicated generated background with the same composition; code-native text, no screenshot UI |
| Memory cards | Four photos with restrained date/title captions | Four-column desktop rail, comparable rounded corners and spacing; functional details and editing |
| Anniversary | Right-hand white panel with sky and clouds | Dedicated cloud photograph; live next-date calculation replaces the static sample countdown |
| Icons and controls | Consistent thin outline icons; quiet pill buttons | Shared inline SVG family and button primitives; accessible names also present on icon-only tablet navigation |
| Mobile/tablet | No mobile view supplied | Same design system; photo below hero copy on phones, bottom navigation; fixed tablet hero aspect-ratio overflow |
| Export typography | No export layout supplied | Three restrained templates with user-ordered pages, editable text and photos, generous margins, and matching navy/blue/neutral colors |

Above-the-fold copy audit: the reference labels are retained. The additions are names, Explore memories, View all memories, and the local-storage note, all tied to requested functionality. Dates, duration, and next-event title are live data. New imagery matches the approved composition and tone rather than reproducing the exact people or photographic pixels. No material unaddressed layout mismatch remains.

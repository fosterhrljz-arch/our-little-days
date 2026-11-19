# Landing page design and integration

The landing page is `landing.html`. The existing personal app remains at `index.html`, preserving its entry URL, IndexedDB database, and data format. Version 2 project backups and drafts remain compatible. The landing page has its own CSS and JavaScript and never opens IndexedDB or loads the app's photo library.

## Visual specification

Four section concepts guide the implementation: a centered photographic hero, an open memories/anniversaries feature section, a pale-blue Memory Book band, and a white privacy/backup closing. The design extends the existing navy/sky-blue identity into an editorial product website. It has no app sidebar, user names, personal counters, or personal-memory feed.

- Colors: white `#ffffff`, ink `#173548`, blue `#357eaf`, body text `#5d7485`, pale-blue section `#eef6fb`, subtle rules `#dce6ed`.
- Typography: local system sans-serif, large desktop hero at 88px, section headings at 58px, body at 18–20px, readable 14px navigation. Tight headline tracking with generous paragraph line-height. Film Diary previews use local Georgia and Courier New.
- Containers: 1,200px content width; a wider 1,600px hero photograph with 40px outer gutters. Open layouts, 100–130px section spacing, 28px photo corners, restrained pill-shaped actions, and a simple book spread.
- Header: existing app mark and name; The experience, Memory Book, Made for two; Open app. On phones the three section links occupy a second row, without a hidden menu.
- Hero: “Little days.” / “A beautiful story.”; “A quiet place for your photos, your milestones, and all the moments in between.”; Start Our Story; Take a little look. No eyebrow or badge. The photograph has no tint, overlay, or text.
- Experience: “The days pass. The feeling stays.” with an independent coastal photograph and an illustrative June calendar. Links open real Memories and Anniversaries routes.
- Book: “A story only you could make.” with two example pages and three functioning style previews. The preview is illustrative, never connected to a personal draft. Open Memory Book opens the current editor/setup unchanged.
- Closing: “For the two of you. And only you.” with offline and backup explanations, a final Start Our Story action, a Settings link, and expandable photo credits readable offline.
- Motion: short entrance and section reveals, small button feedback, smooth anchor scrolling. Reduced-motion preferences disable these effects. Content and navigation remain usable without JavaScript.

## Licensed photography

Both production photographs were sourced specifically for this landing page from Tunafish on Unsplash. The new hero is not in `assets/media.js`, the memory timeline, any album, or any user upload. The feature photograph is also new. See `assets/landing/CREDITS.md` for sources, license summary, and file hashes. Generated design concepts are review references only and are not bundled as website images.

## Navigation and data boundaries

All app links are relative and work from local files: `index.html#home`, `#memories`, `#anniversaries`, `#collection`, and `#settings`. Existing app bookmarks continue to open the dashboard. Return links in the app sidebar and Settings open `landing.html`; a pending Memory Book save finishes before leaving, while failed saves or active exports keep the editor open. Unsaved form behavior continues to use the existing browser close/navigation warning.

The landing page has no storage writes, analytics, external assets, fonts, services, or runtime dependencies. Source/license links are optional external navigation and clearly marked as requiring internet. They are not fetched by the app.

## Implementation differences from the concepts

The existing local app mark replaces the generated mark for brand consistency. The source photographs replace generated photographic approximations, preserving the real photographers' compositions without modification. The example calendar uses a real June 2024 arrangement. The book preview uses restrained paper corners rather than rounded app cards, and adapts to stacked text on phones. All visible text is HTML rather than part of an image.

## Visual verification

The four section concepts and browser-rendered sections were opened side by side with the image viewer. The review checked the header, headline hierarchy, button placement, white/blue palette, photograph framing, section rhythm, template controls, and mobile stacking. The desktop hero crop was lowered to retain the beach figures fully inside the frame. No unplanned above-the-fold copy was added.

The implementation follows the concept composition with the intentional differences listed above. Desktop captures include the concept's native 1,487px width; responsive tests cover 320, 390, 768, 1,024, 1,440, and 1,698px. Phone feature sections were inspected separately at 390px. No material clipping, overflow, or navigation mismatch remained after the final review.

Playwright with installed Chrome on Windows was used because the Browser plugin was unavailable. All workflow tests ran from local files with the browser offline. No server or public deployment was used.

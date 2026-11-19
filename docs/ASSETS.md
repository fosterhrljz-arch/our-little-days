# Image provenance

The six in-app demo photographs were generated for this project with the built-in image generation tool. The user-supplied dashboard was the visual reference. It is not used as a flattened interface; all text and controls are real HTML. No remote image service is required at runtime.

Version 3 adds two separate licensed photographs for the landing page, both by Tunafish on Unsplash. The landing hero is entirely new and is never added to the memory library, project data, or backups. See [landing photo credits](../assets/landing/CREDITS.md) for the source URLs and license summary. The generated layout concepts are design references only; their images are not used in production.

The final assets are embedded losslessly as PNG data URLs in `assets/media.js`, under `window.OLD_MEDIA.hero`, `crossing`, `sparklers`, `hydrangeas`, `shore`, and `sky`. The app mark is the small native vector in `assets/icon.svg`.

## Hero prompt

Use case: photorealistic-natural. Create a production background photograph for Our Little Days, an elegant offline couple memory book. Wide landscape 2.4:1 composition. Calm Japanese seaside in bright natural summer light, blue ocean, pale blue sky, distant green island mountains. A young adult Japanese couple seen entirely from behind, man in white linen short sleeve shirt and woman in white summer dress leaning her head on his shoulder, sitting together on a low grey seawall. Place the couple in the RIGHT HALF at about 70 percent horizontal position with bodies contained within the image. Left 45 percent must be empty softly lit sky and low blue sea with plenty of negative space for dark UI typography that will be added in HTML. Horizon approximately 70 percent down the image. Airy, serene, refined editorial photograph, real natural texture, softly luminous high-key light, pale sky blue palette matching the user's seaside app reference. Only the photograph: no lettering, no UI, no borders, no watermark, no scrapbook treatment.

## Memory photo prompts

Each of the following scene prompts was prefixed with:

> Use case: photorealistic-natural. Production sample photo for Our Little Days, a refined personal memory book with Japanese summer atmosphere.

Each was followed by:

> Airy editorial photography, premium natural composition, subtle film softness, realistic textures, calm mood, blue palette. No text, letters, branding, UI, border or watermark. One single photograph.

**Crossing:** A quiet Japanese coastal railway crossing at Kamakura, black and yellow crossing signal in right third, blue ocean visible behind, soft clouds in pale blue summer sky, empty pedestrian crossing, green grass. No train or people. Landscape 4:3.

**Sparklers:** Close candid photograph of two adult hands each holding a lit sparkler on a quiet Japanese beach at summer dusk. Only hands and sparklers with natural anatomically correct fingers, ocean softly blurred behind, soft blue and peach sky, small warm sparkling light. Landscape 4:3.

**Hydrangeas:** Close photograph of fresh pale lavender-blue hydrangeas at a coastal Japanese garden in June. Beautiful large blossom in foreground, fresh green foliage and soft blue sky bokeh, dappled natural morning light. Landscape 4:3.

**Shore:** Gentle white foam washing onto a clean pale sand Japanese beach, clear pale azure water, serene natural summer sunlight, low camera angle, distant water softly blurred, elegant restrained composition. Landscape 4:3.

## Anniversary sky prompt

Use case: photorealistic-natural. A single soft photograph of a pale clear sky-blue Japanese summer sky with white cumulus clouds clustered along the lower third and a little at the far right, open blue sky above. Serene natural daylight, airy high-key real photography, elegant very subtle atmospheric texture, matches a Japanese seaside couple memory book. Landscape 3:2 composition. No land, sea, sun disc, people, text, watermark, UI or borders. Production background image for a small upcoming-anniversary panel.

## Production notes

Generated imagery is fictional and may contain synthesized details. User-uploaded photos are processed only inside the browser. They are never sent to an image model. The reference's lettering, menus, controls, and cards were implemented as accessible HTML/CSS, with inline SVG icons and canvas used only for the explicitly requested collection export.

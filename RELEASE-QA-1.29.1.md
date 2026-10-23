# Release QA 1.29.1

Cause: entrance CSS referenced /images/optimized/*.png.webp directly. Production server.js only exposes negotiated /images/*.png or *.jpg URLs, so the backgrounds returned 404 while a permissive preview server displayed them.

Fix: all entrance CSS uses the public PNG URLs. Production delivery negotiates the existing optimized WebP via Accept and retains the original PNG fallback. Existing layout, artwork, fades and transparent logos are unchanged.

Validation: 36 production HTTP tests passed, including every CSS image URL and all three entrance scenes in WebP and PNG form; recursive browser import graph passed. Four entrance asset/layout tests passed. 23 activity, bot and Luca/territory regressions passed. Four language audits returned zero missing entries. The live database was not accessed or changed. Prepared for the user-authorized GitHub upload after the complete artwork checks.

Expanded artwork validation: all 805 local image/icon URLs returned HTTP 200 with the correct format through production server.js; 342 available WebP variants loaded correctly. All 1,147 raster/vector files, including optimized copies, decoded or parsed successfully with zero failures. The inventory covers authoritative catalogs, skins, cities, page artwork, achievements, source literals and installed image/icon files.

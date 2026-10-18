# Full visual review — 15 October 2026

Build: `2026-10-15-visual-review-1`.

## Luca's upkeep

Luca is programmed to read the shared navigation, game catalogs, rulebook/FAQ and account-specific server quotes. Existing catalog changes are therefore reflected directly. New mechanics and new data sources still require their integration and explanation to be added. He does not independently read and understand arbitrary future code.

`AGENTS.md` makes guide maintenance part of every feature change. Coverage tests verify the menu and catalog entries, player eligibility and live market advice. This is stored in the project; it does not depend on remembering an instruction in a future chat.

## Scope and findings

All 259 raster files in `public/images` were inspected using contact sheets, including eight newly generated replacements. Exact RGB pixel hashes and normalized image hashes found no identical raster files. The registered content inventory contains 270 image/icon references; after replacement the only shared image between distinct registered entries is the intentionally shared Personal/Family armory banner. Identical items naturally reuse their photograph in personal/family armories, catalog cards, collections, selected profile covers and contextual purchase results. City photographs represent the same city on map and airport cards. Game branding is shared intentionally.

All 308 SVG files in `public/icons` were reviewed: 63 navigation/HUD/assistant symbols, 30 achievement medals, 15 coin logos and 200 prestige emblems. Sixty of these symbols belong to the menu/group registry. The audit checks actual files, references and pixel equality; visual suitability was reviewed separately rather than inferred from unique filenames.

| Finding | Change |
| --- | --- |
| Welcome, login, registration and dashboard shared a background | Dedicated dashboard, login and registration artwork; welcome retains its existing scene |
| Rival family and attack-plan cards used a generic family photograph | Actual owned headquarters or targeted territory; family crest when no matching property exists |
| The stock profile skyline showed a trophy-room scene | A real city panorama, also matching the New York skyline preset for families |
| Enforcer assault shared the mugging photograph | Dedicated confrontation illustration |
| Skyline extraction showed only a skyline | Rooftop helicopter extraction illustration |
| Shop robbery looked like another jewelry-store job | Convenience-store illustration |
| Laundromat did not clearly show washing equipment | Visible rows of washers and dryers |
| Starter studio looked like a penthouse | Compact studio with bed, kitchenette and desk |
| Airport resembled the Private jets symbol | Control tower and runway symbol |
| Several menu symbols were too similar | Revised calendar, bank, compound, holdings, ticket, respect and achievement symbols |
| Several medal motifs did not match their milestones | Footsteps, fedora/street, city, chess, luck and teamwork motifs |
| Raven was an aircraft; Vesper and Ember both looked like suns | Raven bird, Vesper crescent; Ghost and Silk also receive fitting symbols |
| High prestige badges had increasingly dense rings | Twenty underworld motifs combined with ten clear heraldic settings, one distinct combination per distinction |

Legacy/draft images that no longer belong to selectable game content remain in the files for compatibility; the contact-sheet label “unused / contextual” means the file is outside the registered catalog list. It also covers actively used branding and dynamically selected popup/shipment artwork, so it is not a claim that every unregistered file is unused. No game economy values or player data were changed.

## Logout

Log out is now a sibling of the player information frame, to its right, rather than a child inside it. The arrangement adapts on mobile. The shared banner registry is reapplied after in-page rerenders, preventing search/refresh actions from restoring an old placeholder image. Ordinary page images keep their brightness; personal/family profile fading remains the existing exception.

## Evidence and validation

The regression suite passed **216 tests with no failures**. All SVG files are valid XML; no identical SVG files or identical raster pixel contents were found. Logout placement was checked on desktop and at 390 pixels, with no horizontal overflow.

- `art/full-art-inventory.json`: registered image uses.
- `art/full-raster-audit.json`: file dimensions and pixel duplicate checks.
- `art/audit-rasters-01.jpg` through `09.jpg`: all raster contact sheets.
- `art/audit-replacements.jpg`: the first five targeted replacement illustrations.
- `art/audit-icons-navigation.html`, `audit-icons-achievements-coins.html`, `audit-icons-prestige.html`: SVG review galleries.
- `art/visual-audit-prompts.json`: saved paths and final prompts, generated with built-in image generation.
- `scripts/audit-interface.mjs` and `scripts/audit-visual-assets.mjs`: missing-file and unintended-sharing checks.

Deploy the complete package, keep the live `data/` and environment, restart Node and check `/api/health` for the build above. No remote server was modified.

# Release QA - 1.22.3

- Full isolated test suite: 398 passed; no live database used.
- Dutch, Spanish, French and German completeness audits: zero missing entries.
- Browser review: desktop at 1440px; mobile header at 390px and 320px. No horizontal document overflow at either mobile width.
- The edge tab opens and closes the drawer; its expanded state follows the menu. The mobile drawer footer displays v1.22.3.
- Approved preview styling is applied through premium-theme.css. Language/logout controls sit beside player identity on mobile, with balances below.
- v4 PWA icons preserve the original full-bleed artwork. The maskable source no longer includes the old padded surround. Manifest, Apple touch icon, service-worker notification images and HTTP routes reference v4.
- App-icon appearance was previewed with rounded-square and round masks; this is not a real-device install/update test. Existing installed icon refresh remains browser/OS dependent.
- Bots and Luca regression coverage passed in the full suite; no gameplay mechanics or economy changed. Real device push remains paused.

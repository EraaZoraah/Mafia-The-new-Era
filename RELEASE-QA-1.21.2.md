# Release QA - 1.21.2 - 20 October 2026

## Scope and results

- Full Node regression suite: 392 tests, all passing. Isolated fixtures exercise authentication, session/origin validation, staff authority, money conservation, transaction/replay protections, custody, passive income, family operations, auctions, racing, bots and Luca. Real saved databases were not used or reset.
- Localization audits: NL/ES/FR/DE each have zero missing controlled UI, rulebook, descriptions, literal validation, generated results, catalog labels, changelog and shared guide facts. English is the default.
- Browser checks: switching among EN/NL/FR/DE/ES on desktop and 390px mobile dashboard; visible translations, unchanged rank and dollar notation, no horizontal page overflow and no captured browser errors. These are smoke checks, not every screen/state on every device.
- Static checks: 160 root/public JavaScript modules parsed successfully with no missing relative imports.
- Interface audit: 68 menu/group icons, 59 page headers, five compound extension images; no missing references or duplicate menu icons. The personal/family armory header share is intentional.
- Asset audit: 164 catalog/activity references, 38 achievement symbols and 15 coin symbols; no missing files. File availability does not establish visual quality for every asset.
- Mr.Noob retains the same entitlement ID and now references skin-mr-noob-v2.png. Owner-only grant, persistence, no free/bundle unlock and Admin denial tests pass. Original art remains available as a source; existing owners of the skin see the new art.

## Fixes

- Staff ticket polling reused a new label alongside the navigation label, duplicating Support tickets. Navigation now supplies the label that polling updates; regression expectation and browser check cover it.
- Replaced literal French/German Self Made translations with appropriate character-title wording. Made the German dashboard motto use a consistent form of address.
- Asset audit no longer treats navigation section headings as missing page icons. It now reads real menu entries.

## Limits

Passing tests reduce regressions; they do not prove absence of every bug. Artwork text and player/staff-authored content are not automatically translated. Rank names, currency and numeric punctuation deliberately stay unchanged. No real payment, mail-provider, live-host or device-push delivery was exercised; push remains paused. Existing game balance was not changed. Bots use normal validated gameplay routes and cannot use staff gift powers. Luca remains local and its live-context and locale tests pass.

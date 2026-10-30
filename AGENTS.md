# Maintaining Mafia: The New Era

- English is the default player language. Dutch, Spanish, French and German localization are available through public/i18n.js and the explicit public/nl-*.js and public/es*.js, public/fr*.js and public/de*.js dictionaries; keep coverage complete when changing features. Keep existing accounts and game state intact.
- Do not change balance unless the current request asks for it.
- Personal Assistant is a local, free guide. Keep it current as part of every feature change:
  - Register every player page in `public/navigation.js`; the guide reads that same menu.
  - Keep content in the existing exported catalogs. `game-knowledge.js` indexes their live entries, names, limits and rewards.
  - Explain new rules in `public/rules-ui.js`; those exact chapters and FAQ answers are also indexed by the guide.
  - For state-dependent advice, use the feature's authoritative server quote/validation functions. Never copy price formulas or recommend unavailable actions as available.
  - Add the new catalog source to `gameKnowledge()` if introducing a new content collection, and extend the knowledge coverage test.
  - Verify guide recommendations for locked content, insufficient resources, custody and changing quotes.
- Navigation SVGs must be unique page-appropriate symbols in the established gold stroke style. Page banners must use dedicated overview artwork, not catalog item artwork. Personal and family armories intentionally share their overview at the user's request.
- Use isolated databases and temporary preview servers for tests; never reset the real database for testing.

- Before declaring a visual review complete, check both image contents and actual sharing. Different filenames do not establish uniqueness. Preserve reviewed SVGs when running legacy generators; use `scripts/full-art-audit.mjs` and `scripts/contact-art-audit.py` for the expanded inventory.

- Language selector: English default; Dutch, Spanish, French and German selectable. All four non-English dictionaries and Luca locale adapters must follow every feature change. Maintain explicit translations for UI, validation/results, catalogs, rules, FAQ and local guide. Run the language audit and scenario checks on every changed feature. Keep rank names and user-authored content unchanged.

- Autonomous players: register every new player mutation in `bot-capabilities.js` and implement a state-aware caller in `bot-autonomy.js`/`bot-players.js`. The route coverage test must pass. Do not automate staff powers, real payments, credential changes or invented support accusations. Preserve the bot badge, variable activity, ordinary server validation and global pause switch. Update Luca's live context and shared rulebook for every new mechanic; catalog items are indexed from their authoritative exports.

- Every update must audit autonomous bot callers and Luca knowledge/advice for changed features, with tests. End every user-facing final answer with an explicit truthful Bots / Luca status; never imply verified coverage without running checks. Keep dollar currency and existing English number punctuation in all languages.

- User explicitly paused real device push on 18 October 2026. Keep it off by default even when VAPID keys are present; FUTURE-WORK.md records the activation checklist. In-game notifications stay enabled. Do not reactivate without a new user request.
- Personal passive cash uses income_cycles as the authoritative 24-active-hour collection budget. Keep businesses, employees, dashboard clock and Luca advice aligned. Custody pauses it; full collection resets it; preserve saved income on migration and partial/full-wallet collection.

- Release announcements: the 1.24.0 catch-up dispatch summarizes earlier updates. Each future user-visible release must include one new translated releaseNotes entry with announce:true; preserve the idempotent release_announcements ledger. Exclude private staff capabilities and detailed cash/XP balance changes from public announcements.

- Frontend startup verification must use the actual server.js HTTP allowlist, not only a permissive preview server. Keep the recursive browser import test in test/baseline.test.js passing when adding public modules; verify HTTP 200 and JavaScript MIME type for the entire app.js/pwa.js import graph.

- Personal hourly income supports manual claims at any time plus persistent two-hour server-scheduled auto-claims, including offline players. Manual claims do not reset the auto schedule. Custody pauses accrual/payment; wallet overflow stays saved. Keep the 24-active-hour accrual safety cap when collection cannot complete.

- Incoming background events belong in the persistent notification inbox, not outcome dialogs. Preserve own risky-action results. NPC contact cadence uses presence session time: first ten minutes, then fifteen online minutes between offers; offline time cannot accelerate it.

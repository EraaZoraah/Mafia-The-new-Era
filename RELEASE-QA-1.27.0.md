# Release 1.27.0 verification

- Full isolated test suite: 467 passed, zero failed (`.preview-portfolio-review/release1270-first.log`). The actual production server HTTP module graph test is included.
- Eight specialist tests cover legacy migration, all three class budgets, exact cash debits, replay/stale quotes, invalid module IDs, route-specific improvements, reduced mistake risk, custody, ownership, insufficient funds, very high wear repair, multiplayer rating, locked car snapshots, bot purchases and live Luca quotes. Existing escrow, replay, timeout, daily cap, class, condition, custody and weekly trophy tests remain enabled.
- Existing balanced tuning levels and recorded paid-cost resale basis are retained. Schema adds three checked columns with zero defaults. No production data was used or reset during testing.
- All four language audits report zero missing controlled UI, rules, catalogs, validation, generated messages, announcements and guide facts. Driver rank names and user content remain untranslated.
- After refining the localized live quote path, all 18 focused specialist/Spanish/French/German cases passed. Native Spanish, French and German questions now receive a fully localized workshop quote instead of an English sentence with a translated module name.
- Desktop browser: upgraded the preview RS7 suspension for the quoted $120,000. Handling increased 78 → 79.5, rating 747 → 752, budget 0/8 → 1/8, and the next quote became $480,000. Aggressive strategy stayed selected and the page stayed at the workshop; outcome displayed inline.
- Checked the workshop at desktop and 390×844 mobile. Localized module headings fit their cards, controls remain accessible and the grid stacks on mobile. Browser preview used an in-memory fixture only.
- Bot route registry already includes the workshop; its state-aware caller now chooses affordable available specialist modules. Luca reads live board quotes and the shared module catalog. Suggestions disappear when funds or availability do not permit an upgrade.
- A translated release announcement opens via the existing unread-update flow. Health/version/footer identify 1.27.0 and `2026-10-23-release-1.27.0`.
- Real device push remains paused. No economic multipliers or casino mechanics were changed.

Run `npm ci`, `npm start` and `npm test` from the game directory. Preserve deployment data and environment; restart the process/container when deploying.

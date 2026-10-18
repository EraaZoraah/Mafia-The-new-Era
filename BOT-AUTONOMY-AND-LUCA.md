# Autonomous players and Luca

Build `2026-10-16-bot-autonomy-1`.

## Autonomous gameplay

All existing enabled bots, including the fifty added previously, use the expanded controller after a server restart. No reseeding, account reset or balance grant is required. Their activity values, personalities, global pause switch and account restrictions are retained.

There are 35 decision domains and 91 registered ordinary-player commands. These include every implemented player mutation: crimes/PvP, weapons/ammunition, personal/family acquisitions, employees, all six casino games and lottery, personal/family investments and production, both freight systems, garage resale, recruitment, role promotion and succession, alliances, wars/capture/sabotage/joint assaults, attack planning, team missions, marriage, bounties, custody/reporting/breakouts, transfers, protection, respect, profiles, chat, gifts, objectives and achievements. All personalities can evaluate every domain. Prerequisites, costs, balances, custody, cooldowns, storage and role permissions still determine whether an action is currently possible.

The scheduler mixes productive play with least-recently-visited domains and random choices. Different activity values still change session lengths and time offline. Choices are state-dependent: bots finish active casino hands, accept suitable invitations, launch full crews, sell/ship completed stock, compare vehicle freight quotes and withdraw reserves when cash is low. This is a local rule-based player controller, not a paid conversational AI and not a promise that each bot will perform every command during a particular observation period. A bot must first earn the rank, equipment and authority that a human would need.

Unsolicited social actions and destructive family management use bot targets. Normal hostile player operations continue to respect protection and membership rules. Bots remain visibly marked. Human messages receive an automation disclosure rather than invented free-form answers. Chat, invitations, leadership changes and transfers have extra decision intervals to limit churn. Genuine persisted server errors can create one deduplicated bug report per route per week; ordinary rejected moves do not create reports. Staff replies can be read and acknowledged.

Excluded administrative/account operations are explicitly listed in `bot-capabilities.js`: staff controls, real payments, registration/credential changes and browser-session management. The scheduler uses the existing presence service for sessions. No bot can acquire Owner/Admin privileges or fabricate paid shop items. The disabled real-money checkout remains disabled for everyone.

`bot_action_stats` records per-account command attempts, successful responses and latest status/time. Owner's existing `/api/admin/bots` endpoint now includes the coverage ledger and these statistics. This distinguishes implemented capability from commands actually executed successfully. The route classification test fails when a newly added server route has not been classified, and the caller coverage test checks each registered command has autonomous implementation.

## Luca

Luca continues to read the shared navigation, catalogs and rulebook on demand. Coverage now also includes every fictional cryptocurrency, public skin, respect rank, sentence option and city outline. His car advice uses the same server quote/transport functions as the warehouse page: pending recovery, free bays, garage space, affordable transport improvement, fees, travel time and interception risk. He does not inspect hidden future interception outcomes. Advice warns that destination prices can move before arrival.

Territory answers show the player's current family conquered count, capture timers and management rights. Drug advice still compares authoritative live hourly quotes across unlocked products, cities and routes. Detained players are not told to perform unavailable vehicle or capture actions.

Catalog additions are indexed automatically. New mechanics still need their shared rulebook entry and any necessary live context; the maintenance instructions and regression tests now explicitly require this with future changes. Luca is a maintained local game guide, not a service that independently discovers arbitrary new code.

## City outlines

No official districts are necessary. The existing fifteen maps retain their approximate historical geographic city outlines with fictional parcels. District/block sizes are game design. No new external map service or recurring cost has been introduced. See GEOGRAPHY-NOTICE.md for source accuracy/licensing.

The map now occupies the whole panel width. Territory-type cards and a horizontal image/details/actions panel sit underneath. Colored swatches replace text-only color explanations. Neutral, gold, green and red remain consistent with actual ownership. A teal cartographic background, clearer borders and highlighted selection improve legibility without dimming page banners. Fit city calculates the outline bounds rather than leaving the old fixed padding; zoom controls range from 100% to 300% and center on the selected parcel. Mobile uses available width without horizontal overflow, with zoom and the accessible territory selector for small streets. Browser proofs: `art/territory-atlas-desktop.png` and `art/territory-atlas-mobile.png`.

## Verification and deployment

Tests use isolated in-memory databases and a disposable HTTP fixture. The bot suite evaluates every domain on all fifty newly provisioned test bots at their actual starting resources, then exercises richer scenarios, including real capture, joint assault, promotion, alliance consent, gift collection, bank conservation and bail. A mixed run records which commands really succeeded. Luca tests check catalog coverage, live vehicle values, storage, detention and capture timers. Logs are included in `art/autonomy-guide-tests.log`, `art/bot-autonomy-regression-tests.log` and `art/bot-autonomy-http-tests.log`.

245 automated checks passed (216 serial regression checks plus 29 isolated HTTP checks). The atlas layout was additionally inspected in the browser on desktop and at 390px, including selection, zoom and switching city. The final source syntax and targeted guide/map checks are recorded in `art/autonomy-guide-tests.log`.

Back up the hosted database, deploy the full package while preserving `data/` and environment configuration, then restart Node. New diagnostics tables migrate automatically. `/api/health` should show `2026-10-16-bot-autonomy-1`. The optional fifty-bot addition was already performed locally in the previous update; do not add another wave for this change. The separate-host additive script remains idempotent if that host has not received them yet.

No remote host or real player database was modified during this update. No economy balance values were retuned.

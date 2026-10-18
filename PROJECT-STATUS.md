# Conversation requirements — verified status

Audit date: 10 October 2026. This replaces the old initial audit as the current feature inventory. It does not claim that every original ambition is complete. Verification combines current source inspection, automated isolated tests and selected browser workflows; it is not a production security audit or long-term economy simulation.

## Implemented

| Requested area | Current implementation / evidence |
| --- | --- |
| English game, secure Owner provisioning | English UI, SQLite, salted scrypt passwords, session cookies, protected API roles and terminal Owner setup. Normal registration cannot grant staff roles. `server.js`, `staff.js`, baseline tests. |
| Expanded crimes, random payouts, PvP | 20 ordered NPC crimes; attack, robbery, hostage and liquidation player operations. Robbery uses up to 10% of target cash without a fixed dollar cap. Hostage difficulty and reward depend on rank, with a $10m ceiling before protection/cash limits. `catalog.js`, `game.js`. |
| Rank and energy progression | 25 normal ranks through The Godfather, then recurring legacy distinctions. Compounding income bonuses, energy restoration on promotion, automatic regeneration, total energy cap 1,000. `progression.js`, `catalog.js`. |
| Repeatable personal assets | Businesses, 24 cars, homes, garages, helicopters, jets and yachts. Four-copy cap, scaling prices, income and bounded perks. Budget cars/homes do not grant energy. `catalog.js`, `public/premium.js`. |
| Family economy and holdings | Family creation $1m, treasury, donations and contribution respect, safehouses, one compound with 90% trade-in credit, SUVs, permanent upgrades and temporary guards. Don/Capo spending permissions. `empire.js`. |
| Independent careers and missions | 15 drugs and 15 guns career levels for individuals and families; shipments, escorts, optional timed NPC contact missions. These are not live human team heists. `empire-catalog.js`, `empire.js`. |
| Investments | Personal/family investments, active principal cap $1bn, maximum 72h and 8% term return, variable rates and detention-aware personal interest. `investments.js`. |
| Transfers and respect | Cash and energy transfers, 10 respect ranks, five distinct daily recipients, $50k and up to ten energy per respect gift. `transfers.js`, `underworld.js`. |
| Coma and prison | 72h liquidation coma, declining $100m initial treatment fee; paid prison reports, third-party/family release and risky breakouts. Detention pauses activities and personal income while preserving accrued earnings. Failed NPC jobs also cause fines or 5–60 minute arrests. `underworld.js`, `game.js`. |
| Profiles and messages | Custom public player profiles; profile links, direct transfers/respect; inbox and threaded messages with replies/read tracking. Prefix player search. `profiles.js`, `community.js`. |
| Family dashboard | Themes, five crests, motto, open/application/invite recruitment, invitations, hierarchy tree, wealth and attack statistics. Capacity grows 15–30 with careers, plus 2/7/20 compound places, maximum 50. `community.js`. |
| Administration and staff | Player/family sections; money, XP, major statistics, timers, roles, holdings, membership and investments. Admin is blocked from Owner accounts/families and own role changes. Owner/Admin badges; Moderator removed. New armory quantities are editable. `owner-admin.js`, `staff.js`, `logistics.js`. |
| Economy and rankings | Public player/family net worth rankings and staff aggregate money/assets; weapons count at catalog value, unsold production at cost, ammunition excluded. `underworld.js`. |
| Test world | Existing database contains 51 accounts (50 test accounts plus the original account) and five seeded families. Idempotent seed scripts and account documentation retained. |
| Presentation | Grouped sidebar; My Family below My Profile; consistent responsive cards; result notifications, game rules, FAQ, local photographic artwork and gold game logo on all requested entry screens. Some operations reuse themed artwork. |
| Weapons and ammunition (new) | Six weapon designs, three tiers, personal/family stores and rounds. Every valid crime/PvP/shipment/contact/raid/breakout attempt spends the required ammunition, even on failure. Tier requirements, 10,000-per-design weapon cap, 100k round storage cap, family permissions and duplicate-purchase protection. `logistics.js`. |
| Power (new) | Personal weapons plus permanent/temporary protection; family Power totals member Power, shared weapons, all family assets/compound and guards. Displayed in game header, profiles, armories and family dashboard/wealth rankings. A derived score; no extra hidden odds multiplier. |
| Airport (new) | Owned jet required; 15 cities, server-priced fares, 15-minute cooldown, persistent per-city heat. Away-city heat cools one point/hour. Current heat raises arrest risk on failed NPC jobs from 35% to 60%. No PvP immunity or detention bypass. |
| Drug production (new) | Five abstract products, personal and family production, 6/12/24h terms, 1–100 crates, three occupied slots, career gates/bonuses, hourly 90–110% sale prices, single sale and wallet-cap checks. Personal production pauses in custody. |

## Not complete / limitations

1. **Full family wars:** individual raids exist; no declared campaigns, territory capture, war objectives, scores or war-end rewards.
2. **Casino:** Higher or Lower and hit/stand Blackjack are now playable with persistent server-side rounds, protected payouts and fictional cash. Roulette, slots and advanced Blackjack moves are not implemented. Casino business ownership continues to earn passive income.
3. **Daily activities and scheduled events:** daily respect limits and random contact jobs exist; daily quest board now implemented with atomic fixed cash/XP claims and a UTC reset. Staff can schedule informational event announcements; login streaks and automatic event gameplay modifiers remain unimplemented.
4. **Announcements and comprehensive staff tooling:** Owner/Admin announcement editor now implemented (drafts, scheduled publication, revisions, archive, one-time pop-ups and audit). No dedicated login/security incident viewer, password recovery or email verification. “Everything editable” is not literally achieved: profile/family appearance has its own member settings, production batches and stored city heat do not yet have dedicated Owner editors. Power and ranks are derived from editable equipment/XP.
5. **Real multiplayer team jobs:** mystery jobs simulate an NPC crew. They do not recruit multiple human players into a synchronized heist.
6. **Public-hosting readiness:** local server request validation, Origin/content-type checks and role/transaction tests exist, but login throttling remains absent (20 invalid logins still return 401). HTTPS deployment, password recovery, monitoring, operational backup/restore drills, load testing and economy abuse/balance testing are still needed.
7. **Statistics history:** attempt and raid counters start when their tracking tables were introduced. They cannot reconstruct all older play. Arrest/coma counts use retained custody records.
8. **Artwork specificity:** all current catalogs have image references, but not a unique generated photograph for every new weapon, city or product. Existing themed images are reused; vehicles remain artistic interpretations rather than verified 2026 product specifications.

## Suggested next development order

1. Login/message abuse controls, account recovery, deployment/backups and real economy playtesting.
2. Complete staff editors for the remaining new records and automatic event gameplay modifiers.
3. Login streaks and cooperative player missions.
4. Formal family wars/territory and optional additional casino variants.

## Run and test

From this project folder: `npm start`, then visit `http://localhost:3000`. Run `npm test` for isolated regression tests; they create temporary databases and do not reset the live world. Restart the server and refresh with Ctrl+F5 after updating. Back up SQLite with its backup API before migrations.

The initial `AUDIT.md` remains a historical snapshot. The current test suite covers the new resource economy, permission boundaries, duplicate requests, production timing, heat travel and existing gameplay. Browser checks use a separate dummy database.

## Interface and rankings update
Owner/Admin insignia now appear after player names. Announcements are a dedicated page above Dashboard with separate framed event and news sections. Daily objectives have six server-verified goals and are no longer shown on the dashboard. Underworld rankings combines the former leaderboard and wealth listings into three top-ten tables (XP, player Power, family Power), with explicit Power and net-worth columns. Duplicate global player lookup forms were removed. Admin assignment and protected Owner access verified in automated tests, and Admin menu/list visibility checked in the browser. Regression suite: 95 passing checks.

## 11 October family update
Added persistent scroll position, additional family roles, member Power and promotion/kick controls, direct profile PvP, Don/Capo family inventory, atomic bulk purchases, custom ammunition quantities, $25m family creation and $5b top compound. Weapons now cap at 10,000 per design; ammunition costs $1,000 per round. Admin restriction now protects the Owner account/membership rather than blocking the entire family. Earlier snapshots of prices and four-copy weapon caps are superseded by these values.

## Family wars — 11 October 2026

Implemented dedicated Rival families page, Power-based raid odds (1–95%), cash-only loot up to 10% with vault reductions, 24-hour declared wars, point scoring, surrender, ceasefires, persisted battle history and notifications. All 107 tests pass. Browser verification used a disposable game copy.

## Territory, team operations and victory rewards — 11 October 2026

Three territory types support 25 holdings each; bulk purchases and wartime capture obey transactional database limits. Added temporary defense sabotage, consenting 2–5-member joint assaults, costs and shared cooldowns, war-operation logs and 24-hour non-stacking +10% family-share shipment rewards for victories after combat. My family and rivals show wins, successful raids and success percentage; territory appears in family possessions and a dedicated shop. 114 tests pass. Browser-tested Buy MAX to 25/25 and assault recruitment. Migration copy preserves balances, XP, members and holdings. Backup: backups/pre-territory-20261011.sqlite.

### 11 October 2026 — city atlas, community and legacy
Implemented: 15 airport-city maps, 90 plots each, atomic purchase/capture (20 bought / 30 controlled per city), current-member family chat, attack plans and volunteers, four introductory milestones / ten permanent cosmetic achievements, 28-day family seasons with archived trophies, paginated full player directory, floating world chat with staff moderation, daily family respect, and server-side 5% triple-payout/XP Big Scores. Game rules and README document the limits and navigation. Planning does not automatically launch battles. Seasonal points/trophies do not reset assets or increase economic rewards.


## 11 October — seasons, identity, shop and security follow-up

Supersedes the earlier ten-achievement, no-season-prize and no-auth-throttling notes: 30 achievements and 12 curated avatars are implemented. Green/red plot ownership includes family names. Automatic 28-day events recap results and award family cash/respect, temporary medals/titles and permanent trophy history, with tie handling and preserved overflow. Cosmetic shop and audited Owner/Admin complimentary grants work; PayPal checkout remains disabled until a verified merchant integration is configured. Authentication uses persistent account/network throttling, asynchronous stronger scrypt hashes with legacy upgrades, bounded hashing concurrency, rotating/revocable sessions, account password changes, request hardening and a staff security viewer. No claim of comprehensive production security: email verification/recovery, MFA, infrastructure rate controls and operational monitoring still need work. See SHOP-AND-SECURITY.md.

Validation: 136 tests passed in `npm test` (including isolated HTTP auth/session tests, season tie/overflow/restart tests and shop authorization/idempotency). A copy of the current database passed two consecutive installations with balances, XP, roles and personal/family asset quantities unchanged; SQLite integrity and foreign keys passed. Backup: `backups/pre-shop-security-1791724334088.sqlite`. Browser verification on the isolated port-3101 preview covered automatic season notification, shop catalog, Admin self-grant, equipping cosmetics/avatar, territory ownership names/colors and season rules; no browser console errors. Screenshots are in `art/qa/`. The preview server was stopped afterward. The live server was not restarted; restart it and refresh browser assets to load this update.

## Economy and mobile review — 2026-10-11

- All 20 NPC crime cash baselines (including extra loot and Big Score cash) are now 10% of the previous values. Rank/respect/collection factors, XP and Big Score chances remain unchanged. PvP, shipments, contact missions and casino payouts are separate systems and are not changed by this adjustment.
- All personal asset passive hourly base rates, including businesses, rentals and charters, are now 10% of the previous values, rounded down to whole dollars. Rank bonuses remain in force. Already stored cash, bank and pending income are preserved. Unprocessed accrual uses the new catalog rates after restart.
- One active home per design; other personal assets retain the four-copy cap. Purchase, Buy MAX, staff editing, perks and database triggers enforce the same limit. Existing extra homes are preserved in archived_possessions, with no income or perks. Repeated startup does not archive twice. This is one per design, not one residence across all designs.
- Family holdings have no separate hourly passive-income stream; their existing defense, Power and shipment bonuses remain unchanged. Investment interest and production markets are unchanged.
- All 47 Admin-visible navigation pages were opened at 360px or 390px browser widths. The territory map was the only page-wide overflow found: its grid now shrinks correctly and the 900px map scrolls inside its own frame. Mobile map form fields stack vertically.
- Desktop/mobile comparison confirmed identical text for all 20 crime cards and 12 home cards. Preview-only home purchase, ownership-limit feedback, map territory selection and floating world chat were checked.
- Validation: 140 automated tests passed (economy-mobile-test.log). Browser checks use responsive desktop Chromium viewports, not physical iOS/Android devices.
- Restart the server with Ctrl+C then npm start from the project folder. Hard-refresh the browser to load updated JavaScript/CSS.

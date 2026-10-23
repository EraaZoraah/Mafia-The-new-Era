<!-- Current deployment note -->
**1.28.0 installation:** run `npm ci` in this folder before `npm start`. The implemented referral event is documented in [REFERRAL-BETA.md](REFERRAL-BETA.md). Optional push configuration and the original historical proposal are documented in [ART-HEISTS-AND-PUSH.md](ART-HEISTS-AND-PUSH.md). Preserve your existing data folder and server environment.

# Mafia: The New Era

For versioned GHCR images and safe Portainer re-pull updates, see [DEPLOYMENT.md](DEPLOYMENT.md) and [compose.yml](compose.yml).
The source repository stays private; public images exclude the private starter database.

Current version: **1.28.0**, build `2026-10-23-release-1.28.0`. See [OCTOBER-17-REFINEMENTS.md](OCTOBER-17-REFINEMENTS.md), [VERSIONING.md](VERSIONING.md) and [CHANGELOG.md](CHANGELOG.md).

## Current corrections — 1.19.5

Dedicated profile editing, sortable lists, current banners, restored casino controls and a 10,000-ticket lottery limit. See [CURRENT-RELEASE-1.19.5.md](CURRENT-RELEASE-1.19.5.md).

Dashboard welcome copy overlays its artwork with a readable fade. Beta referral signup cash is $25,000,000 and the qualified referrer reward is $50,000,000; five/ten membership milestones are unchanged.

Seven banner cars join the private collection catalog. Fifty panoramic page scenes, clearer membership diamonds and the revised Owner portrait are included. See [CURRENT-RELEASE-1.19.5.md](CURRENT-RELEASE-1.19.5.md).

The reference sidebar has Overview, Your world and Extras & staff sections, page search, seven expandable categories and a mobile drawer. EN/NL navigation paths are shared with Luca.

The sidebar uses compact accordion groups for family, logistics, finances and social/help pages. Opening a group closes the previous group. Receiving respect updates standing without a popup.

Staff maintenance tools are documented privately in [CURRENT-RELEASE-1.19.0.md](CURRENT-RELEASE-1.19.0.md).

Sunday Funday uses dedicated popup artwork from the calendar response, with a standard notice-image fallback if artwork fails to load.

Login and registration use dedicated full-page artwork, a gradient fade and a dark bordered form with high-contrast labels and input focus. Both pages keep one non-repeating background.

The opening page now uses a single non-repeating background with a gradient fade for readable text. Login and registration artwork are unchanged.

Personal business and employee cash accrues for at most 24 active earning hours in a collection cycle. Browsing, signing in and server restarts cannot extend a full cycle. Prison/coma pause the clock. Full collection starts a new cycle. Existing saved income remains intact; wallet limits never discard it. Family treasury earnings are separate.

English is default; Dutch is available above Log out. French/German/Spanish are Coming soon. Luca reads the updated rules/catalogs and account state in English and Dutch. Ranks, player-authored content, dollars and numeric punctuation remain unchanged.

Patch changelogs 1.18.1 through 1.18.6 are included in the in-game news page without new-feature announcements. Device push remains explicitly paused (`PUSH_ENABLED` defaults off), even if VAPID keys exist. See [FUTURE-WORK.md](FUTURE-WORK.md); activate only after a later user request and real-device tests.

Current menu, costs, limits and game rules supersede the historical release sections below. The source catalogs are authoritative.

## Previous release — 16 October 2026

Build: `2026-10-16-midnight-circuit-1`. Adds Midnight Circuit solo/multiplayer races, saved animated stages, driver ranks, a workshop, weekly trophies and a new trophy-gallery banner. See [MIDNIGHT-CIRCUIT.md](MIDNIGHT-CIRCUIT.md). Also includes the complete runtime and game artwork, art/antiques trading, collector cars, stolen-car condition and auctions, autonomous players and the English/Dutch interface. See [ART-COLLECTORS-AND-DUTCH.md](ART-COLLECTORS-AND-DUTCH.md).

Run `npm start` from this directory with Node.js 24 (22.13+ supported). Run `npm test` for the isolated test suite. Run `npm ci` first; the locked dependency list includes `web-push` (device delivery is currently paused). On first launch, an optional `starter-data/mafia.sqlite` is copied to `data/mafia.sqlite` if present; otherwise a fresh world is created. The locally prepared private starter snapshot contains the Owner, Admin and bot accounts with saved progress and password hashes, but no active login sessions. Code-only update archives intentionally omit that snapshot. Existing server databases are never overwritten. Live databases, backups and environment secrets remain excluded. Keep this repository private: the starter database contains private account data. Existing accounts can log in using their existing passwords; for a new independent world, omit `starter-data/` and follow the Owner setup instructions below.

When updating a server, back up and preserve its `data/` directory and environment configuration, replace all code and `public/` assets, restart Node, and verify `/api/health` reports the current build. Historical release sections follow.

## Historical release — autonomous players and Luca

Historical build: `2026-10-16-bot-autonomy-1`. See [BOT-AUTONOMY-AND-LUCA.md](BOT-AUTONOMY-AND-LUCA.md) for the expanded bot command coverage, live assistant advice, tests and restart instructions. Release sections below are historical.

## Visual review — 15 October 2026

Historical build: `2026-10-15-visual-review-1`. See [VISUAL-REVIEW.md](VISUAL-REVIEW.md) for the complete artwork/icon audit, targeted replacements, Luca maintenance details and the logout layout. Earlier build references below are historical.

## Interface & city freight — 15 October 2026

Historical build: `2026-10-15-city-freight-1`. See [INTERFACE-AND-FREIGHT.md](INTERFACE-AND-FREIGHT.md) for live market advice, hourly city markets, cargo routes, profile editing and visual improvements. The five remaining interface/guide items are addressed. The earlier economy simulation remains the latest simulation; existing balance was not retuned.

## Empire refresh — 15 October 2026

Previous build: `2026-10-15-empire-refresh-1`. Read [EMPIRE-REFRESH.md](EMPIRE-REFRESH.md) for migration and gameplay changes, and [EMPIRE-SIMULATION-180-DAYS.md](EMPIRE-SIMULATION-180-DAYS.md) for the latest measured results. Earlier release summaries and economy figures below are historical.

## Previous release — bots and skins

Historical build: `2026-10-14-bots-and-skins-1`. See [BOTS-AND-SKINS.md](BOTS-AND-SKINS.md) for this release and [SIMULATION-180-DAYS.md](SIMULATION-180-DAYS.md) for measured balance findings. See [CREW-AND-GUIDE.md](CREW-AND-GUIDE.md) for the latest features, rules and deployment, and [VISUAL-AUDIT.md](VISUAL-AUDIT.md) for image replacements. This includes the progression update below plus funded bounties, configurable liquidation and backfire ammunition, incoming-operation statistics, 30-day Supporter / Grand Supporter products and consensual marriages with a 10% gameplay bonus. See [PLAYER-SYSTEMS-UPDATE.md](PLAYER-SYSTEMS-UPDATE.md) for values, rules and deployment instructions. Checkout remains disabled. The automated suite covers gameplay, authentication and the new expansion; desktop and mobile browser checks use disposable test data.

Replace all runtime JavaScript and the whole `public/` folder when deploying, preserve your live `data/` and environment, restart Node, and verify `/api/health` shows this build. This update has not been deployed remotely.

## Progression update — 12 October 2026

Build `2026-10-12-progression-presence-2` supersedes the older balance values below. See `ECONOMY-PROGRESSION-REPORT.md` and `art/economy-v2-60d.json` for measured results and assumptions. Five fresh-account tests at two active hours/day saved $1.20–1.46 billion after costs by day 60 and reached Godfather on days 82–84. A separate funded career cadence test reached The Connect around day 90 with four runs per career/day. These are separate playstyles, not simultaneous guaranteed outcomes.

Family creation is $1 million; bullets are $50. New normal/career XP curves and 500–2,000 one-time achievement XP rewards are active. Existing cash and XP remain; ranks are recalculated against the new thresholds. Anonymous liquidation attempts and arrest reports add $500,000. New release quotes scale with the victim's rank and remaining time; current saved stays retain their quote. Own-family robbery, kidnapping and liquidation are blocked.

The Owner population overview has clickable total/online lists, liquid world money, player XP, account dates and measured active days/hours. Profiles show online/last seen, creation date and recorded playtime. Online dots appear beside linked chat names. Historical playtime is not reconstructed. Tracking starts with this update.

Validated with 154 passing tests, desktop/mobile profile checks, Owner filters and a one-time achievement claim in a disposable browser test copy. To run: `npm start` in this directory. To test: `npm test`. Stop the existing process before restarting; preserve the server's `data/` and environment configuration when updating. This local update has not been deployed to a remote server.

An English-language premium mafia browser game with SQLite accounts, 20 criminal activities, player operations, automatic recovery, 25 ranks and legacy distinctions, banking, cash/energy transfers, messages, families, leaderboards, 63 repeatable asset designs with passive income and photorealistic artwork, a personal portfolio, and an Owner player editor.

See [GAMEPLAY.md](GAMEPLAY.md) for rules, the new Owner controls, and upgrade instructions. Restart the server and refresh your browser after updating; existing databases are upgraded automatically without resetting players.

## Getting started

Requires **Node.js 22.13+** (preferably Node.js 24 LTS). No external npm packages required.

```bash
npm start
```

Open `http://localhost:3000` and register. The database is automatically created in `data/mafia.sqlite`.

## Set up the Owner account

Register your account first, then run this in a terminal:

```bash
node owner-setup.js YOUR_USERNAME "A_NEW_STRONG_PASSWORD_AT_LEAST_15_CHARACTERS"
```

Sign in again to access **Owner Panel**. The first Owner is provisioned through the server terminal. Existing Owners can grant Owner access in the protected Owner Panel; normal registration never grants staff privileges.

## Before public launch

This is a **development build**, not a production-hardened public service. Authentication now has persistent login/registration throttling, stronger password hashing, session rotation, same-origin POST checks and security logs. Before launch, configure HTTPS and PUBLIC_ORIGIN, add email verification, password recovery, staff MFA, operational abuse controls, backups and monitoring, and arrange an independent security review. Set `NODE_ENV=production` to enable Secure cookies (HTTPS required). SQLite is intended for a single server instance.

The economy is fictional; no real-money gambling or payments.

## Audit and tests

See [AUDIT.md](AUDIT.md) for the verified feature inventory, security findings, test results, and prioritized development roadmap from 9 October 2026.

```bash
npm test
```

Tests launch a disposable copy of the server with a temporary SQLite database; they do not change existing player data. They require permission to connect to a local HTTP server. The suite verifies malformed-request survival, automatic recovery, concurrent purchases, quantity limits, passive income, rank progression, migration preservation, local images, PvP and Owner editing. Tests now assert login throttling as well. A passing suite is not a security sign-off.

See [EMPIRE.md](EMPIRE.md) for family careers, protection, yachts, investments and the expanded two-section Owner Panel.

See [JUSTICE.md](JUSTICE.md) for hospital/coma, prison, bail, breakouts, player respect, compound upgrades, illustrated notifications and the economy overview.


See [PROFILES.md](PROFILES.md) for customizable public player profiles, direct transfers/respect and the extra test population.

## Community update — 10 October 2026

- Messages now have an inbox, conversation history, unread counts, direct replies and clickable profiles. Username inputs offer prefix matching.
- Owner/Admin badges and a protected Admin Panel replace the former Moderator role. Admins cannot promote themselves to Owner, edit their own role, or modify Owner accounts or families containing an Owner.
- Robbery transfers up to 10% of target cash without a fixed dollar cap. Hostage difficulty and ransom scale with normal target rank, reaching $10 million for a perfect top-rank operation before protection and cash limits.
- Failed NPC crimes apply a bounded cash fine or a 5–60 minute arrest. Dashboard statistics track attempts, successes, arrests and comas; attempt history starts with this update.
- Families can choose a theme, motto and one of five crests, invite players, approve applications or accept open recruitment. The dashboard includes an organizational family tree, holdings, wealth and raid statistics.
- Family member capacity increases from 15 to 30 with the average of the two career ranks. Compound bonuses add 2 / 7 / 20 places, with a maximum of 50. Joining is checked atomically against available places.
- My Family is directly below My Profile. Crimes, shipments, personal assets and family assets share the same responsive photo-tile layout.

Run `npm test` for 70 isolated checks. Tests use temporary databases and do not reset the game world. Run `npm start` from this folder, then open http://localhost:3000. After an update, restart the server and use Ctrl+F5. Existing players, assets and families migrate in place; take a SQLite backup before upgrading.

## Current implementation status and logistics expansion

See [PROJECT-STATUS.md](PROJECT-STATUS.md) for the verified conversation-wide inventory, explicitly missing features, and next priorities. A passing test suite does not mean the entire original vision is complete.

Weapons & ammunition are available under Personal assets and Family assets. Drug production and Airport are under Crimes & missions. Every player receives one sidearm and 100 rounds once; larger operations require higher weapon tiers and more rounds. Family supplies are bought by Don/Capo. Power is calculated from equipment/protection and shown alongside rank.

Drug production supports five products, 6/12/24-hour terms, personal and shared family ownership, and hourly 90–110% prices. Flights require a jet, cost cash and maintain independent city heat rather than clearing it globally. See the in-game rules and FAQ for exact limits.

## Daily objectives and city announcements
Daily objectives live on their own page under Crimes & missions. Six objectives cover five crime attempts, one shipment attempt, three different respect gifts, three successful crimes, three shipment attempts and one contact mission. Total potential rewards: $1,325,000 and 390 XP per UTC day; contact missions require a random invitation. Claim before 00:00 UTC; rewards do not carry over. Claims are atomic and persistent, and blocked while detained.
Owner and Admin can manage Announcements & events in their staff panel: drafts, scheduled start/end, archival, revision conflict protection and optional one-time pop-ups. Events are informational and do not automatically modify game payouts. Public messages have a dedicated Announcements & events page above Dashboard, with separate framed sections for announcements and events. All text is rendered as plain text.
Run `npm test` for the regression suite (102 checks). Restart with `npm start` to apply the additive SQLite migration, then refresh the browser.

## Casino
Casino has its own menu entry below Midnight Circuit. It offers Higher or Lower, Blackjack, roulette, safe cracking, video poker, slots and the daily lottery. Higher or Lower and Blackjack Both use fictional personal cash, $1,000–$1,000,000 stakes, saved rounds and server-only random cards. Blackjack supports hit/stand, natural 3:2, dealer stands on all 17s. Higher or Lower shows probability-based returns with a 4% house edge; ties lose. Total return includes the stake. No XP, energy/ammunition cost or rank multiplier. Open stakes and unpaid winnings count in world net worth. Returns that do not fit in cash stay claimable. Tests cover retries, hidden cards, natural payouts, aces, busts, pushes, cooldowns, detention, cross-account access and wallet caps.

## Rankings and staff identity
Underworld rankings combines the old leaderboard and wealth page: top ten players by XP, top ten players by Power and top ten families by Power (net worth breaks family ties). All three tables have dedicated Power and net-worth columns. Owner crown and Admin shield badges appear after names. Only useful contextual player fields remain; the profile lookup on rankings sits below the image and title. The Admin menu is visible to accounts with role `admin` after refresh; Owner-only restrictions remain enforced on the server.

## Historical family and purchasing update (11 October 2026)

The figures below describe that old release, not current prices or limits; consult the live catalog and current Game rules.
Refreshes preserve page scroll and expanded sections, including Blackjack actions and result pop-ups. Menu order starts My profile → Personal assets → My family → Family assets. Family members have a Power table with role promotion and kick controls. Additional roles: Soldier, Enforcer, Consigliere and Underboss. Only Don/Capo purchase family assets or access the tiled Family possessions inventory. Profile pages expose direct PvP actions.
Family creation is $25 million; Imperium compound is $5 billion. Bulk asset/weapon/protection purchases support explicit quantities and Buy MAX, checked atomically against server balances and limits. Bullets cost $1,000 each, with a synchronized slider/number input; storage remains 100,000 rounds. Weapon cap is 10,000 per design, with each later unit adding 25% of its base price. Ordinary possessions retain their existing four-copy or catalog limits; temporary services retain one active package.
Admins can edit shared family data and other members even when the Owner belongs to the family. Owner personal accounts and membership remain protected; Admins cannot change their own staff role or grant Owner. Role and weapon-cap migrations preserve existing records on restart. Backup before migration: `backups/pre-family-bulk-20261011.sqlite`. Restart the existing terminal server with Ctrl+C then npm start; no second server is needed.

### Rival families and wars

Open The underworld → Rival families (also linked from My family). Raids now use relative family Power, target defense and a 1–95% chance range. Each successful raid transfers a random 50–100% of the protected maximum, at most 10% of the target treasury; there is no fixed dollar cap. Requirements: 500 player XP, 35 energy, tier 1 family weapon and 50 family rounds. Existing 30-minute family cooldown, 20-minute recovery shield and one-hour new-family protection remain.

Don/Capo can declare one 24-hour war at a time or surrender it. Successful raids score for the attacker; failures score for the defender. Highest score wins, equal scores draw. Persisted battle reports include Power, odds and loot. The pair gets a 24-hour ceasefire following completion or surrender. No extra victory money is minted. Existing families and holdings are preserved. The current suite passes 107 checks.

### Territory and war operations

Family assets → Territory now supports 25 holdings of each of three types (75 total), 1/4/12 city blocks each, priced from $25m/$150m/$1b. Further copies cost 10% more. Territorial bonuses and value use existing Power/defense/shipment calculations. Wartime capture transfers one holding atomically. My family has a prominent Rival families / war room button and territory summary.

During active wars, Don/Capo can sabotage defenses (2 points), capture territory (3 points), or assemble a consenting 2–5-member assault (2 points). All attacks share raid cooldowns and defender shields. The in-game rules show every cost and requirement. Team membership, custody, supplies and energy are revalidated at launch; failed/replayed requests do not partially spend resources. Families display war wins, successful raids and success percentage. A win after at least one battle grants +10% family-share shipment income for 24 hours, non-stacking. A new win renews the bonus. No-battle surrender grants no bonus.

## City atlas and legacy update (11 October 2026)

- Family assets → Territory uses the **same 15 destinations as Airport**. Each fictional strategic city map has 90 individually owned plots: 45 blocks, 30 commercial districts and 15 harbors. Buy up to **20 owned plots per family per city**, capture to **30**; the existing worldwide 25-per-type cap remains. Capture requires an active war and applies Power, terrain, adjacency, defense, cooldowns and one-hour new-territory protection. Existing territory is placed automatically without losing holdings. Don/Capo acquisitions update the map and existing economic holdings atomically.
- Family chat and Attack planning are available in the menu and from My family. Chat is restricted to current members. Commanders schedule up to ten open plans within seven days; members volunteer. Planning does not launch an attack or reserve resources. Editing clears volunteers, and live team membership must be confirmed separately in the war room.
- Introduction & achievements under Crimes & missions provides four onboarding milestones and thirty total achievements. Earned titles, profile medals and ten earned color themes persist. They are cosmetic. An unfinished introduction is linked on Dashboard.
- The underworld → Family seasons provides 28-day seasons, an independent battle-based ranking, permanent top-three trophies and archived winners. Battle points match the war score, plus 25 for a war victory with battles. Equal points share placement; zero points do not earn trophies. Seasons begin at UTC midnight on first installation. They settle at startup, every minute while the server runs, and on season reads. Each season automatically publishes an event recapping the previous results. Assets, balances, XP and territory never reset. The latest 24 archived seasons are displayed; all stored results are retained.
- The underworld → All players lists every non-banned player, with search, pagination, rank, Power, cash, family and profile links.
- World chat opens from a floating button at the lower left. It displays the latest 100 messages, refreshes while open, supports profile links, and allows staff to hide messages. Limits: 1,000 characters and one send per five seconds; family chat allows one send per three seconds. Message retries cannot duplicate a successful send.
- Members may give their own family one respect per UTC day. The daily limit follows the user across membership changes. Ten family reputation tiers are cosmetic and separate from donation perks and player respect.
- Every valid crime attempt has an independent 5% **Big Score** roll: guaranteed success, triple rolled payout and crime XP, still bounded by balances/XP ceilings. All eligibility, ammo, energy and cooldown requirements apply before the roll. PvP, shipments and casino games are excluded. Feedback titles use BIG SCORE!, Succes!, Failed!, and Congratulations for purchases.

Restart the existing server (Ctrl+C, then `npm start` **inside the mafia-the-new-era folder**) and hard-refresh the browser with Ctrl+F5. For version 1.17.0, run `npm ci` before starting: Web Push adds the locked `web-push` dependency. Run `npm test` in that same folder. Backup: `backups/pre-city-legacy-20261011.sqlite`. The migration was run twice on an isolated copy and preserved all existing player balances/XP and family balances/assets; SQLite integrity and foreign-key checks passed. Browser tests use a separate disposable database on port 3101, never the live game.


## 11 October update: identity, season rewards, shop and account security

- Maps print owner names in every plot: own family green, rivals red, unclaimed gray. Small screens can scroll the map sideways.
- My profile offers 12 curated SVG avatars (no custom uploads), 30 achievements, earned permanent medals/titles/colors and Account security controls.
- Seasonal treasury prizes are $100m / $50m / $25m and 100 / 60 / 30 family respect. Medals beside family names and honorary titles last through the following season. Trophies and respect persist. Equal scores share the pool of occupied places; positive points are required. Treasury overflow stays pending until room becomes available. Prizes are transactionally recorded once per season/family. Old seasons completed before this update are not retroactively paid.
- Owner/Admin Panel → Shop gifts & grant log grants catalog products to any player, including the granting staff account. Authorization follows the Owner/Admin roles, as requested; any future Admin has this authority too. Gifts are audited and idempotent.
- Premium shop: colors €2.99, frames €3.99, three titles €4.99, themed packs €7.99 and the complete collection €19.99. Permanent cosmetics only, no pass or gameplay advantage. See SHOP-AND-SECURITY.md for the complete catalog and PayPal status.
- New/reset passwords require 15–128 characters. Existing passwords still work and their hashes upgrade on successful login. Account security lets players change a password or sign out all devices. Staff can inspect the latest 100 authentication events.

Windows: stop the existing game terminal with Ctrl+C before restarting. Run from the folder containing package.json:

```bat
cd /d "C:\Users\Jeffrey Berwald\Downloads\mafia-the-new-era-english\mafia-the-new-era"
npm start
```

Then refresh the browser with Ctrl+F5. Do not launch a second instance against the same live database. Database migrations preserve existing accounts and possessions; keep backups before updates.
## Beta update — 12 October 2026

Build: `2026-10-12-economy-care-1`. The `/api/health` response now includes this build identifier so the running server version can be checked independently of browser caches.

- Economy: ammunition $50/round, reduced daily/respect/contact rewards, slower passive rank scaling and balanced shipment costs. Family shipments share both stakes and rewards 40% personal / 60% treasury. Normal-rank shipment scaling uses a square root; independent career multipliers remain. Read ECONOMY-PLAYTEST.md for five fresh-account simulations and 5,400 controlled shipment attempts, with net earnings after costs.
- Dashboard → Support & reports: private categorized tickets to Owner/Admin, replies and statuses. Staff see a red glowing Support tickets button directly below their panel in the menu, with the shared inbox unread count; it refreshes every 15 seconds. Reading clears the shared unread flag. Player replies flag the ticket again and notify staff. Ten new tickets/day; existing threads remain available.
- Block private messages in both directions and mute another player's world/family chat from Support & reports. These controls do not stop gameplay attacks. Staff can mute all three chat channels for up to 720 hours; support remains available. Community & privacy and Game rules describe conduct and current data handling.
- My family: mutual Don-approved alliances and partner count/names. Accepted allies cannot raid, capture territory, sabotage, launch assaults or declare war against one another. End active wars before accepting an alliance. Either Don can end an alliance, immediately removing protection.
- Departing Don: highest-role active member succeeds, then received respect, lifetime donations, XP and lowest ID. A lone active Don must recruit a successor first. A Don can also transfer leadership to an active Capo and becomes Capo.
- Owner Panel → Economy activity: 1/7/28-day wallet flows by activity and account type, attempts/success, and XP growth. Recording starts with this update. Transfers/investment returns are not all freshly generated money; inspect both sides. Existing World economy still shows outstanding money and holdings.
- Owner/Admin player editor: Reset player and Delete player, with a named confirmation dialog, green Yes and red No. Reset returns personal gameplay to starter state and removes family membership. Login, role, ban state, shop cosmetics and anti-abuse/audit history remain. Delete additionally revokes access and replaces current username/email/password. It is logical account removal, not erasure of historical messages, transactions, reports or backups. Admin cannot modify Owner or delete their own staff account; the last active Owner cannot be deleted. Don succession occurs atomically; failed requests roll back.
- A one-time welcome-to-beta announcement is published after an active Owner exists. Existing progress is not reset by installing this update.

Update a server safely: stop its Node process, back up its existing `data/` directory while stopped, overwrite the runtime files and the **entire public/** folder in the actual process working directory, retain server data/configuration, and restart the same process. Do not copy the development database over the server database. A reverse proxy serving static files directly must point at the same updated public folder. Clear any proxy/CDN static cache and use Ctrl+F5. Verify `/api/health` returns the build above and `/care-ui.js` is available. Merely uploading server files does not replace code already loaded in the running Node process.

Local run: open a terminal in the folder containing package.json and server.js, then `npm start`. Stop the earlier instance first if port 3000 is occupied. Tests: `npm test`. Reproduce economy measurements with `node scripts/economy-playtest.js` and `node scripts/economy-shipments.js`; these use memory databases only.

Before a public launch, complete operator/hosting contact and retention details in the beta privacy notice. Internal support currently requires sign-in; a separate recovery route for locked-out players remains an operational launch task. PayPal checkout remains disabled.

City expansion: see [CITY-EXPANSION.md](CITY-EXPANSION.md) for membership bonuses, bank trading, employees, breakout ranks, gifts, news and casino rules. New release notes publish automatically from release-notes.js.

## Casino review — 15 October 2026
See CASINO-REVIEW.md for the completed casino checks and the EN/NL language-menu preparation. Dutch is not yet selectable. Historical build: `2026-10-15-casino-review-1`.

## Dutch localization — stage 1
Historical build: `2026-10-16-dutch-foundation-1`. See DUTCH-LOCALIZATION.md. The language selector is above Log out. Dutch resources and initial integrations are in progress; EN remains the only active player language.

## City control & vehicle collections — 16 October 2026
Historical build: `2026-10-16-territory-vehicles-1`. See TERRITORY-AND-VEHICLES.md for migration, storage/capture rules, verification, geographic licensing and the additive fifty-bot script for separate hosts. Deploy the full build and restart Node; preserve data and environment files.

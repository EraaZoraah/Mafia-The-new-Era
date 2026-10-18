# Mafia: The New Era — current gameplay

Updated 10 October 2026. All player-facing text is English.

## Local play and upgrades

Run `npm start` with Node.js 22.13+ (Node.js 24 recommended), then open http://localhost:3000. No package installation is needed. Run `npm test` for the isolated automated suite. Stop and restart the existing server after updating, then hard-refresh the browser (Ctrl+F5).

Before upgrading a live installation, stop the server and back up its `data` directory. Startup migrations retain wallets, XP, existing possessions and accrual timestamps, add quantities (existing assets start at one), and support helicopters, jets and garages. Never replace your database with a test fixture.

## Progression and rank income

There are 25 ranks, from Outsider to The Godfather at 1,350,000 XP. Success chance rises by 1.6667 percentage points per promotion, reaching +40 points at The Godfather, capped at 100% per crime. Riskier contracts retain a failure chance.

Income compounds relative to the previous rank. The 24 promotion bonuses are:

10%, 12%, 13%, 15%, 17%, 19%, 20%, 22%, 24%, 26%, 27%, 29%, 31%, 33%, 34%, 36%, 38%, 40%, 41%, 43%, 45%, 47%, 48%, 50%.

The Godfather earns approximately 488.89 times starting income from the same activities and holdings. Every additional 250,000 XP grants a legacy distinction, displayed as stars and a count, and another multiplicative 15% income boost. The first distinction gives 562.23× and the second 646.56×. XP continues accumulating; the distinction interval is the final normal promotion gap.

**Ranks & rewards** shows all XP thresholds, promotion bonuses, total income factors, success bonuses and operations available during each tier. Every normal rank promotion adds up to 10 maximum energy (1,000 total cap) and fully refills the new reserve after the action cost. Rank energy starts at 100 and reaches 340 at The Godfather, before home bonuses. Each legacy distinction also adds up to 10 capacity within the same cap and refills energy. Normal rank increases do not increase XP rewards. The growing XP gaps preserve a long progression path even as money becomes easier to earn.

At extreme Owner-assigned XP, income multipliers stop at 1,000,000×; each cash/bank balance is capped at $1 trillion. These limits are displayed in the rank guide. Distinctions continue after the income limit.

## Crimes and the economy

20 NPC operations include shop robbery, mugging, smuggling, VIP protection, hostage and liquidation contracts, a casino vault heist, and six ownership-gated operations. Separate PvP attack, robbery, liquidation and hostage actions use player protections and hospital/release timers.

Prices, business baseline income and NPC reward baselines are ten times the earlier prototype. Existing wallets are not multiplied. Successful NPC jobs roll a main reward between 100% and 140% of the baseline plus independently randomized extra loot of 5–25%. Failed jobs still pay the extra loot. Rank income, collection income and the Owner crime multiplier are applied server-side. Displayed ranges already include these bonuses. PvP loot is a transfer from the target's existing wallet, not multiplied money creation.

This is a deliberately steep rank economy, as requested. Expanding acquisition prices, cooldown/energy limits and higher XP thresholds constrain growth. Long-term multiplayer balance still needs playtesting; automated tests verify arithmetic and rules, not player behavior or inflation.

## The collection

63 purchasable designs: 11 businesses, 24 cars, 12 residences, five helicopters, five jets, five yachts and a private collector garage. Every design has its own locally served photorealistic illustration.

Every asset can be purchased repeatedly, up to 4 copies per design. The next copy costs `base price × 1.25 ^ copies already owned`, rounded up and capped at $1 trillion. The server computes prices and makes payment plus ownership changes in one database transaction. Submitting a forged price or quantity cannot alter the purchase.

Every copy earns hourly passive income:

- Businesses: their catalog operating income.
- Cars: base purchase price / 1,000, rounded down, from rentals.
- Residences: base price / 1,500, rounded down, from rentals.
- Helicopters and garages: base price / 600, rounded down, from charter/storage operations.
- Jets: base price / 900, rounded down, from charter operations.
- Yachts: base price / 1,000, rounded down, from charter operations.

Multiply these rates by quantity and rank income. Accrual occurs in complete minutes, with fractional currency retained using integer arithmetic. Up to 24 offline hours are credited when the server processes a player request. Newly purchased copies do not earn for earlier time.

Additional utility:

- Cars and jets increase crime income and unlock getaway/overseas work.
- Homes above the first three budget designs increase energy capacity and recovery speed. Premium cars also grant graduated capacity bonuses. All homes unlock estate summits.
- Helicopters shorten crime cooldowns and unlock skyline extraction.
- Garages shorten crime cooldowns and unlock the getaway operation even without a car.
- Businesses unlock syndicate deals.
- Each design unlocks a selectable signature title shown beside the rank and on leaderboards.

Stacking limits: the combined base reserve, premium cars, homes, ranks and legacy distinctions is capped at 1,000 energy. Other limits: one energy per five seconds, one health per ten seconds, 60% cooldown reduction and +200% collection crime income. Once an active perk is capped, additional copies still earn income. Titles and operation unlocks are shared per design/category rather than duplicated per copy.

**My possessions** displays every owned design, quantity, total current hourly income, per-copy benefits and the next-copy purchase price. Dashboard income includes the entire portfolio. The Owner player editor supports quantities from zero (remove) through four, including the Owner's own possessions. All administrative edits are logged; normal registration cannot create an Owner.

## Presentation and artwork

A public welcome page introduces the city and invites players to build the largest family. The responsive interface uses charcoal, warm gold, cinematic imagery and serif headings. Local assets comprise 63 personal purchase illustrations, 13 family purchase illustrations, 19 crime illustrations, ten section images and one hero: 109 selected images (including three justice scenes). An unused helicopter outtake is retained alongside its corrected version.

Artwork was generated using the built-in image tool and saved into `public/images`; the game does not request remote image services. Vehicle images are artistic interpretations, not verified product photographs. Aircraft names and prices are fictional. Prompts and provenance are in `art/image-prompts.json`, `art/image-sources.json` and `art/latest-assets.json`.

## Validation and remaining launch work

The suite covers authentication/authorization, banking conservation, cooldowns, regeneration, purchases, quantities, concurrency, passive accrual and remainders, rank boundaries, distinctions, title/operation gates, PvP, Owner editing, database migrations and local JPEG delivery. Test servers use disposable databases.

See AUDIT.md for the historical audit and prioritized roadmap. Before public hosting, prioritize authentication throttling, password reset/email verification, operational backups, HTTPS and deployment monitoring. Family wars, daily events and playable casino mechanics remain separate roadmap work; a purchasable casino business does not imply a gambling subsystem exists.

## Rank-up notifications

Promotions show an English modal with the new rank or distinction, the combined bonuses if multiple ranks are crossed, additional capacity, energy restoration, income increase, success-chance increase and newly reached crime XP requirements. Operations still requiring an unowned asset are labeled accordingly. The server saves the notification until the player acknowledges it; reloading or acknowledging again cannot reapply the energy refill. Existing players receive the capacity appropriate to their XP on upgrade, without retroactive refill notifications.

Owner XP increases also create promotion notifications. An explicit energy value entered by the Owner takes precedence over the automatic refill and is identified as an override in the notification. Other promotions refill automatically.

See [EMPIRE.md](EMPIRE.md) for family careers, protection, yachts, investments and the expanded two-section Owner Panel.

## Transfers and revised balance

Use **Player transfers** to send cash or donate existing energy to another active player. There is no fee. Transfers are atomic, recorded for both players and retry-safe. The full amount must fit the recipient’s wallet or current energy capacity; donations never increase capacity.

Crimes are ordered from Discreet courier to Casino vault heist with strictly increasing reward ranges, non-increasing base success chances, and increasing or equal energy/cooldown costs. The UI shows difficulty and the actual rank-adjusted success percentage.

Every asset design is limited to four active copies (families retain lower category-specific limits where applicable). Legacy surplus copies are archived on migration, not silently deleted or refunded; they earn no income or bonuses. The first ten cars and first three homes provide no energy capacity. Premium car bonuses rise from +5 to +50 per copy; homes rise from +5 for a townhouse to +150 for Elysium. The server enforces 1,000 total energy across purchases, promotions, donations and Owner edits.

## Justice and player respect

See [JUSTICE.md](JUSTICE.md) for the current hospital, coma, prison, release, respect, family compound and income-pause rules. The in-game Game rules and FAQ pages are the consolidated player reference.


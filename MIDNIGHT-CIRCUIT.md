# Midnight Circuit — 16 October 2026

Midnight Circuit is a separate driving career under City → Midnight Circuit. The specialist workshop was added in version 1.27.0.

## Specialist workshop — 1.27.0

- Precision suspension, Powertrain calibration and Endurance engineering each add 1.5 points to their own performance statistic per level. Reliability also reduces mistake risk by 0.3 percentage points per level, keeping the existing 1% minimum risk.
- Street allows three levels per module and six total specialist levels; GT four and eight; Exotic five and ten. The shared budget prevents maximizing all three modules. Existing balanced tuning remains available separately and is preserved on migration.
- Each new specialist level costs `class fee × 12 × new level²`. Current cost, level and class budget are displayed before purchase. A state revision and exact cost are validated atomically before charging. Stale or repeated purchase quotes cannot charge another upgrade.
- Both balanced and specialist tuning are included in the effective rating used for multiplayer matching. Class never changes. Route weights, driver rank, condition, wear and strategy still influence the server result.
- Installed tuning is saved in each entry snapshot. A pending race locks its car against repairs and upgrades; historical replays retain their original stages. No change to ownership, collection stars, resale basis or crime-income bonuses.
- Highly worn cars can be repaired; the race eligibility restriction no longer incorrectly blocks repair itself. Preparation choices survive workshop purchases within the page.
- Bots can buy modules through the same validated workshop. Luca receives a current affordable specialist quote from the authoritative board, excluding unavailable cars and custody. All three module descriptions and the full rulebook are localized in NL/ES/FR/DE.

## Playing

- Use a purchased car assigned to a private garage, or a locally stored stolen car that is not listed at auction. Cars in transit or awaiting a theft decision are unavailable. Stolen-car stars persist; four stars are Perfect and five Pristine.
- Each of the 15 existing travel cities has the three illustrated route types: Old Quarter Circuit (handling), Skyline Sprint (acceleration) and Harbor Escape (reliability). Each city has separate lobbies and weekly rankings.
- Model-derived Street/GT/Exotic classes and ratings are independent of market value. Multiplayer requires the same city and class, within 80 rating points. Prices never enter the performance calculation.
- Choose Clean, Balanced or Aggressive strategy, Street grip / Speed tires / Endurance setup and an optional mechanic. Aggression may improve pace but adds mistake/arrest risk. Condition, mechanical wear, tuning and driver rank affect the server's projection.
- Each entry uses 8 energy and starts a shared ten-minute cooldown. Class entry fees are $2,500 / $10,000 / $25,000. The optional mechanic costs 20% of the class entry fee. Exact costs are checked before charging.
- Solo trials pay at most five rewarded entries per UTC day: a win returns 140% of entry, otherwise 30%. Later solo practice has zero entry and reward, but retains energy, risk and optional mechanic cost. No supporter/marriage/global income multiplier creates extra money from a multiplayer pot.
- Multiplayer fields have 2–4 players. Entry and mechanic costs are reserved. A full field starts automatically; at the thirty-minute deadline at least two players race, otherwise fees are refunded. If a participant becomes unavailable (including custody, missing car or leaving the city), the lobby is cancelled and fees refunded. Energy was spent on preparation and is not refunded.
- Winner payout is 95% of the entry pot; equal fastest times split it. The mechanic fee is a service cost, not part of the pot. Full-wallet refunds and prizes remain protected racing credits and pay automatically when room is available.
- Three stage times, mistakes and outcomes are generated once and stored transactionally. The animation is presentation only; replay/reload cannot reroll or pay twice. Pending cars cannot be sold, shipped, auctioned or exchanged.

## Progress, garage and risk

The first five scored entries per UTC day award Driver XP and weekly scores. All fifteen driver ranks retain their English names in both languages. Driver bonuses affect racing handling only, capped at +3; there is no crime-income multiplier. Earned rank titles remain selectable. Weekly city podium trophies and a champion title remain cosmetic garage/profile rewards; XP and assets survive week changes. A week starts Monday at 00:00 UTC. Rankings use a driver's best normalized result, not play volume.

Mistakes add 5 mechanical wear per stage, reduced to 2 with a mechanic. Wear is separate from collectible stars and the resale basis. At 80 wear the vehicle needs repair before entry. Repair costs class entry fee × wear / 10; tuning levels cost class entry fee × (next level) × 4, capped at two Street levels and three GT/Exotic levels. Repair and tuning use checked quotes. Neither changes the collection condition or permanent vehicle value. No race takes ownership of a car as a penalty. Stolen-car tuning/wear follows the car through an auction transfer.

Mistakes can cause 5–20 minutes of arrest based on the chosen strategy. The existing police-bribe system may offer a bribe. Existing custody restrictions and passive-income suspension remain in force. Races never bypass custody validation. Player reset/delete cancels affected pending races and protects other entrants' refunds.

## Bots, Luca and artwork

Bots can acquire eligible garage cars, race solo, create/join ordinary class-matched lobbies, repair and tune with their actual funds and energy. They have no special win or payment privileges. Luca reads shared racing rules/catalogs and account-specific server projections in English and Dutch, including resources, vehicle wear, cooldown and custody restrictions.

Five new generated images include the racing-club overview, three route illustrations and a full-cabinet trophy gallery for Introduction & achievements. The trophy image fills the banner at a 3:1 ratio, with no darkening or fading. Full prompts, built-in generation mode and saved paths are in `art/midnight-circuit-prompts.json`. Menu and podium icons use the existing gold/metal SVG style.

## Run, test and update

Run `npm start` from the directory containing package.json. Restart an existing Node process after updating; runtime modules are cached. Existing databases migrate without resetting accounts. Preserve `data/`, backups and environment configuration when applying the code-only update archive. Check `/api/health` reports `2026-10-16-midnight-circuit-1`.

Verification: 258 module/integration tests and 29 HTTP results passed. This includes 13 focused race/bot/Luca tests covering 2/3/4-player fields, idempotent requests, insufficient resources, custody/bribes, escrow/refunds, car locks, workshop caps, driver progress and weekly awards. English/Dutch language audit reports no missing controlled resources. Desktop and 390px mobile browser checks exercised the three stages, saved final result, animation configuration and trophy banner, with no horizontal overflow. Test databases and preview accounts are isolated; no production reset or remote deployment was performed.

# Economy playtest — 12 October 2026

Build: `2026-10-12-economy-care-1`. Game currency, not real-money returns.

## Changes

- Ammunition: $50 per round (formerly $1,000). The server and all packs use the same price.
- Crime baselines remain at 10% of the former amounts. Rank XP, energy and purchase prices are unchanged in this update.
- Passive base income remains reduced to 10%; the combined rank/respect factor now uses its square root. Active crimes retain the full rank factor.
- Daily cash rewards total at most $132,500/day; giving respect pays $1,000 each, at most five different players/day.
- Shipment stakes and base rewards were reduced to 10%. Normal rank now uses its square-root factor, while career progression remains 15% per career rank.
- Family shipments split both stake and reward 40% personal / 60% treasury; family rounds remain a family cost. Failed runs still consume both stake shares. Insufficient funds roll back the entire attempt.
- Escorts cost $5,000 / $25,000 / $100,000. New mysterious offers start at $12,000–$20,000 times rank; existing offers are preserved.

## New-account progression

Five deterministic fresh accounts; 14 simulated days; two active hours/day, minute-by-minute actions; real handlers, seeded randomness, standard starter kit, daily crime rewards; no staff grants, donations, gifts, casino or PvP. Purchases: first coffeeshop and tier-2 weapon when affordable. In-game wait time is advanced, not real elapsed time.

All accounts start with $5,000, 0 XP and the standard starter sidearm/100 rounds. No balance or XP grants are used. The cash ledger is asserted exactly for every seed. Ammo expense means actual purchases; unused inventory and the free starter kit are not charged twice. Daily rewards here include only the tasks this strategy completes.

| Seed | First company, active minutes | Gross crimes | Fines | Ammo bought | Net crimes | Daily rewards | Passive | Purchases | Final cash | XP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 17 | 59 | 4,936,919 | 6,000 | 130,000 | 4,800,919 | 525,000 | 67,042 | 1,620,000 | 3,777,961 | 32,950 |
| 42 | 52 | 4,963,050 | 23,075 | 128,000 | 4,811,975 | 525,000 | 67,566 | 1,620,000 | 3,789,541 | 32,905 |
| 91 | 25 | 6,136,389 | 12,581 | 147,000 | 5,976,808 | 525,000 | 69,060 | 1,620,000 | 4,955,868 | 36,650 |
| 123 | 44 | 5,493,461 | 30,397 | 142,000 | 5,321,064 | 525,000 | 69,548 | 1,620,000 | 4,300,612 | 34,785 |
| 777 | 68 | 5,612,845 | 9,708 | 144,000 | 5,459,137 | 525,000 | 69,360 | 1,620,000 | 4,438,497 | 35,875 |

The first coffeeshop costs $120,000; the tier-2 SMG costs $1,500,000. All five accounts buy both. After 14 simulated days they remain below Racketeer (37,000 XP), far from The Godfather (1,350,000 XP). Net crime earnings are about $171,000–$214,000 per scheduled active hour averaged over this growing account, not the initial hourly rate. The cheapest home costs $400,000; a family costs $25m, a boutique hotel $30m, and the highest compound $5b. Several early upgrades are reachable while major ownership remains a longer objective.

## Shipment comparison

Controlled 300-attempt samples per scenario via real handlers. Rank and career XP held constant at scenario thresholds, stocked required weapons. Net includes all entry costs and consumed rounds at replacement price $50. No escorts, donation perks or holdings; weapon capital costs excluded. These are comparison samples, not the new-account progression playtest.

| Normal rank | Career level | Tier | Scope | Successes / 300 | Player net / attempt | Family net / attempt | Combined net / attempt |
|---|---:|---|---|---:|---:|---:|---:|
| Outsider | 1 | local | personal | 228 | 3,165 | 0 | 3,165 |
| Outsider | 1 | local | family | 228 | 1,466 | 1,698 | 3,164 |
| Outsider | 5 | regional | personal | 225 | 60,468 | 0 | 60,468 |
| Outsider | 5 | regional | family | 232 | 25,872 | 37,308 | 63,179 |
| Outsider | 10 | international | personal | 225 | 1,175,826 | 0 | 1,175,826 |
| Outsider | 10 | international | family | 243 | 514,367 | 768,551 | 1,282,919 |
| Capo | 1 | local | personal | 228 | 20,249 | 0 | 20,249 |
| Capo | 1 | local | family | 228 | 8,299 | 11,949 | 20,249 |
| Capo | 5 | regional | personal | 225 | 290,562 | 0 | 290,562 |
| Capo | 5 | regional | family | 232 | 120,489 | 179,233 | 299,722 |
| Capo | 10 | international | personal | 225 | 4,869,168 | 0 | 4,869,168 |
| Capo | 10 | international | family | 243 | 2,114,251 | 3,168,377 | 5,282,629 |
| The Godfather | 1 | local | personal | 228 | 130,906 | 0 | 130,906 |
| The Godfather | 1 | local | family | 228 | 52,562 | 78,343 | 130,905 |
| The Godfather | 5 | regional | personal | 225 | 1,771,199 | 0 | 1,771,199 |
| The Godfather | 5 | regional | family | 232 | 735,165 | 1,101,247 | 1,836,412 |
| The Godfather | 10 | international | personal | 225 | 28,903,327 | 0 | 28,903,327 |
| The Godfather | 10 | international | family | 243 | 12,508,046 | 18,759,069 | 31,267,115 |

Early local family shipments previously left the operator with negative expected cash at base rank because the operator paid the whole stake. At the mathematical 72% chance and $8,000 mean reward, the new expected net is $1,304 for the player and $1,456 for treasury after $500 ammunition. The sample differs because 228/300 attempts succeeded. The former full normal-rank factor gave about $708m combined net for the Godfather/level-10 international family scenario; the reduced stacking gives about $31.3m. This is a high-rank comparison, not new-player earning speed.

## Passive payback

| Rank held constant | First coffeeshop hourly income | Nominal payback hours |
|---|---:|---:|
| Outsider | $120 | 1000.0 |
| Capo | $457 | 262.1 |
| The Godfather | $2,653 | 45.2 |

Payback excludes detention, rank changes, respect, later-copy price escalation and the benefit of unlocked missions. A business should supplement active play. It does not instantly finance its next copy.

## Limits and ongoing measurement

Five seeded strategies are a reproducible smoke test, not a multiplayer economy forecast. They use real handlers with an advanced clock, rather than fourteen days of browser clicking. They do not model PvP transfers, extortion, casinos, alliances, an optimized full collection or lifetime legacy distinctions. Production/investment terms and seasonal prizes are unchanged. High-rank wealth still grows much faster than starter wealth; the new Owner ledger should guide further changes using actual player behavior. Existing cash and possessions are not wiped or rescaled.

The Owner economy dashboard records wallet and XP deltas from installation onward, with sources and 1/7/28-day windows. Transfers are not new money; inflows and outflows must be read together. Administrative and system adjustments are explicitly separate sources. It cannot reconstruct older activity.

Reproduce: `node scripts/economy-playtest.js` and `node scripts/economy-shipments.js`. Both use disposable in-memory databases, never data/mafia.sqlite. Detailed per-day results are in art/economy-playtest.json.

## 60-day follow-up

Same five seeds and policy, extended to 60 days. One continuous two-hour session per day; buy one coffeeshop and one tier-2 SMG, then save. No tier-3 reinvestment, family founding, shipments, PvP or gifts are performed. Reported family dates are end-of-day affordability, not actual family creation.

| Day | Cash range | XP range | Rank |
|---|---:|---:|---|
| 14 | $3,777,961–$4,955,868 | 32,905–36,650 | Trusted Soldier |
| 30 | $22,100,643–$26,226,977 | 80,740–87,490 | Captain |
| 60 | $91,389,355–$99,142,041 | 175,150–181,600 | Senior Capo |

Family creation becomes affordable on days 30–32. Owned capital is $1,620,000 in every run (coffeeshop plus SMG; free starter sidearm excluded).

The Godfather is not reached within 60 days. Holding the final seven-day XP rate constant gives an illustrative day 390–423 extrapolation (about 13–14 months). This is NOT a measured completion date or an optimized forecast: further weapons, energy capacity, rank changes and activity choices change the rate. A true endgame playtest needs a reinvestment strategy, rather than indefinitely saving with tier-2 equipment.

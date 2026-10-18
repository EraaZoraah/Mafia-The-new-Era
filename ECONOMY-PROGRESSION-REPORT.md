# Economy & progression verification — 12 October 2026

Build: 2026-10-12-progression-presence-2. This report supersedes the earlier economy-care balance report.

## Fresh-account progression

Five deterministic seeds (17, 42, 91, 123, 777), real game handlers and in-memory disposable databases. Each player starts with $5,000, zero XP and the standard starter kit. Two continuous active hours per day, one-minute decision steps, then 22 hours offline. The strategy selects the highest expected cash-per-energy eligible crime, buys a coffeeshop and tier-2 weapon, replaces ammunition, claims completed crime dailies and available achievement XP. No PvP losses, gifts, staff grants, casino, investments, large property portfolio or career runs. This is a saving strategy, not a prediction for every playstyle. A mixed crime/shipment strategy spends the same finite energy on different activities and will have different results.

| Day | Cash after measured costs | Normal XP | Rank |
|---|---:|---:|---|
| 1 | $39,476–$87,597 | 4,680–8,760 | Outsider |
| 14 | $7,216,135–$11,167,512 | 111,740–134,060 | Made Member / Associate |
| 30 | $87,703,671–$100,753,095 | 323,580–340,740 | Capo |
| 60 | $1,202,157,592–$1,455,372,257 | 758,220–796,500 | Kingpin / Crime Lord |
| 90 | $8,542,679,842–$9,554,398,747 | 1,257,300–1,293,900 | The Godfather |

- Family creation costs $1,000,000. All five accounts first have that cash available on day 5–5; the simulation saves it rather than creating a family. Joining an open family remains free.
- First promotion threshold: 9,000 XP. All five accounts finish day 1 as Outsider.
- Godfather threshold: 1,144,100 XP. Measured first arrival: day 82–84. Thus this active playstyle can reach Godfather by day 90.
- Each further 135,100 XP grants a legacy distinction, matching the final normal-rank gap. Existing +15% compounded active-income distinctions remain.
- One 180-day continuation (seed 42): 3,056,580 XP, Godfather +14, $149,060,924,891 saved. This is one long-run scenario, not a five-seed distribution. The requested compounded legacy bonuses make late-game income grow substantially; monitor real-player data and money sinks before treating this as a final public economy.

## Exact day-60 money reconciliation

Net crime = gross rewards minus fines and replacement ammunition. Ending cash = $5,000 + net crime + daily cash + passive cash − purchases. Every seed is asserted to reconcile exactly. Weapons and business purchases total $1,620,000; retained assets are not included in the cash column. No manual refill of cash, XP or energy occurs in this study.

| Seed | Crime gross | Fines | Ammo | Net crime | Daily cash | Passive | Purchases | Ending cash |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 17 | $1,455,770,974 | $942,118 | $887,000 | $1,453,941,856 | $2,250,000 | $795,401 | $1,620,000 | $1,455,372,257 |
| 42 | $1,202,141,238 | $524,445 | $858,000 | $1,200,758,793 | $2,250,000 | $763,799 | $1,620,000 | $1,202,157,592 |
| 91 | $1,295,873,522 | $174,327 | $872,000 | $1,294,827,195 | $2,250,000 | $759,081 | $1,620,000 | $1,296,221,276 |
| 123 | $1,320,539,557 | $355,723 | $844,000 | $1,319,339,834 | $2,250,000 | $756,934 | $1,620,000 | $1,320,731,768 |
| 777 | $1,440,659,720 | $478,424 | $875,000 | $1,439,306,296 | $2,250,000 | $781,119 | $1,620,000 | $1,440,722,415 |

Current crime baselines are 4× the preceding 10%-payout build (40% of the older baseline). Normal crime/daily/PvP XP rewards are 4× their former values; failure XP is included. Shipment career XP is 160 / 440 / 1,000 on success and 20% on failure. Bullets remain $50 each. Passive catalog rates remain reduced and rank scaling uses a square root; passive holdings were not raised with active crime rewards. Existing cash and XP are preserved, while ranks are recalculated using the new thresholds.

## Drugs and guns — separate career cadence study

Five seeds per scope, 120 simulated days, four attempts per career per day in four six-hour-spaced sessions. Career XP starts at zero; normal rank is held at Outsider. This separate study has prepared funding and the necessary weapons, charges replacement ammunition, and measures career cadence only. It is not a fresh-account earnings study and cannot be added to the crime study without allocating additional playtime/energy and equipment capital. No escorts, family holdings or donation bonuses. Both 15-rank careers end at 152,500 XP.

| Scope | Drugs: first Connect day | Guns: first Connect day |
|---|---:|---:|
| personal | 90–92 | 88–95 |
| family | 87–89 | 86–90 |

Family scope uses one contributor and every run credits personal and family XP equally; the reported family dates therefore apply to both. Several active contributors advance the family sooner. Higher-tier runs still require both the personal and family rank, funds, weapons and ammunition.

## Other implemented safeguards and rewards

- Achievements: one-time 500 XP introductory rewards; 1,000 or 2,000 XP for other milestones. Claim on the achievement page. Normal promotion energy restoration applies. Claim history survives gameplay reset, preventing repeated farming.
- Same-family robbery, kidnapping and liquidation rejected on the server before resource consumption.
- Anonymous liquidation attempts and paid arrest reports cost an extra $500,000. Valid failed attempts still pay; invalid requests roll back. Victim notifications and personal event logs hide the actor, while the actor’s retained activity log remains available to staff.
- New coma treatment: $1m at rank 1 to $100m at Godfather, using quadratic rank scaling. Other hospital/prison release fees: 5–100% of their original maximum. All decrease linearly with remaining time. Rank is fixed into the fee when the stay starts; existing stays retain their saved quote. Cash, bank, selected assets and authorized family/third-party rescue remain supported.
- Profiles and Owner population overview show account creation, distinct active UTC days and measured hours. Heartbeats count at most 60 seconds per observation and stop counting gaps beyond 90 seconds, avoiding multi-tab double counting. Tracking begins with this update; historical hours are unavailable. Online/last-seen indicators and chat dots use the same server timestamps.

## Reproduce and install

From the project folder containing package.json: `npm test`; `node scripts/economy-playtest.js 90`; `node scripts/career-playtest.js`; for the long scenario, set SIM_SEEDS=42 and run `node scripts/economy-playtest.js 180`; then `node scripts/economy-report.js`. Simulations never open the real database. Five-seed runs take several minutes.

For hosting: stop the running Node process, back up data/mafia.sqlite together with its WAL/SHM files (or take a SQLite backup), replace application files and public/ from the update archive, preserve data/ and environment configuration, then restart the actual service. Verify /api/health reports this build and reload the browser. No deployment to the friend’s server has been performed here.

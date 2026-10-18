# 180-day bonus simulation

Five isolated fresh accounts; four 30-minute sessions every six hours (two hours/day), one action opportunity per minute. Real server handlers, seeded random outcomes, calendar Sundays for everyone, normal detention/costs/ammo, daily and achievement claims. No PvP, casino, respect farming, team missions or external donations. Marriage purchased only once affordable; spouse supplies consent, no funding. Family founded and funded from earned money. Supporter packs renewed each 30 days in this comparison, including their stated cash/XP grants; live bots get only one month. Catalog-base asset valuation; purchases are cash outflow, not destroyed wealth. This is a strategy comparison, not a prediction or all-bonus maximum.

> Historical run: these results used the previous $1 trillion cash cap. The new release raises the cap to $1 quadrillion (1,000,000,000,000,000). This report has not been rerun with the higher cap; reproduction on the new build will differ.

## Main finding
The current economy grows much faster than the intended ~90 days to Godfather. Godfather was reached on days 18–36. All five scenarios reached the $1,000,000,000,000 wallet cap by the day-90 snapshot. This is an imbalance finding, not a balanced-economy certification. No economy tuning was applied as part of this report.

| Scenario | Godfather day | First 5-day snapshot at cash cap | Cash day 60 | XP day 180 | Legacy distinctions day 180 |
|---|---:|---:|---:|---:|---:|
| No membership or marriage | 36 | 85 | $189,430,473,533 | 13,119,300 | 88 |
| Marriage | 33 | 80 | $283,901,181,927 | 14,552,241 | 99 |
| Supporter | 30 | 75 | $407,266,556,485 | 14,589,625 | 99 |
| Supporter + marriage | 29 | 70 | $627,345,177,068 | 16,343,264 | 112 |
| Grand Supporter + marriage | 18 | 50 | $1,000,000,000,000 | 17,866,577 | 123 |

## Interpretation and limits
- Four 30-minute sessions per day, with real server rules and seeded outcomes. The agent chooses profitable available crimes and reinvests in businesses/employees. This is an active strategy, not an average casual player.
- All scenarios receive calendar Sunday bonuses. The baseline has no membership or marriage, but still earns ordinary ranks, achievements and daily rewards.
- Supporter scenarios try to renew every 30 days. Full-wallet protection rejects later renewals: Supporter from day 91; Grand Supporter from day 61. Those memberships then expire, so the later comparison is NOT continuous premium membership. Live bots receive only one initial month.
- The cash ledger reconciles at every snapshot. Income and expenses represent actual net wallet changes per activity: crime fines, supply costs and purchases are included; purchase value is retained in assets. These are not gross reward projections.
- Net cash flow excludes separately recorded pack cash. Personal value includes cash, bank and purchased businesses, weapons and employees at catalog prices. Family treasury is separate.
- No player attacks, casino, team missions, respect farming, outside gifts or market speculation. A consenting spouse provides no money. Each profile has its own isolated world. No real player database was used.
- Fixed seed: 20261014. One trajectory per scenario; different decisions consume random values differently. Results are not statistical confidence intervals.
- Rank income multipliers compound with asset income and post-Godfather distinctions. This feedback loop is the principal target for the next balance pass. High-rank losses also become large; inspect activity totals in JSON.
- All four drug/gun careers reached level 15 by day 90 in these scenarios. The per-five-day table records each independently.

## Reproduce
Run `node scripts/bonus-simulation.js 180` from the game folder. Optionally run each profile separately with environment variable `SIM_PROFILE=0` through `4`. The simulation creates disposable in-memory databases.

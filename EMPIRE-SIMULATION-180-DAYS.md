# Empire refresh — measured progression

This report supersedes the previous bots-and-skins simulation. Generated from the real game handlers in five independent disposable databases. No live accounts were modified.

## Method and limits

Four 30-minute sessions daily, one action opportunity per minute; all profiles play calendar Sundays. Paid profiles renew their selected pack every 30 days and receive the advertised cash/XP grant on each renewal. Marriage is purchased once affordable. The strategy buys income-producing businesses and employees, pays ammunition and shipment costs, funds a family, and claims daily/achievement rewards. It waits out detention. It does not use casino, PvP, team missions, player donations, respect farming or luxury purchases.

Wealth is cash + bank + base catalog value of owned assets, weapons and employees. It is not revenue or cash alone. Income/expense totals reconcile exactly to the cash wallet at every five-day checkpoint. Combined action ledger entries record net cash movement, so they are not a gross turnover audit. This is one seeded strategy per profile, not a promise for every player.

| Profile | Godfather day | Wealth day 90 | Wealth day 180 | Prestige day 180 |
|---|---:|---:|---:|---:|
| No membership or marriage | 92 | $82.29B | $631.02B | 5 |
| Marriage | 88 | $83.80B | $711.65B | 5 |
| Supporter | 55 | $220.90B | $897.90B | 7 |
| Supporter + marriage | 53 | $222.45B | $953.61B | 8 |
| Grand Supporter + marriage | 31 | $282.87B | $1139.83B | 10 |

The plain account reaches Godfather on day 92, close to the 90-day target. Its day-90 wealth is $82.29B, below the approximate $100B objective. Paid renewals accelerate progression materially, especially Grand Supporter. The current result should not be described as equal progression for paid and unpaid players.

Personal catalog holdings at their quantity limits have $99.052B base value and cost about $117.022B including repeat-business premiums. Employees and armory are additional. The permitted family collection costs about $1,017.629B including repeated-copy premiums and the highest compound, excluding city-map plot competition. These are catalog totals, not proof that the simulated player purchased every item by day 90.

Prestige XP gaps increase 18.5% each step; crime earnings increase 7.5%. Passive rank multiplication is capped at 16. The baseline reaches five prestige distinctions by day 180, leaving continued progression.

Full five-day rows: `art/empire-balanced-simulation-180d.csv`. Reproducible source data: `art/empire-balanced-simulation-180d.json`. Run `node scripts/bonus-simulation.js 180`; optional `SIM_PROFILE=0` and `SIM_OUTPUT=custom-prefix` select a profile and output prefix.

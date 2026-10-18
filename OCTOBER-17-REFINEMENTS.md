# Collections and finance desk — 1.17.0

- Dashboard income claims show the authoritative uncredited amount and an active-time
  clock, capped at 24 hours. Reading pages accumulates income into pending credit;
  claims and ordinary spending actions collect it once. Detention pauses accrual.
  Family passive income still goes directly to its treasury. The duplicate portfolio
  collection button is removed.
- Personal profiles, possessions and family possessions group categories and show
  higher catalog prices first. Showroom cars run from lower to higher prices.
  Garages and recovered-vehicle stores have value, name and condition selectors.
  Purchased cars retain their original Perfect cosmetic condition; race wear is
  a separate workshop statistic and does not silently change collection stars.
- Street Runners cost $100,000, earn $2,800 per active hour and cap at
  1,000,000,000. Other employee specialties retain their individual limits.
  Existing employee and investment rows survive schema migration.
- Personal and family active investment principal each cap at $100 billion.
  Sliders and maximum-amount controls accompany bank transfers and investments.
- Air fares use great-circle city-center distance: $1,000,000 plus $500/km,
  rounded to whole dollars. Authoritative fares also feed Luca's production advice.
- Family name changes use the existing Don/Capo settings transaction, charge the
  treasury $1,000,000 and cap at three for the family's lifetime. Other appearance
  edits remain available after that limit. Fully autonomous bot families can
  occasionally rename through the same validation; mixed human families are excluded.
- The Auction house page contains art and vehicle auctions. Listing stays with
  the relevant collection. Art has new overview, heist and collectible images.
- Midnight Circuit is standalone above Casino; navigation can be hidden, and its
  scroll position remains independent of page scroll positions.
- City backgrounds use their city artwork. Label points maximize interior clearance
  within the visible city/territory intersection. Regenerate with
  `python scripts/center-map-labels.py` after rebuilding city geography.
- Shipment categories get separate three-card rows. Drug route quotes expose freight
  cost, time, risk and delivered net profit as separate figures. Market comparison
  can show a single drug instead of all five columns at once.
- Armory value uses documented actual weapon purchase costs, including copy-price
  increases. Old personal receipts are recovered once; new personal/family payments
  are recorded atomically and duplicate retries do not count twice. Unknown legacy
  costs are excluded and disclosed. Ammunition is excluded. Owner's eight preserved
  receipts cover $607,703,929,152 of current holdings, verified read-only.
- Banners retain the shared original height with page-specific focus cropping and no additional darkening.
  Profile/family-profile treatments retain their intentional background fading.

Verification evidence: `art/oct17-regression-final.log`, `art/oct17-http-final.log`,
`art/oct17-language-final.log`. Tests run on isolated databases; the saved real world
is not reset. Bots and Luca use the changed catalogs, navigation, rules and live quotes.

## 1.17.0 completion

- Interactive map photography feathers toward the territory outline; only this map
  background and the existing profile backgrounds receive fading.
- Art expands to 25 illustrated models, with four permanent collection achievements.
  Personally stealing 1/5/25 Pristine cars adds three more achievements. Original
  theft attribution survives sale and auction transfer; buyers receive no theft credit.
- Airport cards default to ascending distance, with a descending selector.
- Supporter diamonds use the faceted premium-shop drawing in membership colors.
- Crime notices use matching framed gold/steel panels. The rank table drops its
  extra opportunities column. Version 1.17.0 supersedes the unshipped 0.2.0 build.

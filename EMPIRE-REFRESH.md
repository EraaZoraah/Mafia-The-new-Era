# Empire refresh

Build: `2026-10-15-empire-refresh-1`.

## Local start and deployment

Run `npm start` from the folder containing `package.json`, or `npm test` for the regression suite. Stop the previous server with Ctrl+C before restarting. For another port in PowerShell: `$env:PORT="3101"` then `npm start`.

Before updating a hosted game, stop Node and back up the full live `data/` directory and environment configuration. Replace runtime JavaScript and the complete `public/` folder from the update archive. Preserve `data/` and environment settings. Restart Node and check `/api/health` for this exact build. Refresh the browser. No remote server was updated here.

The migration removes holdings above the newly authorized limits and retains only the most valuable master compound. No compensation or new archive record is created. Existing players, accounts and bots are not reset. Keep the backup if you may need to reverse this migration.

## Gameplay

- Increasing prestige XP gaps and 7.5% reward increases, with capped passive rank scaling.
- Businesses: ten per design. Homes, cars, aircraft, yachts and garages: one per design. Luxury holdings supply utility perks rather than cash income.
- Employees: Personal Chauffeur one (respect), Bookkeeper one (cash), Underworld Broker one (cash), Elite Personal Bodyguards six (Power), Operations Leaders six, Street Runners 100,000. Cash-producing employee base payback is at most 36 active hours; detention pauses accrual and offline time is capped.
- Family cars: ten per design; one safehouse per design and one master compound. Aurelius Royal Dominion, Obsidian Sanctuary and two new family vehicles are available.
- Territory income accrues to the family treasury and is shown on My family, with family-career bonuses and a 24-hour offline limit.
- One million ammunition capacity; heavier crime and mission supply requirements. The insufficient-ammunition popup links to the armory.
- One thousand unsold crates per drug type; storage validation runs on the server.
- Expanded shop supply packs; purchased energy can exceed normal capacity and persists until spent. Owner-exclusive Skins and frames are server-restricted. Checkout remains disabled.
- Inline casino animations and results, a single selected game, lottery Buy MAX, matching game artwork and responsive navigation.
- New city, page, employee, shipment and daily artwork; thirty individually drawn achievement emblems. Asset-owned profile cover options and edit/public-preview buttons.

## Verification

208 automated tests passed in the final full run, including a static-module HTTP regression, possession migration, paid energy persistence, Owner cosmetics, and territory income timing/ownership tests. The five-profile 180-day simulation uses disposable databases and reconciles cash every five days. See EMPIRE-SIMULATION-180-DAYS.md for assumptions and limitations. Browser checks cover desktop and 390-pixel mobile casino navigation, no modal outcome, retained results and no horizontal overflow.

The baseline simulated account reaches Godfather on day 92 and has $82.29 billion wealth on day 90. This is close to the progression target but below the approximate $100 billion wealth objective; purchasing every luxury item by that date has not been demonstrated. Do not treat a single seeded playstyle as a guarantee.

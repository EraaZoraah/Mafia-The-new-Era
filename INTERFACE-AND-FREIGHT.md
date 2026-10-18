# Interface, guidance and city freight — 15 October 2026

Build: `2026-10-15-city-freight-1`. This update does not rebalance existing rank thresholds, crime payouts, asset prices or passive income. New city production and cargo quotes belong to the requested freight feature. No new economy simulation was run.

## Five previously incomplete items

- The free local Personal Assistant indexes the same navigation, exported content catalogs, rulebook and FAQ as the game. It covers current assets, weapons, employees, missions, upgrades, milestones, careers and shop content. Recommendations use the player's actual resources, cooldowns, detention, unlocked content and claimable rewards. Drug advice uses the authoritative live market functions. Maintenance instructions in `AGENTS.md` require new features to update the shared sources and coverage tests. This remains a local game guide, not an external general-purpose AI.
- Every supported prestige distinction has an individual gold emblem. Its polygon, inner symbol, surrounding rings and number develop across the progression. Existing XP and reward formulas are unchanged.
- Dedicated page overview images replace catalog photographs used as headers. Ordinary page banners have consistent dimensions and keep their brightness. The trophy cabinet is contained so it is fully visible. Player and family profile backgrounds are the only fading exceptions. Personal and family armories intentionally share the same overview, as requested.
- Public self-preview uses the same rendering branch as other players' profiles, with interaction controls shown but disabled and private editing/security controls omitted. Customization lives in Edit my profile. Owned property, weapon and employee images can be selected as covers; server ownership is checked.
- Family roles display capitalized names while internal role identifiers and permissions remain unchanged.

## Other interface changes

- Sixty unique menu/group SVG icons in the established gold style, including Support tickets, Crypto and Investments. Staff navigation is first and remains restricted to Owner/Admin. The support counter preserves its icon.
- Cash, bank, Power, XP and rounds sit in a gold-framed wallet, with distinct cash/bank icons and Log out on the right.
- A framed family name, Edit family button and family-owned cover selector. Only Don/Capo may save settings; removed holdings cannot remain as selectable covers.
- Separate Bank, Crypto exchange and Investments pages. Crypto Buy MAX respects current cash and the per-coin purchase-basis cap.
- Lottery history shows up to ten recent draws and links to winners.
- Single-copy assets do not offer Buy MAX. Compound extensions have five matching illustrations.
- Dashboard has Claim all hourly income. Existing automatic collection is retained; the action settles/collects available personal accrual without creating duplicate income. Family accrual continues to credit its treasury directly.
- Marriage has one banner. All page images are bright; only personal/family profile backgrounds fade. The Owner Goddess has a fully clothed refreshed portrait with blue eyes and forearm tattoos, retaining Owner-only access and the diamond frame.

## Drug production and cargo

Each of the five fictional drugs has distinct production and sale factors in all fifteen cities. Production costs, destination sale quotes and transport costs fluctuate hourly by drug and city. Production starts in the actor's current city. Existing production cost/base value is locked at creation; legacy batches migrate to New York because their historical location was not recorded.

Completed stock can be sold locally or dispatched by cargo boat, cargo plane or regional truck. The server quotes the fee, duration and interception risk. Trucks only operate inside connected regions; planes are faster and riskier; boats are slower. Larger batches and some destinations raise inspection risk. Fees are charged atomically and retry keys prevent duplicate dispatch. Cargo cannot be sold or dispatched again while in transit. An intercepted batch and its paid fees are lost. Delivered cargo moves to its destination city. Outcome is hidden until arrival.

Every completed batch shows local net profit and margin. Route options show net profit after original production and all previous/new freight costs, including eligible profit bonuses, plus interception chance. Margin is net profit divided by total production/freight cost. Quotes are estimates: market prices may change before arrival. Stale hourly quotes submitted by the UI are rejected before charging.

Luca compares unlocked products, all cities and 6/12/24-hour terms for one crate. Available advice considers cash, owned jet and flight cooldown; relocation fare is included where applicable. Routes rank by expected profit after interception risk, divided by total production plus transport hours. Existing completed stock is compared separately. Larger cargo and prices at completion can change the best route; advice is not guaranteed profit.

## Validation and run instructions

From the directory containing `package.json`:

```powershell
npm start
# If port 3000 is already in use:
$env:PORT=3101
npm start

npm test
node scripts/audit-interface.mjs
node scripts/audit-visual-assets.mjs
```

Final verification: **216 tests passed, 0 failed**. The visual audit found 60 unique menu/group icons, 50 registered page headers and five compound-extension images with no missing assets. Desktop and mobile browser checks found no broken images or mobile horizontal overflow.

Automated coverage includes live knowledge/page coverage, prestige emblems, cover authorization, hourly quote changes, net margin arithmetic, shipment ownership/replay/transit locks/interception and nonduplicating income collection. Browser checks use the disposable preview database, with desktop and 390-pixel mobile views.

Art prompt inventory and built-in generation mode: `art/interface-freight-prompts.json`. Audit: `art/interface-audit.json`. Ordinary banner and icon duplicates: none; the two armories share their header intentionally. Existing item photographs still appear in ownership galleries and may be chosen as profile covers.

## Deploy

Back up the live database. Replace all runtime `.js` files and the complete `public/` directory from the new package, preserving `data/`, environment and secrets. Restart Node. Check `/api/health` for `2026-10-15-city-freight-1`. This work has not been deployed to a remote server. No live player database was reset or used for browser testing.

# Bounties, backfire, supporter memberships and marriage

Build: `2026-10-12-marriage-page-3`.

## Player features

- Crimes & missions → Bounties: fund a liquidation contract with cash. The target's successful liquidator receives eligible escrow automatically, once. Successful return fire also qualifies. Sponsors cannot claim their own contracts; same-family targets and players below 500 XP are protected. Maximum ten open contracts per sponsor. Any unpaid reward caused by wallet capacity remains collectable on this page.
- Player operations and profiles: choose 60–10,000 liquidation rounds. Base success rises from 35% toward 90% with diminishing returns, before target protection. The NPC liquidation contract also lets you increase its normal ammunition budget to improve its rank-adjusted chance.
- Bounties → Personal backfire: choose 0–10,000 rounds. Requires a tier 3 weapon, consumes at most the available ammunition per valid incoming liquidation attempt, and independently rolls a chance approaching 65%. Both players can enter a coma. Zero disables backfire.
- Dashboard → Your record: incoming attack, robbery, kidnapping, liquidation and return-fire attempts, successes and success percentages. These records begin with this update; old totals are not invented.
- Marriage in the main menu: a $5 million wedding, paid entirely by the proposer only when the recipient accepts. Both need 500 XP and can have only one spouse. Invitations expire after 72 hours. Five invitations per day; blocking prevents proposals. Either spouse can divorce without a refund.
- Marriage grants each spouse +10% eligible crime cash/XP, personal shipment reward/career XP, contact-mission cash, daily and achievement rewards, personal passive income, personal production profit and PvP XP. It does not multiply transfers, stolen cash, bounty escrow, casino returns, investments, staff gifts or family treasury income. Fractions round down. No stacking.

## Premium shop

| Product | Price | One-time cash | One-time XP | Name and diamond |
|---|---:|---:|---:|---|
| Supporter | €4.99 | $25,000,000 | 50,000 | Silver, 30 days |
| Grand Supporter | €9.99 | $75,000,000 | 150,000 | Gold, 30 days |

One membership at a time, renewable after expiry. No automatic subscription. The other products retain their permanent cosmetic rewards. Owner/Admin can grant products to themselves or other active players through **Shop gifts & grant log**. Grants are audited and retry-safe. Actual PayPal checkout remains disabled; the game does not accept payments yet.

## Persistence, moderation and accounting

New tables are added automatically on server startup. Existing accounts, money and XP are preserved. Take a database backup before deploying. Staff reset/delete ends marriages; open bounties on that target become durable refund credits for other sponsors. A sponsor reset forfeits their own open contracts, and a reset recipient forfeits uncollected credits. Supporter entitlement survives gameplay reset without repeating its cash/XP grant; account deletion removes it. Incoming operation and grant records remain as historical audit data.

Owner totals display outstanding bounty escrow separately from liquid money. Assigned unpaid bounty credit is included in player net worth. Payments, wedding costs and grants are also recorded by the existing economy ledger.

## Previous economy work

The rank, presence and economy update is included. See `ECONOMY-PROGRESSION-REPORT.md` for five fresh-account simulations: $1.20–1.46 billion saved after costs by day 60 and Godfather on days 82–84, under the documented two-hour daily playstyle. Career simulations are separate, funded scenarios. These baseline simulations did not include marriage or paid/granted supporter rewards and are not guarantees for every playstyle. Legacy multipliers create very high late-game income; monitor the economy dashboard during beta.

## Run and deploy

Use Node.js 22 or newer. In the folder containing `package.json`, run:

```powershell
npm test
npm start
```

If port 3000 is in use, stop the old instance or choose another port with `$env:PORT='3001'` before `npm start`.

For an existing host: stop the Node process, back up the complete existing game folder/database, replace the runtime files **and the complete public folder** from this release, retain the server's own data folder and environment configuration, then restart Node from this project folder. Do not overwrite the live database with a development database. Check `/api/health`: the build must be `2026-10-12-marriage-page-3`. If it differs, the host is still running an older folder/process. Refresh the browser after restarting.

The release archive excludes local databases, environment secrets, test-account credentials and temporary browser fixtures. Nothing has been deployed to the public test server by this update.

Memberships now also add 10% (Supporter) or 25% (Grand Supporter) to eligible earnings and XP for 30 days. See CITY-EXPANSION.md for current rules and exclusions.

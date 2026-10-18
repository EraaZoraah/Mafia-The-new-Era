# Crew & guide update — 14 October 2026

Build: `2026-10-14-crew-and-guide-1`

## Included

- Luca Moretti — Personal Assistant: a free local, account-aware game guide. It recognizes English/Dutch game-topic keywords, responds in English, offers next steps, opens pages and highlights menu destinations. It does not call external AI or execute purchases/actions for the player.
- Four persistent team missions for exactly 2, 3, 4 or 5 players. Every player consents by joining. A leader can launch only a full eligible crew; the server checks every member and charges/pays the whole operation atomically. One-hour attempt cooldown, 30-minute recruitment expiry. Successful missions contribute to introductory/team achievements.
- Five permanent compound extensions, separate from security upgrades. Don/Capo authority, family treasury payment, one of each, retained when moving. They add a combined 11,700 Power and 10 shipment success percentage points, subject to the 97% final chance cap. Extensions count in family wealth and possessions.
- Sunday Funday, every Sunday 00:00–24:00 UTC, with 1.5× eligible earned cash and XP. Passive accrual correctly splits at midnight and membership boundaries; no retroactive Saturday bonus. Transfers, principal, stolen funds, bounties, staff gifts and season awards remain excluded. Recurring event card, once-per-account/Sunday acknowledgement and “Commit some Crimes!” popup button.
- Lottery prize is 200% of ticket sales. Lucky Winner lasts 24 hours from the draw deadline. Collection can happen later without losing the saved prize.
- Crypto cards show distinct logos, green/red movements with arrows, purchase basis, current sale value and percentage gain/loss. Separate Buy/Sell buttons retain server quotes and replay protection.
- Menu icons in one gold line style, 30 individual achievement medals and new photorealistic images for the casino, six weapons, ammunition, four crew missions and five production products.
- Clear active staff subsection/breadcrumb. Player lists appear on Players, not on unrelated staff pages.
- Historical Changelogs, grouped as earlier beta development history where exact release dates are unavailable. No staff-only changes, payout/XP tuning details or wedding-price changes in the public history. Future release entries become announcements only when explicitly marked as new features. The current new-feature announcement publishes once automatically when an Owner exists.
- Home-screen installation support: manifest, icons and a service worker. The service worker stores only a generic offline notice; live game pages, JavaScript and authenticated API data are not cached. Compatible browsers need HTTPS (localhost works for development). On iPhone, use Safari’s Share → Add to Home Screen. Installation is not offline gameplay.

The earlier city expansion is included too: employees, 15 fictional cryptocoins, 15 breakout ranks, global collectible gifts, expanded casino, marriage page/art, news-first login and updated Supporter memberships.

## Gameplay values

| Team mission | Players | Base cash per successful player | Base XP | Fee | Energy | Rounds |
|---|---:|---:|---:|---:|---:|---:|
| The Velvet Handoff | 2 | $30,000–37,500 | 1,200 | $500 | 20 | 5 |
| Midnight Express | 3 | $75,000–93,750 | 2,000 | $1,500 | 25 | 10 |
| The Gilded Gallery | 4 | $150,000–187,500 | 3,200 | $4,000 | 30 | 20 |
| The Crown Vault | 5 | $250,000–312,500 | 5,000 | $8,000 | 35 | 30 |

Cash grows with normal rank and eligible activity bonuses. XP receives eligible XP bonuses. Failed attempts charge approved costs, pay no cash and award 15% of base XP before bonuses. Launch checks weapon tier and required XP. The UI shows the current player’s rewards.

A wedding costs $5 million on acceptance. Both spouses retain the existing 10% eligible gameplay bonus.

Ammunition costs $25 per round. Weapon bases are $5,000 / $25,000 / $100,000 / $300,000 / $1 million / $3 million. Each next copy adds 1% of base price, with a 10,000-per-design cap in personal and family armories. Catalog-value rankings reflect the new bases; owned items are retained.

## Deliberately deferred

At the owner’s request: real reset emails, email verification, Google/Facebook/Microsoft/Apple sign-in and passkeys. These still need the final HTTPS domain and provider configuration. No placeholder provider buttons or fake email flows were added. Shop checkout remains disabled; no real-money payment integration changed.

## Deployment

1. Stop the existing Node server and back up its whole `data` folder while stopped.
2. Copy all code and the complete `public` directory from the update ZIP into the server application directory. Keep the server’s existing `data` directory; the ZIP contains no database or accounts.
3. Use Node 22+ with built-in SQLite support (tested with Node 24). From the directory containing `package.json`, run `npm test`, then `npm start`.
4. Restart the actual Node process/service, not just the reverse proxy. Check `/api/health`: build must be `2026-10-14-crew-and-guide-1`. Refresh the browser.
5. Serve over HTTPS before enabling home-screen installation publicly. The server adds new tables automatically. For a rollback, restore both backed-up code and database together.

Local Windows start:

```powershell
cd "C:\Users\Jeffrey Berwald\Downloads\mafia-the-new-era-english\mafia-the-new-era"
npm start
```

If port 3000 is already in use, open the existing instance or stop its own terminal first. Alternatively use `$env:PORT='3001'` before starting a separate intentional instance.

## Verification

The regression suite uses disposable SQLite databases and an isolated HTTP server. Targeted checks cover crew consent, leader authorization, partial-failure rollback, duplicate launch, expiry, five-player failure costs, compound ownership/permissions, Sunday UTC transitions, precise passive accrual, calendar acknowledgement and lottery emblem expiry. Browser checks use a separate disposable preview database, never the real game database. No production deployment was performed by this update.

Final verification: 192 tests passed, zero failures. The asset audit checked 114 catalog references, 30 achievement medals and 15 coin logos with zero missing files. Browser checks covered mobile layout, guide navigation, crew creation/cancellation, crypto buy/sell and staff subsection navigation.

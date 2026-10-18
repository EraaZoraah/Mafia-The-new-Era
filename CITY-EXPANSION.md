# City expansion — 2026-10-13

Build: `2026-10-13-city-expansion-1`.

## Memberships

Supporter costs €4.99: $25 million and 50,000 XP once, plus a silver name/diamond and a 10% earned-cash/XP bonus for 30 days. Grand Supporter costs €9.99: $75 million and 150,000 XP once, gold name/diamond and a 25% bonus for 30 days. The stronger tier does not stack with the weaker tier. Existing memberships gain the bonus until their existing expiry, without repeating the initial rewards. Marriage multiplies eligible rewards separately by 1.10.

Applies to crimes, personal shipment rewards/career XP, contact missions, daily and achievement rewards, passive income, personal production profit, PvP XP, breakout career XP and respect-giving rewards. Investment interest, crypto realised profit and positive net casino winnings get the membership cash bonus. Principal, cash transfers, energy transfers, stolen cash, bounty escrow, staff gifts and family funds are excluded. Passive accrual splits precisely at membership expiry. Checkout remains disabled; no payments are processed.

## Bank and employees

Bank contains investments and a wallet/exchange with 15 fictional coins. Quotes change in ten-minute UTC buckets; all players share the same saved prices. Prices move at most 2% per step, bounded at 20%–500% of the starting price. Inactive markets catch up at most 24 hours on the next request. Whole-coin orders have a 1% buy markup / 1% sell discount and a $100 million cost-basis cap per coin. Stale orders are rejected. Selling removes the proportional cost basis; only realised positive profit receives the membership bonus. There are no blockchain connections or real-coin transfers.

Six employee types can be hired permanently, four per type, through Personal assets → Employees. Their income uses passive/rank/marriage/membership multipliers, has the same 24-hour offline cap, and pauses during prison/hospital stays. Power is included in the player's and family's total. Employee and coin values appear in the world economy totals. Reset removes these gameplay holdings.

## Breakouts, staff gifts and news

Fifteen breakout ranks award 100 base career XP per success and 25 per failed attempt. Each rank adds 2.5 percentage points to the previous chance; final chance cannot exceed 95%. Normal ammunition, money, energy, cooldown and failure-imprisonment rules remain. The prison page shows current rank, progress, all ranks and mission odds. Staff may edit breakout XP.

Owner/Admin → Complimentary gift reserves a batch for every active, non-banned account existing at creation, including staff. Cash, XP, energy, ammo, career XP and respect can be combined. Every batch is audited. Players see a **Complimentary gift** popup with **Collect** and **Later**. Claims are atomic and replay-safe. Energy caps at the player's maximum; insufficient room for other rewards leaves the whole gift unclaimed. Detained players can collect after release. Reset forfeits pending gifts.

New announcements, event revisions and release notes send a signing-in player to Announcements & events. Otherwise login opens Dashboard. Seen status is stored per account, not in the browser. Each release's concise entry is maintained in `release-notes.js` and appears automatically after deployment, below announcements. Add an immutable entry with a new ID when publishing another update.

## Casino

Casino is a standalone menu item below Finances. The daily lottery spans the page above game tiles. Each ticket costs $10,000, at most 100 per player per UTC day. A ticket is drawn uniformly; 200% of ticket sales forms the prize. Draw settlement occurs atomically on the first authenticated request after midnight UTC. Offline winners can collect later; a full wallet never destroys a prize.

Blackjack and Higher or Lower remain. Added European single-zero roulette, a two-digit safe code (1/100 chance, 95× total return), Jacks-or-Better video poker (one hold/draw, persistent hand) and a six-symbol three-reel fruit machine (three matching 18×, exactly two matching 1×). Total returns include the original stake. New games accept $1,000–$1 million stakes, with two seconds between rounds. Casino earnings give no XP. Membership bonuses increase positive net winnings; this changes the games' expected returns and should be included when monitoring beta inflation.

## Deploy and verify

Stop the server, back up its existing `data` folder, replace the complete application code and `public` folder from the update ZIP, and keep the server's original `data` folder. Do not overwrite the database with a local/test database. Run `npm test`, then `npm start` from the folder containing `package.json`. Startup adds new tables/columns automatically. Check `/api/health` for the build above. The ZIP contains no accounts, database or credentials.

Verification: full prior regression suite plus targeted tests for bonuses/expiry, worker income and detention, trade quote/replay handling, gift permissions/capacity/replay, news read receipts, breakout progression, casino outcomes/overflow/poker secrecy, and lottery settlement. Browser checks use a disposable database, including mobile width 390px, a complete poker hand, a coin purchase, a multi-reward gift and news-first login.

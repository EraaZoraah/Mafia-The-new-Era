# Empire systems and Owner controls

Updated 10 October 2026. All game interface text is English. These are fictional game systems with no real-money transactions.

## Owner Panel

The panel has two sections, **Players** and **Families**. Search and click a name to edit it. Your own player and family are included. All endpoints require an authenticated Owner; administrator/moderator labels do not grant these rights.

Players: identity, city, account role, ban status, password reset, session revocation, cash, bank, normal rank/XP, Godfather distinctions, drugs/guns career rank/XP, energy, health, heat, permanent protection, temporary muscle charges/bonus/expiry, recovery/protection/capture timers, regeneration timestamps, joining cooldown, family membership/Capo role, selected unlocked title, every possession quantity, individual action cooldowns, mysterious-contact offers and investments.

Families: name, treasury, Don, member roster and Capo roles, lifetime donation totals (and derived respect), both career ranks/XP, all safehouses/compounds/SUVs/upgrades, founding date, raid/shield/guard timers and investments. The Don must appear in the roster. To move another family's Don, first appoint their replacement in that family. Derived income, defense and respect perks follow the edited assets and XP automatically.

Changing a rank sets its minimum XP. Exact XP remains editable; legacy distinction selection sets The Godfather XP plus 250,000 per distinction. Personal asset quantities are 0–4; family assets retain their catalog limits. Zero removes an asset. Grants do not debit cash. Explicit energy edits override promotion restoration and must fit the resulting rank/asset capacity and 1,000 total cap.

Investment administration can create, edit or delete positions, including rate, dates and claimed state. It does not debit or refund money: adjust the corresponding cash/treasury separately. Server limits still apply: $1 billion active principal, 8% maximum interest, 72-hour maximum term.

Changes are transactional and audited. Invalid edits roll back. The last active Owner cannot be banned or demoted. Password, role and ban changes revoke applicable sessions. Normal registration cannot assign Owner privileges. IDs, authentication hashes and security/audit logs are not arbitrary editable gameplay fields.

## Optional drugs and gun careers

Both players and families have independent 15-rank careers, from Corner Boy/Corner Runner to The Connect. They award career XP independently of normal XP. Every career promotion multiplies its income factor by 1.15 and improves success odds. Local, regional and international tiers unlock at career levels 1, 5 and 10, cost 20/30/40 energy and have 3/7/15 minute shared cooldowns per player and trade.

Personal runs pay the player. Family runs pay 40% to the player and 60% to the treasury and advance both careers. Stakes are paid personally. Their career income factor is the average of personal and family factors, also multiplied by normal-rank earnings and family respect perks. Success is capped at 97%.

Temporary muscle lasts 15, 30 or 60 minutes and provides 3, 5 or 8 charges with +5, +10 or +15 percentage points to shipment success. Valid attempts consume a charge, including failures. Packages do not stack. Permanent personal protection has 10 levels; maximum protection reduces incoming PvP success probability by 40% and damage/loot by 30%.

## Family property and defense

Thirteen family holding designs cover starter/modern/penthouse safehouses, three compounds, three SUVs and four security upgrades. Only the Don and Capos can buy or invest from the treasury. Only the Don appoints Capos in normal gameplay.

Holdings, active members and temporary guards reduce incoming family raid probability by up to 75%; vaults and defensive holdings reduce losses by up to 70%. Shipment bonuses from family holdings cap at 12 percentage points. Raids cost 35 energy and require 500 normal XP, respect a one-hour new-family grace period and 30-minute attacking-family cooldown, and give the defending family a 20-minute shield. Loot is transferred from existing treasury funds, never created.

Donations have no daily or lifetime quota. Available cash and the $1 trillion treasury storage limit still apply. Lifetime donations survive leaving and rejoining and unlock respect at $100k, $1m, $10m, $100m, $1b and $10b. Each tier adds 2% family-shipment earnings and 0.5 percentage points of success, up to 12% and 3 points. Respect does not grant spending authority.

## Investments

Personal and family accounts each permit at most $1 billion of active invested principal. Quotes persist for 15 minutes, fluctuate on renewal and lock when the investment is opened. Rates are total returns for the selected term, not annual rates.

| Term | Interest range |
| --- | --- |
| 6 hours | 0.8–1.4% |
| 12 hours | 1.5–2.4% |
| 24 hours | 2.8–4% |
| 48 hours | 4.5–6% |
| 72 hours | 6.5–8% |

No early withdrawal. Claim principal plus integer-rounded interest after maturity. Only the current Don/Capos can open and claim family positions. Full receiving wallets leave investments claimable later. Concurrent duplicate claims cannot pay twice.

## Yachts, opportunities and artwork

Five repeatable yachts range from Harbor weekender to Elysium gigayacht. Each earns charter income and contributes crime rewards; ownership unlocks the Private maritime commission and Ocean Sovereign titles. The personal catalog now contains 63 designs and 20 crimes.

Mysterious-contact NPC opportunities arrive at randomized intervals, remain available for ten minutes, offer 90% success and rank-scaled payouts, and cost no energy. Participation is optional. Offers persist through refresh and can only resolve once.

Twenty-four new photorealistic illustrations cover the thirteen family assets, yachts and new section scenes. Images are local JPEGs. Generation prompts and source paths are recorded in `art/empire-images.json`; the contact sheet is `art/empire-contact.jpg`.

## Running and validation

Stop the existing server, back up its `data` directory, then run `npm start` from this project folder. Visit http://localhost:3000 and hard-refresh with Ctrl+F5. Startup migrations preserve existing player data. Run `npm test` for isolated temporary-database and HTTP checks. Node.js 24 is recommended; there are no external npm dependencies.

Public launch still needs authentication throttling and the hardening work tracked in AUDIT.md. Family raids are implemented; a multi-stage family-war campaign is not. Economy limits and calculations are tested, but long-term multiplayer balance still needs playtesting.

Cash and energy gifts are available through **Player transfers**. See GAMEPLAY.md for the four-copy migration policy, progressive asset bonuses and 1,000 energy cap. The current isolated suite contains 53 passing tests.

A family may own one active master compound; upgrades replace it with a 90% trade-in credit. See [JUSTICE.md](JUSTICE.md) for the latest custody, paused investment interest and respect rules.


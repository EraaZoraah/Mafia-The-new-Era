# Justice, respect and the current underworld

Updated 10 October 2026. The in-game **Game rules** and **FAQ** pages describe the full player rule set in English.

- Failed attacks and hostage/mugging operations remove 15 health; failed liquidation attempts remove 25. Successful PvP liquidation puts the target at zero health in a 72-hour coma. Initial release costs $100 million and falls proportionally with remaining time.
- Hospital and prison pages list occupants, release times and current fees. Release can use cash, bank, combined funds, selected possessions at base catalog value, another player's funds or the family's treasury (Don/Capo only). Excess surrendered asset value goes to the payer's bank. Payments and releases are atomic.
- Paid reports offer 1, 6, 12, 24, 48 or 72-hour sentences, with escalating fees and fines. Both players need 500 XP. Reports have a six-hour cooldown; released prisoners receive four hours of report protection.
- Breakouts cost 40 energy and $2 million personally (55% base success), or $1.5 million from the family (65%, Don/Capo for their own members). Respect can improve the chance. Failed attempts have a 35% chance of imprisoning the rescuer for six hours. The attempt cooldown is 30 minutes.
- Prison and hospital stop crimes, missions, acquisitions and earned/passive income. Unclaimed income earned before detention remains saved. Personal investment interest excludes detained hours; principal remains intact. Gifts received from other players are still allowed.
- Player respect has ten ranks, with up to 9% income and 4.5% defensive bonuses. Give respect to five distinct other players per UTC day, once each. Each gift rewards the sender with $50,000 and up to ten energy, subject to balance and energy caps.
- Family creation costs $1 million. A family has exactly one active master compound. An upgrade credits 90% of the old compound's catalog price. Lower/equal replacements are rejected. Existing extra compounds are archived during migration. SUVs and other repeatable holdings retain their four-copy limit.
- **Current underworld** lists player and family rankings by net worth. The Owner Panel additionally shows total cash, bank balances, treasury balances, invested principal, saved income, asset quantities and base values. Values exclude archived holdings and unprocessed passive accrual.
- Actions display illustrated result dialogs. Incoming attacks, arrests, hospital stays, releases, transfers, respect and messages produce persistent notifications, acknowledged once by the recipient.

## Running and verification

Stop the old server, back up its `data` directory, then run `npm start` from this project directory and open http://localhost:3000. Press Ctrl+F5 after updating. No packages need installing. Migrations retain existing player data.

Run `npm test` for isolated tests. The suite includes custody timing, paused income, release funding, breakout failure, respect limits, compound replacement, investment interest and JavaScript syntax checks. Syntax checks cover browser modules as well as server modules so a broken frontend cannot slip past backend tests.

New arrest, coma and breakout images are in `public/images/scene-arrest.jpg`, `scene-coma.jpg` and `scene-breakout.jpg`. Their generation prompts are recorded in `art/custody-images.json`; the contact sheet is `art/custody-contact.jpg`.

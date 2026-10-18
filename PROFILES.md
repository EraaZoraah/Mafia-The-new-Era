# Player profiles

Every signed-in player can open another player's profile by clicking their name in Leaderboard, Current underworld, a family roster, or the hospital/prison occupant list. Profiles have stable links such as `/#profile/2` and the same layout for everyone.

Public fields: rank and legacy distinctions, XP and next-rank progress, cash on hand, city, membership date, signature title, respect, status, family and family role, drugs/guns careers, and possessions with quantities, catalog value and potential passive income. Bank balances, email addresses, password hashes, sessions and private activity logs are excluded from the profile response. Viewing a profile does not collect the target's passive income.

Use **My profile → Customize your profile** to choose one of three themes, three cover images, four emblems, a motto of up to 160 characters and an already-unlocked signature title. Presets are validated on the server, text is escaped in the UI, and only the signed-in player's appearance can be changed. Styling does not alter statistics or ownership.

Other players' profiles include cash/energy transfers and Give respect. These use the existing atomic transfer and respect endpoints, including balance limits, transfer retry keys, the five-player daily respect allowance and detention restrictions. Self-transfers and self-respect remain unavailable.

The extra 20 random test accounts are listed in [TEST-PLAYERS-EXTRA.md](TEST-PLAYERS-EXTRA.md). They bring the local population to 50 test players plus the original account. Four new players are independent; the others join existing TEST families as members or Capos without changing leadership. These are passive test targets, not bots.

Run `npm start` locally and hard-refresh with Ctrl+F5 after an update. Run `npm test` for the isolated suite, which includes profile field privacy, preset validation, ownership checks and persistence across migrations.

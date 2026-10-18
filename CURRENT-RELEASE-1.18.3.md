# 1.18.3 — income collection and current game information

Personal cash income stops after 24 active earning hours until collection. The persistent income_cycles table shares one budget across cash businesses/employees, survives refresh/restart, pauses during prison/coma and never discards saved balances. Full collection resets the budget; partial claims or a full wallet do not reopen a full cycle. Existing already-earned income is preserved.

The FAQ now correctly describes English/Dutch and future language choices. Luca indexes the updated authoritative rulebook/catalogs and provides account-specific EN/NL income-cap advice. Historical patch changelogs 1.18.1 and 1.18.2 and current 1.18.3 appear in-game without new-feature announcements.

HTTP tests use a fixed Wednesday in a disposable server and parent fixture. Separate Sunday Funday and midnight-boundary tests retain event coverage. The fixture backdates the income-cycle clock consistently when simulating elapsed minutes/hours. No test changes the real database.

Device push delivery is explicitly disabled by default, including servers with existing VAPID keys. FUTURE-WORK.md records the user's deferred request. In-game notices remain available.

Verification: 302 regression tests passed; 31 HTTP tests passed; all controlled Dutch language coverage categories show zero missing entries. Interface references have no missing images/icons or unexpected duplicate page headers.

GitHub: full private repository upload authorized, including a sanitized starter snapshot of the existing world. Live data is read-only during snapshot preparation. Sessions, authentication limits, security connection logs and device subscriptions are excluded from the starter; password hashes and saved gameplay remain so existing accounts can log in. Do not publish the repository publicly while retaining private starter accounts. Existing deployment data is never overwritten by bootstrap.

Run locally: install Node.js 24, open this project directory, run npm ci, then npm start. The server defaults to port 3000. Back up existing server data before replacing code; inspect /api/health for version 1.18.3 after restarting.

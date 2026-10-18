# Mafia: The New Era — initial audit

Historical snapshot before the gameplay expansion. See [GAMEPLAY.md](GAMEPLAY.md) for the current feature set and resolved findings; this document preserves the original audit evidence.

Audit date: 9 October 2026. Verdict: functional prototype, not ready for public hosting. This audit adds repeatable baseline tests and a roadmap; application code and existing player records were not changed.

**Scope and architecture**

Inspected every original source/configuration file: `server.js`, `owner-setup.js`, `package.json`, `.gitignore`, `README.md`, and all three files in `public/`. No AGENTS.md, dependency packages, migrations, test files, deployment configuration, or Git repository were found. SQLite database files, including WAL/SHM companions, exist. The existing database was opened read-only for integrity, foreign-key, table inventory, and aggregate player-count checks; no credentials or personal records were printed.

The backend is a single 56-line, densely formatted Node.js ES module using native HTTP, synchronous SQLite and synchronous scrypt. It creates eight tables on startup with `CREATE TABLE IF NOT EXISTS`. SQLite WAL and foreign keys are enabled for the server connection. Sessions are stored in SQLite. The frontend is a vanilla JavaScript application that rebuilds its DOM for navigation and fetches JSON APIs. There is no build step or external npm dependency. Owner provisioning is a separate local CLI.

**Verified feature inventory**

| Feature | Implementation and limits |
| --- | --- |
| Registration/login | Implemented; salted scrypt, case-insensitive unique usernames/emails, server sessions, logout. Missing throttling, verification, recovery, password change and MFA. |
| Persistent profiles | SQLite account/status records and self-dashboard. No public profile/detail view or account settings. |
| Crimes/car theft/smuggling | Three random-reward actions with server-controlled rewards, XP, energy and cooldowns. No car inventory or actual smuggling routes. |
| Money/banking/ranks | Deposits/withdrawals, cash, XP and derived ranks work. No economy ledger, transfers, meaningful spending loop or balancing system. |
| PvP/prison/hospital | Absent. Health and heat fields are placeholders; no combat or incarceration/recovery behavior. |
| Families/wars | Creation and open joining work. No leave/kick/invite/leadership transfer, family permissions, treasury or wars. |
| Private messaging | Send and last 50 received messages. No sent folder, threads, read state, moderation/reporting or spam controls. |
| Leaderboards | Top 30 non-banned players by XP; no pagination or tie-break rule. |
| Properties/casino | Absent. |
| Cooldowns/energy/progression | Cooldowns and XP ranks work. Energy only decreases; it never regenerates. No heat decay. |
| Daily activities/events | Absent. The `events` table is an activity feed, not scheduled game events. |
| Owner account | Normal registration ignores submitted role; terminal provisioning grants Owner and revokes sessions. Other players cannot access Owner APIs. Owner accounts resist edits via the admin endpoint. |
| Owner management | Ban/unban and cash/bank/XP edits work. Two settings exist: registration status and crime reward multiplier. Player list capped at 200 without search/pagination. |
| Staff/announcements/security logs | No administrator/moderator roles or management, announcements or event editor. No dedicated security audit viewer. Owner only sees their latest 12 personal activity entries. |
| English interface | Main frontend is English, but several server errors/activity messages and CLI output are Dutch. Family price uses `$10.000`. |

**Tests and evidence**

Runtime used: Node.js v24.21.0, npm 11.19.0 on Windows. Original `npm test` succeeded with **zero tests**. Syntax checks passed for the backend, Owner CLI and frontend.

Added `test/baseline.test.js`. `npm test` now passes **10 tests total: one parent scenario and nine functional subtests**. They cover unauthenticated access, registration/role protection/uniqueness, login/logout, bank validation and conservation, action cooldown/energy, message recipient isolation, Owner provisioning/protection, family membership and cost, and ban/unban/session revocation.

The test copies application sources into a fresh temporary directory, starts a disposable server/database on an OS-assigned port and removes the fixture afterward. Only the copied startup log is instrumented to report that port. Existing database files are never copied or mutated. The sandbox initially blocked loopback connections with EACCES; the permitted outside-sandbox rerun passed.

Security probes print `AUDIT` diagnostics; **these observations are not passing security assertions**. Thus green baseline tests do not indicate that the vulnerabilities below are fixed. Probes observed:

- Malformed absolute request target `http://[` terminates the child server with exit code 1.
- Twenty incorrect logins all return 401; no throttling occurs.
- Registration with JSON `null` returns 500.
- Bank POST with `Origin: https://foreign.example`, `Content-Type: text/plain`, and an explicitly supplied valid session returns 200.
- Zero energy with expired cooldowns still returns 429.
- Both the existing database and disposable fixture return `integrity_check: ok`; existing database has no foreign-key violations.

This is a source/API audit, not a browser visual/accessibility audit, load test or complete penetration test. CSP/UI issues below are based on source inspection. Race behavior across multiple server processes, backup recovery, browser CSRF exploitation and numerical-overflow exploitation were not tested.

**Prioritized findings**

| Priority | Evidence | Impact and recommended correction |
| --- | --- | --- |
| P0 — availability | `server.js:33–36,56`: URL parsing, static file reads and request streaming occur outside the route try/catch; async handler is passed directly to HTTP server. Malformed URL crash reproduced. | An unauthenticated request can stop the process. Add a top-level async rejection boundary, guard URL/body parsing and aborted requests, return controlled 4xx responses, and verify the process remains healthy afterward. |
| P1 — authentication/abuse | `server.js:21–22,37–38`: unlimited login/registration attempts; synchronous password hashing blocks the only event loop. | Add account/IP throttling with bounded storage, registration and message abuse limits, bounded input sizes and asynchronous password derivation. Unknown-user and wrong-password paths also have different hashing work, creating a timing enumeration concern. |
| P1 — CSRF/request validation | `server.js:35–39,44,52–53`: no Origin/token check or JSON content-type enforcement. Foreign-origin bank request accepted in probe. | Enforce an explicit trusted origin and CSRF policy on state changes, including login/logout and Owner operations; require JSON and reject non-object bodies with 400. SameSite=Lax offers useful browser protection, so the cookie-supplied probe alone is not proof of an arbitrary cross-site browser exploit. Same-site hostile origins and login CSRF still need consideration. |
| P1 — progression blocker | `server.js:11,32`: energy starts at 100 and loses 10 per action, with no restoration endpoint or timestamp. | Every player exhausts their action budget after ten attempts. Implement elapsed-time regeneration with server timestamps and transaction-safe consumption. Define heat decay and UI refresh behavior. |
| P1 — integrity and audit guarantees | `server.js:11–19,37,44,52–53`: no CHECK constraints, versioned migrations or upper bounds on resulting balances; bank/account/admin changes and their logging are not consistently atomic. Settings changes are unlogged. | Enforce integer domains/ranges, role and boolean constraints; add safe migrations and transaction boundaries. Record actor, target, action, before/after, reason and timestamp in an audit/ledger model. Current normal balances are small; numeric overflow is a future integrity risk, not a demonstrated current exploit. |
| P1 — Owner provisioning | `owner-setup.js:5–10`: password supplied in command arguments; role/password update and session deletion are separate statements; no provisioning audit. | Use a hidden interactive password prompt, atomic update/revocation, English diagnostics and an auditable provisioning/recovery procedure. CLI credentials can appear in shell history/process arguments. Terminal-only role assignment is a sound boundary and should be preserved. Multiple Owners are possible through repeated CLI use; define the intended policy explicitly. |
| P2 — English consistency | `server.js:32,34,40,50,54–56`, `owner-setup.js:7–10`, `public/app.js:12`. | Translate errors, activity messages and CLI output; use consistent English number formatting. Existing stored Dutch activity entries need a deliberate compatibility approach. |
| P2 — frontend behavior | `public/app.js:8–9`, `public/style.css:1`, CSP in `server.js:33`. | CSP blocks external Google Fonts and inline progress widths. Cooldown buttons never update automatically. Use local assets/CSP-compatible progress elements and server-aligned countdown refresh. |
| P2 — error rendering | `public/app.js`: async page loaders call `toast()` on failure; toast rerenders the same page and immediately retries its fetch. `refresh()` treats any failure as logout. | Persistent API failures can cause a request/render loop; transient failures appear as sign-outs. Render stable error states with explicit retry and distinguish authentication failures from network/server errors. |
| P2 — operational readiness | Fixed database path; no migrations/backups, graceful shutdown, cleanup jobs, CI or deployment config. `listen()` omits host and binds beyond loopback. `package.json` allows Node >=22 while README requires 22.13+. | Add host/database configuration, align runtime requirements, session cleanup, query indexes, readiness/monitoring and tested SQLite-aware backups/restores. Use one application instance until multi-process behavior is designed and verified. |

Positive controls to preserve: parameterized SQL values; admin column names selected from an allowlist; frontend escaping of untrusted text; allowlisted static files; hashed random session tokens; HttpOnly/SameSite cookies and production Secure flag; server-side Owner checks; session revocation on ban/provisioning; conditional bank debits; crime/family transactions and database uniqueness/foreign keys. No normal-registration Owner escalation was found in the inspected paths or tests.

Authentication and CSRF recommendations follow the [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) and [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html). These are hardening references, not a claim of OWASP compliance.

**Incremental development roadmap**

1. **Stabilize the request boundary and protect authentication.** First fix the reproduced crash, then add body schemas/content-type checks, origin/CSRF protection, rate limits and bounded async password hashing. Convert each security diagnostic into a test asserting rejection or survival. Acceptance: malformed/aborted/oversized input cannot kill the server; limits engage; player sessions cannot access Owner operations; prohibited origins cannot mutate state.
2. **Make persistence and Owner changes reliable.** Introduce migrations, integrity constraints, explicit transactions, audit records and a secure Owner CLI. Configure DB path/host and implement backup/restore. Refactor readable modules incrementally around these changes, preserving current APIs where practical. Acceptance: upgrades preserve fixture data, interrupted operations roll back, backup restore is verified, privileged changes are attributable.
3. **Finish the existing playable loop.** Implement timestamp-based energy recovery, heat behavior, accurate countdowns, English strings, CSP-compatible assets and stable UI errors. Acceptance: a depleted player recovers naturally; refresh/restart cannot grant extra resources; mobile and desktop flows pass browser smoke checks.
4. **Complete administration and community tools.** Add Owner-managed staff with explicit least-privilege permissions, player search/pagination, security/activity log review, announcements and scheduled events. Expand family membership management and messaging moderation. Acceptance: permission-matrix tests cover every privileged endpoint; staff cannot grant Owner or change protected Owner accounts.
5. **Add missing game systems in dependency order.** Define and implement prison/hospital timers, then PvP; properties and money sinks; family treasury/war rules; fictional-currency casino; daily rewards and events. Specify rules, transactions, abuse prevention and tests for each feature before adding it. Acceptance: concurrent actions and duplicate/retried claims cannot duplicate rewards or overspend balances.
6. **Prepare a public beta.** Add email verification/recovery, Owner MFA, HTTPS/reverse-proxy configuration, monitoring, retention controls, tested recovery, CI, concurrency/load tests, browser accessibility/mobile checks and economy balancing. Gate deployment on resolving P0/P1 findings and restore/load testing. Reassess SQLite versus a server database if multiple application instances become necessary.

**Run and test locally (PowerShell)**

Use Node.js 22.13+ as documented by the project; this audit was tested on Node.js 24.21.0. No npm installation is required because there are no external dependencies.

```powershell
Set-Location 'C:\Users\Jeffrey Berwald\Downloads\mafia-the-new-era-english\mafia-the-new-era'
node --version
npm test
npm start
```

Open `http://localhost:3000`. `npm run dev` runs Node's watch mode. Stop with Ctrl+C. To change port, set `$env:PORT = '3001'` before starting. The current server does not restrict its bind address to localhost, so keep this prototype on a trusted development machine pending the hardening work.

Normal startup uses the existing `data/mafia.sqlite`; do not delete it to reset tests. `npm test` always uses disposable data. Avoid copying only the main SQLite file while the server is active: committed data may still be in its WAL. Add a proper SQLite backup procedure in milestone 2.

For the existing Owner setup flow, register the intended account first and run the following from the project folder, replacing both placeholders, then sign in again:

```powershell
node owner-setup.js YOUR_USERNAME 'YOUR_UNIQUE_PASSWORD_OF_AT_LEAST_14_CHARACTERS'
```

This CLI grants real Owner access to the selected local account. The current command-argument password exposure is documented above; implement the hidden-input replacement before operational use. No existing account was promoted or modified during this audit.

Recommended manual checks after milestone 3: register/login/logout, bank both directions, action cooldown expiry, zero-energy recovery, messages between two players, family creation/joining, Owner-only settings and banning, browser console CSP checks, and narrow/mobile layouts.

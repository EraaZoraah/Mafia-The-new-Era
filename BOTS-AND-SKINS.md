# Bots, Skins and casino animation

Build: `2026-10-14-bots-and-skins-1`. Run `npm start` inside this directory; test with `npm test`. Node 24 is recommended. Deploy code with the server stopped, retain your existing data directory and environment, then restart. `/api/health` reports the build. This package contains no database or credentials.

- Twenty full-body character Skins: six free, twelve at EUR 3.99, Godfather and Godmother at EUR 5.99. Paid Skins include interchangeable matching frames. Frames and colors cost EUR 1.99 individually. Checkout remains disabled; authorized staff grants remain audited.
- Refreshed young adult characters, some with tattoos, and larger profile portraits. Images were made with built-in image generation; final assets and prompt descriptions are recorded in `art/skins-manifest.json` and stored in `public/images`.
- Casino results are decided by the server before animation. Skip and reduced-motion controls are supported. Generic success, failure and notice popups use dedicated artwork; contextual activities retain relevant illustrations.
- Owner/Admin money and XP appear separately from regular-player world totals, with a combined staff total.
- Each monetary balance can hold 1,000,000,000,000,000. XP, investment principal, bets and other gameplay limits remain separate. Large random payouts and aggregated money totals use exact integer handling.

## Autonomous players and local reset

The authorized local reset has already been applied and backed up. Fifty historical test accounts were soft-deleted, fifty named bots created, non-Owner progression reset, and the Owner and Owner-led family preserved. Admin login and role remain. Six bots received Supporter and four Grand Supporter for one month with the actual pack rewards. Historical audit records remain.

Bots use real server actions and randomized online sessions. They buy supplies/assets, earn money, progress careers, interact with families and players, and use selected casino, production, investment, territory and team actions. They are clearly identified as bots. They do not automate every possible UI operation. Sessions do not simulate missed actions while the server is off. Set `BOTS_ENABLED=false` or use Owner bot controls to pause them.

Deployment does not reset accounts. `node scripts/reset-bot-world.js` previews the explicit maintenance reset; `--apply` performs it with a database backup and idempotency guard. Do not run it on a live server unless that world reset is intended.

## Simulation

See `SIMULATION-180-DAYS.md` and `art/bonus-simulation-180d.html` for five profiles and snapshots every five days. This completed run used the previous cash cap. It found Godfather on days 18–36, much faster than the intended 90 days. It is not a certification of a balanced economy. Raising the cap removes a ceiling; it does not fix compound income growth. No rank or payout retuning was made in this release.

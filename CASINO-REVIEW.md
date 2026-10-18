# Casino review and language selector — 15 October 2026

Build: `2026-10-15-casino-review-1`.

## Completed
- Played Higher or Lower, Blackjack (hit/stand), roulette, safe cracking, video poker (hold/draw), and slots in the disposable EmpirePreview server. Real accounts and balances were untouched.
- Reviewed the existing lottery rules, controls, recent winners, and automated coverage. No real-money transactions.
- Higher or Lower animation now reveals the next card too.
- Roulette shows its server-selected number over the wheel after spinning.
- Finished animation panels show total return and net result.
- Red suits use the same red-card style in poker and animations.
- Casino errors restore usable controls; active poker hands select their table after reload.
- Dark green/gold presentation retained, reels refined; reduced-motion preference remains supported. No modal results.
- Tested 390px mobile layout: 375px document width, three reels, no open dialogs. Desktop and mobile language dropdown visually verified.
- Full regression suite: 216 passed, 0 failed. Syntax checks passed.

## Language scope
The EN flag menu next to Log out is ready. NL is visible but disabled and marked Coming soon. A complete Dutch translation is NOT implemented. English remains the only active language; ranks are unchanged. Do not advertise partial coverage as a full translation.

A subsequent implementation needs central translation keys for all pages, catalogs, server result/errors, rules, FAQ, notifications and guide responses, plus durable per-account language choice and coverage checks. User messages and player/family names must remain unchanged. The project instructions preserve this requirement.

## Deployment
Deploy the entire code package, preserve server data and environment configuration, then restart Node. The new language-ui.js must be deployed together with the updated server.js static allowlist. No live server was updated by this review. No economic formulas were changed.


## 18 October 2026 — 1.18.0

See [REFERRAL-BETA.md](REFERRAL-BETA.md) for the single-playing-field redesign, six-game browser review and Dutch roulette input fix. Transaction, hidden-card, idempotency and server-side outcome rules remain unchanged.

# Release 1.24.0 verification

- Full isolated suite: 434 tests passed (including trading-result, four-hour chart, live crypto guide and question-language regression tests).
- Final targeted tests after custody/quote-factor and announcement-order refinements: 22 production/freight tests and 31 bot/guide/news/market tests passed.
- NL/ES/FR/DE controlled language audits: no missing entries.
- Browser review: all 61 main pages at 390px; the 14 table-bearing pages in each of four additional languages. Normal table text, local horizontal scrolling and no document-level horizontal overflow in reviewed states. Populated staff subpanel permutations were not all manually exercised.
- Actual horizontal swipe verified on the player directory. Fifteen coin designs reviewed in the exchange, and the current production recommendation displayed its Best choice badge and recommended term.
- Catch-up announcement was published once, appeared first among release dispatches, and was visually verified in English and Dutch. Future releases are required to opt into announcements; the latest-release test enforces that flag. Existing announcements and staff-authored text are preserved.
- Bots consume the current production recommendation when affordable while retaining varied behavior and ordinary server validation. Luca indexes the shared Best choice rule and continues using live production quotes.
- No real game database used. Optional device push remains paused.

See MOBILE-LOCALE-REVIEW.md and the mobile-table audit JSON files for browser evidence. No GitHub push performed for this request.

## Trading records and coin delivery

- Fifteen unique raster coin masters and 512px WebP delivery copies verified; obsolete coin SVGs removed and their generators retired. Delivery copies total 1.86 MB versus 43.39 MB for masters.
- Actual browser delivery verified at 512px; mobile crypto view remained within a 390px document width. Desktop/mobile captures saved in art/crypto-trading-results-*.png.
- Reports separate investment, receipts, net cash result and realized profit where cost basis is available. Tests cover intercepted cargo, fees, refunds, replay safety, resets and verified historical receipts. Missing historical costs are disclosed rather than estimated.
- Best choice uses risk-adjusted profit per hour; Highest profit uses net proceeds if delivered. Luca reads authoritative personal reports in all five languages.

## Four-hour coin charts

- All 15 coins receive up to 49 ordered quotes covering four hours; early histories remain partial and empty histories are disclosed.
- Open positions display remaining quantity, weighted average purchase price including the buy fee, purchase basis, current market/sale values and signed unrealized return after the sell spread.
- Desktop and 390px mobile preview reviewed, including Dutch labels, open chart toggles, negative and positive positions. No mobile document overflow in the reviewed state. Demo quotes/positions use an isolated in-memory fixture.
- NL/ES/FR/DE audits: zero missing controlled strings. Bot callers remain unchanged for this read-only UI; bot validation/guide checks pass and the shared Coin charts chapter is indexed by Luca.

## Chart presentation refinement

- Straight, miter-joined segments and visible markers: 48 five-minute intervals with 49 endpoint-inclusive quotes. One disclosure below each coin; duplicate header action removed.
- 31 targeted chart, trading, announcement, bot and guide tests passed. Four language audits remain complete. Desktop preview saved as art/crypto-chart-angular-preview.png; 390px mobile check: document width 390px, 49 markers and no duplicate triggers.
- Current unpublished release continues to use one translated announce:true entry covering all accumulated changes.

## Live crypto guide

- Current exchange snapshots drive Luca analysis, including named-coin and low-range questions in all five languages. Comparative watchlist scoring is explicit, not a forecast.
- Uses remaining cost basis, wallet cash, whole-coin limits, custody, health, contiguous quote history and expiry. No purchase mutation or privileged bot action was added.
- 31 targeted tests passed, including five new live-guide cases for languages, falling quotes, eligibility, missing/gapped/stale history, quote refresh and wallet privacy. All four controlled-language audits report zero missing strings.

- Full regression after live crypto guide: 431 passed, zero failed. Final five crypto-guide scenarios also passed after strengthening the non-English response assertion.

## Per-question reply language

- Local weighted language hints select EN/NL/ES/FR/DE for clear questions independently of interface language; ambiguous/short/mixed questions retain the selected language. No external service or account-language write.
- Responses expose language/source metadata; answer paragraphs have the corresponding lang attribute. Native Dutch territory replies now preserve live capture counts, cooldowns, treasury and leadership restrictions.
- Full regression: 434 passed. Additional final language/territory checks passed after refining short-query and shared-word hints. All 25 question/interface combinations checked for live crypto responses, preserving cash/XP/preferences. Four translation audits have zero missing entries.

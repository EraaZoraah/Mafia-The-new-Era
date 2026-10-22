# Release 1.25.2 verification

- Shared statistic values fit their actual rendered width without changing the value, currency or punctuation. Resize, newly rendered pages, updated values and font loading trigger a fresh fit; small values retain their normal size.
- Coverage includes shared dashboard/profile/family/staff statistics, per-coin receipts, coin prices and open-position amounts. Non-numeric labels retain normal wrapping; tables retain horizontal scrolling.
- Trading total columns use a readable minimum tile width.
- Crypto Sell maximum submits the entire current holding through the existing validated crypto/trade route. It displays the quantity and is disabled without holdings.
- No economy, custody or bot mutation rules changed. Bots retain the ordinary trade routes; Luca's existing crypto advice remains authoritative.
- New translated announcement and version 1.25.2 prepared locally.

Validation:

- Full isolated suite: 449 passed, 0 failed (.preview-portfolio-review/release1252-suite.log).
- Final crypto/chart/language subset recorded separately after the last open-position markup adjustment.
- NL, ES, FR and DE coverage audits: zero missing keys in all categories.
- Browser: 25 representative large positive/negative values at widths 320, 390, 768 and 1280: no numeric overflow.
- Real dashboard and crypto pages checked; mobile crypto with 10T holdings: 95 fitted numeric fields, no overflow.
- Browser: Sell maximum sold all 61,728,395,028 Omerta coins once; resulting holding was zero and the control disabled. Empty holdings cannot sell.
- No browser console warnings/errors observed. All fixture accounts and transactions used an in-memory database.
- Local screenshots: art/stat-fitting-desktop.png and art/crypto-sell-maximum-mobile.png.

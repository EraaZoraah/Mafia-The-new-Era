# Release 1.25.0 verification

- Full isolated regression: 445 passed, zero failed. No real game database used.
- Drug sale choices are per owned batch in personal and family stock, comparing all cities plus local sale. Best choice maximizes expected net after interception; Highest profit maximizes delivered net among affordable routes. Quotes include every paid production/freight cost. UI shortcuts sell locally or dispatch the quoted route; cargo must arrive before sale.
- New transport durations: plane 1–2h, boat 4–8h, regional truck 2h. Base risks 9%, 6%, 4%; destination/large-load additions remain bounded by 15%. Already-dispatched cargo is preserved.
- Multi-hour New York fixture checks confirmed international routes can beat local net returns. No forced or invented quote uplift was added.
- Crypto purchase basis: $10,000,000,000,000 per coin. Whole-coin buy capacity uses cash and remaining basis; UI clamps excessive input, and Buy maximum submits the affordable maximum directly. Selling has an independent quantity field, including when purchase capacity is zero.
- BigInt protects high valuations, aggregate receipts and overflow checks; small performance totals preserve numeric compatibility. All fifteen coins tested to the cap with replay/over-cap protection. Staff editing and bot/Luca quote consumers use the same current cap.
- Browser review at 1280px and 390px: route cards and destination/mode/duration shortcut, no product-type sale awards, no mobile document overflow. Oversized crypto input clamped to 61,728,394,968 units; one-click maximum bought the quoted amount in the isolated fixture, leaving buy capacity zero and selling enabled.
- First app opening with unread updates displayed Announcements; after successful rendering/read receipt the next opening displayed Dashboard. Unit tests cover per-account receipts, new content, normal in-session navigation, retries and stale login results.
- NL/ES/FR/DE audits: no missing controlled entries. Luca answers personal/family sale-route questions from the same batch quotes in all five languages; custody/role constraints and autonomous callers verified.
- Evidence: art/drug-sale-routes-125.png, art/crypto-limit-125-mobile.png, art/update-entry-announcements-125.png (local review images).

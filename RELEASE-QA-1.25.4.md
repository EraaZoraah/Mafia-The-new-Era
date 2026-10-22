# Release 1.25.4 verification

## Investment timer

- Staff can use Set timer to 0 on an existing unclaimed investment, personal or family. The server sets maturity to its current time and preserves principal, rate and claim state. Future opening dates are bounded to the current time to preserve valid ordering.
- No cash moves automatically. Normal collection retains custody, balance-cap and single-claim validation. Already claimed positions cannot be reopened. Existing staff authorization and account boundaries apply; changes are audited.
- Player editor includes an Investments shortcut. Refresh after editing retains the selected investment and expanded editor.

## Per-batch sale selection

- Ready batches have keyboard-accessible Best choice and Highest profit selection buttons with aria-pressed and a highlighted outline.
- The primary action uses the selected live quote, and shows its type, city, transport and travel time. Foreign selections dispatch cargo; local selections sell. Role, custody, stale-epoch, cargo lock, freight fees and retry validation remain server authoritative.
- Selection is retained per batch and scope when the page refreshes. Personal and family stocks use the same interface.

## City demand

- Previous Dubai base sale factors of 1.58–1.80 made it dominate all drugs. Dubai, Singapore and Tokyo now have more comparable baseline demand, with separate drug/hour demand windows rotating through cities (32%, 18% and 8% premiums).
- The existing independent 90–110% hourly quote variation remains. Production costs are unchanged; transport fees, risk ceilings and in-flight cargo outcomes are unchanged. No forced foreign destination or invented recommended quote.
- The server uses the same epoch-aware city factors in production DTOs, batch sale quotes and live guide advice. Shared rulebook and five-language Luca explanation describe the rotation.

Validation:

- Regression tests cover staff maturity, owner protection, personal/family isolation, no automatic payout and rejection of reopening claimed positions.
- Quote tests cover hourly stability, distinct drug demand windows, unchanged production factors and diverse best cities.
- A 30-hour Dubai batch sample found ten recommended cities and twenty international choices in the final run (nine cities and 17–19 international choices in earlier isolated runs). Quotes include freight and interception risk.
- Browser: clicked Highest profit, verified selected aria state and matching primary action, dispatched to the displayed Dubai/boat route and received the quoted 8h/8%/$17,471 result. Staff timer moved from a 72-hour maturity to server now with no funds moved.
- Full suite: 453 passed, 0 failed. Test logs: .preview-portfolio-review/release1254-final.log. Language audits: zero missing keys in NL/ES/FR/DE.
- Tests and preview used disposable/in-memory databases; no live player state was used.
- Bots retain their existing validated quote-driven production actions. Luca consumes the same live sale recommendations and explains the new hourly market rule.

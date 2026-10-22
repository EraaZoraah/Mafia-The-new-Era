# Release 1.25.1 verification

- Investment active-principal cap: $10,000,000,000,000 independently for personal and family funds.
- SQLite constraint migration preserves IDs, ownership, timestamps, claim state and recorded earned interest; repeat startup is safe.
- Amount input, visible maximum, slider and Invest maximum use the lesser of available cash/treasury and remaining active capacity. Matured unclaimed positions still occupy capacity.
- Invest maximum immediately submits the chosen quoted term; controls block repeat clicks while pending. Server validation remains authoritative.
- Owner/Admin investment controls, rulebook, local Luca topics and bot fallback limit follow the same cap.
- New translated release announcement triggers unread-update entry behavior; old release announcements remain immutable.

Validation on isolated databases only:

- Full suite: 447 passed, 0 failed (`.preview-portfolio-review/release1251-final.log`).
- Final language/investment subset: 17 passed, 0 failed.
- NL/ES/FR/DE coverage audits: zero missing keys across every audited category.
- Browser: 99,999,999,999,999 input clamped to 10T; maximum click created one 10T personal position, then disabled further investment. Switching to a family with $10B treasury clamped input/max button to $10B.
- Browser screenshot: `art/investment-limit-1251.png` (local review artifact, not distributed).
- Existing ordinary bot investment and Luca knowledge/locale coverage tests pass; no new mutation routes introduced.
- Live player database was not used for testing.

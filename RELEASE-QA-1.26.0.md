# Release 1.26.0

## Collection and vehicle review

- Sixty purchasable car models and ten individually owned six-bay garages. Nine new cars include eight exclusives. New garage and car illustrations have original PNGs and smaller WebP delivery copies.
- Reviewed personal car, helicopter, jet, yacht and family car catalog prices. Examples: RS7 $12m, RS Q8 $18m, 300 SL Roadster $35m, 250 GTO $450m. Rarity and performance are separate considerations. These are fictional game prices.
- The final exclusive lineup uses the T.50, Solus GT, Valkyrie, CC850, Aspark Owl, Venom F5 Revolution Roadster, Czinger 21C and Boat Tail. The Owl, Venom and Czinger replace unpublished Codalunga/Droptail/La Voiture Noire drafts to reduce resemblance to existing models. No existing player-owned car IDs are removed.
- Car crime rewards scale additively with price and retain the existing collection cap. Exclusive models add energy capacity and shorter crime cooldowns. Energy convenience never falls along the reviewed price order. Yachts add stronger reward, cooldown and energy perks without passive rent. The largest yacht costs $15b and supplies +4.14% crime rewards, 2.6% shorter cooldowns and 80 energy capacity before global caps.
- Existing recorded purchase costs remain the basis for 80% car resale. Price changes do not rewrite cash-flow receipts or auction bids.

## Wars, production and outcomes

- City ownership permits 25 purchased plus 10 conquered plots, 35 total. Aggregate storage no longer imposes the old world-wide type cap. Purchases price repeated copies within the city. Staff map edits enforce city limits too.
- Capture attempts have 15-minute city cooldowns, one success per rolling 24 hours per city and a 24-hour city recovery shield after a loss. Existing legacy cooldowns migrate once. Shared attack/recovery cooldowns are 15 minutes.
- Relative Power has a bounded logarithmic effect, with defenses and map position still relevant. Failed attacks award neither side war or season points. Successful attacks retain their activity points.
- Personal and family cargo in transit occupies neither local production slots, local warehouse capacity nor the local per-drug crate allowance. Deliveries remain accessible even if new local production fills the warehouse; further production is blocked until stock is sold or dispatched. No cargo is discarded.
- All art and antique catalog/appraisal values are revalued. Existing object valuation migration runs once without changing bids or receipts. Successful cooldowns remain 1/2/4/6 hours; failed cooldowns are 5/10/20/30 minutes. Genuine final-pool pieces have billion-dollar valuations, with authenticity and condition still relevant.
- Backfire grows much more slowly: approximately 1.4% at 489 rounds and 19.8% at 10,000. Higher ammunition remains better but does not guarantee retaliation.
- Arrest notifications carry their custody identifier; direct release obtains a fresh quote and uses the existing validated personal cash/bank payment. Custody outcomes and identical recent action notifications are deduplicated. Release requests suppress the redundant generic outcome popup.

## Validation

- Full isolated suite after the final three model substitutions: 459 passed, zero failed. Final run recorded in `.preview-portfolio-review/release1260-final.log`.
- Six additional regression tests cover price/perk ordering, collection capacity and art files, low-round backfire and relative-Power odds, personal/family transit capacity, all four failure cooldowns, once-only art migration and quoted single-use bail.
- Existing city tests now exercise 25 purchases plus ten captures, independent city limits, restart persistence, authority and rollback. Existing economy/security/escrow/replay/custody tests remain enabled.
- All four language audits have zero missing controlled UI, rulebook, catalog, validation, generated-message, release and guide keys. Perk descriptions now interpolate localized strings rather than mixing English into translated cards.
- Actual production `server.js` recursive HTTP module graph test passed. No permissive preview server substitutes for that check.
- Desktop and 390×844 mobile preview: inspected collection card layout, complete large prices, responsive images and localized exclusive perks. Used an in-memory fixture; no live database was tested or reset.
- Bots use the live catalog and normal validated purchases. Production callers exclude in-transit stock; capture callers consume per-city counters and cooldowns. Luca indexes authoritative catalogs and updated rulebook, and reads per-city live capture state in native Dutch/English with localized replies. Bot/guide and multi-language scenario tests passed.
- Midnight Circuit performance remains separate from price; new hypercars are classified explicitly. Existing tuning limits are unchanged. A future tuning extension should use class-bounded modules and include installed performance in matchmaking, rather than add unrestricted raw levels.
- Real device push remains paused.

## Local/deployment use

Run `npm ci`, then `npm start` from the game directory. Run `npm test` for the isolated suite. Preserve the server's existing data directory and environment when deploying; restart the process/container. `/api/health` must report version `1.26.0` and build `2026-10-23-release-1.26.0`.

# 1.30.0 implementation and verification

## Behavior
- Personal passive cash accrues into pending_income and is never collected by ordinary settlement, purchases or navigation. Explicit income/claim alone transfers it to cash. Existing 24 active hour cap, custody pauses and full-wallet preservation remain.
- Deterministic purchases, respect and predictable claims have no generic outcome dialog. Risky operations retain results. Arrest release acknowledges related notices, removes queued stale results and suppresses a redundant self-release popup. Big Score has a dedicated gold celebration and achievement emblem.
- Persistent account-scoped unread counts for private messages, world chat and current family chat; server-validated read receipts cannot acknowledge future message IDs or another family. Muted/blocked public/family messages are excluded. Announcements use existing news_seen receipts.
- Current release snapshot replaces superseded public dispatches once; first welcome is preserved, events stay separate. Historical release notes are retained in source. The visible snapshot contains only current mechanics, with new future releases remaining separate.
- Drug batches and detailed route controls live inside their product cards; stock and available affordable capacity are visible. Production trade details and recorded sales are collapsible.
- Business policies/results live in each corresponding owned business card. Garage contents and warehouse collections are nested in storage cards; re-sorting does not duplicate contents.
- Separate Edit family page, overview/statistics immediately after the family banner, no duplicate family holdings gallery. Navigation order updated; rank information moved under Help and respect ranks collapsed, with recorded given/received history.
- Art availability settles current energy/health without collecting passive cash, refreshes after cooldown and offers manual Refresh; a regression test verifies that regenerated energy unblocks a heist while pending income stays saved.
- Leading auction bids highlighted; active investments precede the opening form; current airport city has no price label. Profile cover less faded; VIP illustration preserved; smaller centered footer signatures.
- Boat Tail ID is retained for purchase/tuning/receipt compatibility, with display model and illustration replaced by Bugatti La Voiture Noire. New original plus optimized WebP installed.

## Verification
- Final full isolated suite with bounded test concurrency: 502 passed, zero failures/cancellations. An earlier unlimited parallel run exceeded the HTTP parent timeout under CPU contention; the bounded rerun passed, including production HTTP graph and complete artwork delivery.
- Subsequent focused behavior/Luca/navigation/UI suites passed; latest behavior test also covers muted message counts. Four language audits report no missing entries.
- Browser fixture: art requirements visible; failed heist -> arrest -> immediate bail -> no duplicate dialog; forced Big Score displays emblem; business purchase opens zero dialogs; policy controls in the business tile; garage sorting leaves one nested collection; family settings on separate page; family/world unread counters clear after reading.
- Mobile width 390: document width 390, batches belong to product cards, no duplicate freight batch cards.
- New read-receipt route has an autonomous caller and GET unread is classified. Luca uses the shared updated rules and navigation plus the live catalog. Device push remains paused.

The local owner record was inspected read-only, and is explicitly not the hosted account. Local art eligibility: first three heists meet requirements; fourth requires 1,500,000 XP. No real account data was changed by tests. All mutations and UI test data use disposable in-memory fixtures. Screenshots use fixture balances and names.

The public hosted health endpoint reported version 1.29.3 before this upload. The user reports 999,000,000,000 ordinary XP on that hosted account; a dedicated isolated regression confirms that this balance passes every art XP requirement without overflow. The precise live blocker cannot be inferred from the different local starter account. Deployment is required to load the new diagnostics and refresh fixes.

Story concept remains deferred in FUTURE-WORK.md. Prepared for GitHub main release 1.30.0.

# Shop, season prizes and account security

Implemented 11 October 2026. All player-facing screens remain English.

## Proposed shop catalog

| Product | EUR | Permanent unlocks |
| --- | ---: | --- |
| Champagne Gold | 2.99 | Champagne profile color |
| Midnight Blue | 2.99 | Midnight profile color |
| Velvet Plum | 2.99 | Velvet profile color |
| Golden Laurel | 3.99 | Golden avatar frame |
| Platinum Frame | 3.99 | Platinum avatar frame |
| Art Deco Frame | 3.99 | Art Deco avatar frame |
| Signature Titles | 4.99 | Patron of the City, Midnight Aristocrat, Velvet Society |
| City Patron Pack | 7.99 | Champagne color, golden frame, Patron title |
| Midnight Society Pack | 7.99 | Midnight color, platinum frame, Midnight title |
| Velvet Collection Pack | 7.99 | Velvet color, Art Deco frame, Velvet title |
| The Complete Collection | 19.99 | All nine cosmetic unlocks |

These are proposed launch prices, not active payment offers. No season pass, subscriptions, cash, XP, weapons or Power are sold. Unlocks are permanent; overlapping products do not duplicate items. Equip unlocked cosmetics in My profile → Customize your profile. This is a new catalog because the previous suggested catalog was not available.

Owner and Admin can use their panel → Shop gifts & grant log to select a player, product and reason. Self-grants work. Admin can also grant cosmetics to the Owner under this specifically authorized shop exception; the normal Owner account-editing restriction remains. Server role checks, transactional entitlements, duplicate-request keys and grant/audit logs enforce this. Authority applies to all accounts with either role, as requested, not to a username comparison with MrGadget.

## PayPal status

Checkout is disabled, both in the interface and on the server. No real funds are requested or transferred. The intended recipient supplied by the Owner is jeffreyberwald@live.com / @jberwald, but an email or handle is not sufficient to configure verified automatic delivery.

A later integration requires the merchant's PayPal client ID and secret, sandbox testing, server-created orders from this fixed catalog, currency/amount/payee validation, server capture confirmation, verified webhook processing and an idempotent order ledger with refund/reversal handling. Secrets must stay outside public files and the staff settings API. Do not enable delivery based on a return URL, browser-submitted price, screenshot or PayPal.Me claim. Tax presentation and purchase terms must be decided before taking payments. The current implementation deliberately contains no pretend checkout or unverified payment callback.

Official integration references: [PayPal client credentials](https://www.paypal.com/us/cshelp/article/how-do-i-obtain-a-client-id-if-i%E2%80%99m-a-developer-integrating-paypal-for-a-merchant-ts2182), [Checkout integration](https://developer.paypal.com/checkout/integrate), [webhooks](https://developer.paypal.com/payment-methods/webhooks/).

## Family seasons

Seasons last exactly 28 days. Startup and a one-minute server timer settle overdue seasons, including downtime catch-up. The Family seasons page also settles before reading. An automatic event recaps the previous season and announces the next; it appears on Announcements & events and triggers one notification per player. Publication waits until an active Owner exists. System season messages cannot be edited through the manual announcement editor.

First, second and third receive $100m/$50m/$25m in treasury prize money and 100/60/30 family respect. At least one season point is required. Equal scores share the rank and split the pool for the occupied places: two joint winners each receive $75m and 80 respect; third remains eligible for $25m/30. Integer remainders are distributed by ascending family ID. Permanent assets, money and XP do not reset. Prizes do not retroactively apply to seasons archived before this update.

The family medal and Reigning Champions / Silver Dynasty / Bronze Alliance title apply through the entire next season and then expire. Trophy history and respect remain permanently. Prize cash is recorded once and paid within the $1 trillion treasury limit; overflow remains in the award ledger and automatically fills available treasury space on later checks. History shows prize amounts, respect and pending status. The current medal is visible beside family names in My family, profiles, rankings and rival cards.

## Security changes and deployment boundaries

- New and reset passwords require 15–128 characters; no forced composition rules. New hashes use salted scrypt N=65,536, r=8, p=2. Legacy hashes are accepted and upgraded after successful sign-in. Malformed hashes fail authentication instead of crashing.
- Login and registration password work is asynchronous, with at most two concurrent expensive jobs. Additional jobs receive HTTP 429; admin password resets remain bounded, privileged synchronous operations.
- Persistent limits: 10 login attempts per account per 15 minutes; 50 per network address per 15 minutes; 10 registration attempts per network address per hour. Successful authentication resets the account counter. Username/email aliases resolve to the same account counter. Restarting does not clear limits; responses include Retry-After. Network keys are hashed; logs never store passwords or session tokens.
- Session cookies are HttpOnly and SameSite=Lax; Secure in production. Sign-in rotates the presenting cookie, expired sessions are removed when issuing a session, and at most five sessions remain per account. Password changes revoke all old sessions; My profile also offers sign-out everywhere. Existing admin resets, bans and permission edits revoke sessions.
- All POSTs require JSON, a matching Origin when supplied, and reject cross-site Fetch Metadata. There are no permissive CORS headers. PUBLIC_ORIGIN can pin the expected browser origin. CSP blocks external scripts, frames and form destinations; MIME sniffing, camera, microphone and geolocation are disabled. Production sends HSTS. Requests are size-limited with HTTP header/request timeouts.
- Owner/Admin security viewer shows the latest 100 account events. Public registration cannot choose staff authority. Normal Admin protection of Owner accounts is retained.
- Port-in-use errors now explain how to reuse or stop the existing server instead of an unhandled event stack trace.

This is a targeted hardening update, not an assurance that every vulnerability has been eliminated. Remaining production work includes email ownership verification, recovery flows, staff MFA, suspicious-session detection, perimeter rate limiting, retention/monitoring and an independent security assessment. Network limits use the socket address and intentionally ignore spoofable forwarded headers; a reverse-proxy deployment must configure an appropriate trusted-proxy/perimeter design so all players do not share one proxy limit. Use HTTPS with NODE_ENV=production and an exact PUBLIC_ORIGIN. Do not expose the development server as a public production service without that deployment work.

Security reference: [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

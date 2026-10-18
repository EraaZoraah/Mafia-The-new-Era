> Current status (1.18.3): device push is paused by user request. Do not activate or provision real delivery yet. The configuration below is historical setup guidance for a future explicitly requested activation; `PUSH_ENABLED=true` will also be required. In-game notices remain active.

> Historical 1.17.0 document: the referral proposal below was implemented and superseded by [REFERRAL-BETA.md](REFERRAL-BETA.md) in 1.18.0.

# Art heists, notifications and referral proposal — 1.17.0

## Implemented

Art & antiquities is under Crimes & missions; Auction house remains under Finances. Four heists draw from disjoint, ascending catalog-value pools of 7 / 6 / 6 / 6 objects. Each success grants exactly one unique serial. Within a pool weights halve with each step: the highest-value item is rarest. The last pool has 50.8%, 25.4%, 12.7%, 6.3%, 3.2% and 1.6% conditional loot odds. Failure, required XP, ammunition, weapon tier, costs and cooldowns are enforced on the server.

The new Sovereign Collection costs $3,000,000, 90 energy and 900 rounds; requires 1,500,000 XP and a tier-3 weapon, with a six-hour shared art cooldown. Its base chance is 32% plus the existing capped XP adjustment. Successful XP is calculated using the existing account reward bonus. Its dedicated artwork is `public/images/art-heist-treasury.png` (generated October 17).

Success feedback displays the actual object's image, name, condition and unverified condition-based reference estimate. Authenticity is still hidden until paid appraisal. This estimate is not a guaranteed auction return. The Sovereign Curator capstone requires personally stealing Diamond Phoenix (most valuable artwork, including sculpture) and Platinum Crown (most valuable antique), then confirming both as originals. Auction purchases do not count. Provenance is durable across sales; legacy provenance is recovered only from exact saved heist receipts, not guessed from current ownership. Reset clears provenance.

Bots read the four live heist cards and use ordinary costs and validation. Luca reads the same catalog and current player eligibility/cooldown, with English/Dutch capstone guidance. Browser-device push settings are deliberately not automated by bots.

## Optional real Web Push

Dashboard has per-device opt-ins for personal attack alerts, family hostility and a passive-income reminder at 23 active hours, once per income-claim cycle. Custody time is excluded; players without passive earners are not warned. Delivery uses a persistent queue and a one-minute worker. Banned accounts are skipped; expired endpoints are removed. Payloads are generic and omit player cash, attacker identity and other sensitive details. Notifications open Dashboard or My family.

The app does not request browser permission automatically. The player must click Enable. Browser/OS policies can delay or suppress delivery; this is not an emergency alert service. iOS may require installing the game on the home screen. A public installation needs HTTPS. Localhost is a secure-context exception where supported.

Run `npm ci` after installing this update (Node 22+); Web Push uses `web-push` with the committed lockfile. Configure persistent VAPID keys in the hosting provider's secrets/environment before launching Node. Do not commit or share the private key, and preserve it across deployments:

```powershell
node --input-type=module -e "import {generatePushKeys} from './push-notifications.js'; console.log(generatePushKeys())"
$env:VAPID_PUBLIC_KEY='<publicKey from the command>'
$env:VAPID_PRIVATE_KEY='<privateKey from the command>'
$env:VAPID_SUBJECT='https://your-actual-game-domain.example'
npm start
```

The example subject is a placeholder; use your actual HTTPS site or a valid administrator mailto contact. With missing configuration the UI explicitly says push is not configured; gameplay remains available. Keep normal in-game notifications enabled as the authoritative record. Real external push delivery has not been tested without a configured real server and consenting browser subscription; queue, preferences, filtering, expiry and custody timing are tested with an isolated transport stub. Real VAPID signing and aes128gcm payload encryption are also verified locally without sending to an external device.

## Referral proposal — not implemented

At registration, an optional existing friend's username fixes a single referrer permanently. Award a proposed $5,000,000 to the referrer only after that new human player reaches rank 5, plays on three distinct days and completes meaningful activity. Do not reward mere account creation. After five qualifying friends, award 30 days of Grand Supporter membership once; do not repeat its purchase cash/XP grant. Extend an existing Grand Supporter subscription rather than overwrite it. Clarify upgrades from active Supporter before launch.

Exclude bots, staff/test accounts, reciprocal loops and self-referrals. Rate-limit referral creation, record all eligibility/reward decisions and use suspicious overlap as a staff-review signal, not an automatic ban on households. Email verification is not configured, so do not claim it currently proves distinct humans. Allow staff review before the premium milestone payout until anti-abuse behavior is understood. No referral payments or account-registration changes have been activated in this update.

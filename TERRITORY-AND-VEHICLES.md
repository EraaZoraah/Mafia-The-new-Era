# City control, warehouses and vehicle collections

Build: `2026-10-16-territory-vehicles-1`, 16 October 2026.

The later `2026-10-16-bot-autonomy-1` build expands autonomous gameplay beyond the bot strategy subset described below. See BOT-AUTONOMY-AND-LUCA.md for the current bot scope and assistant changes.

## Geographic territories
All fifteen airport cities now have unique geographic urban footprints, subdivided into 40–60 fictional game parcels. Large cells represent districts/harbor areas; smaller cells represent blocks. Geographic data is historical and approximate, not current municipal/official district boundaries. See GEOGRAPHY-NOTICE.md and GEOGRAPHY-LICENSE.txt for the Apache-2.0 source and transformations. There is no map service, tile account, tracking provider or recurring map API fee.

Unclaimed land has neutral fill; your family is gold, allies green, rivals red. Hover/focus highlights plots; mouse, keyboard and selector interactions open the inspector. Free plots can be bought; allied plots expose no hostile action. Existing war/Don/Capo requirements remain.

A capture costs $2.5 million, 45 energy and 75 family rounds, on success or failure. This is much less than land purchase prices. Shared raid cooldowns still apply, plus a one-hour capture-attempt cooldown. One successful capture per rolling 24 hours. The defeated family gets a separate 24-hour protection against further territory captures. No client timer can bypass these restrictions.

At most ten currently conquered territories can be held worldwide. Ownership transfers update the provenance flag and aggregate family assets in the same transaction. Losing a conquered plot immediately frees a slot. Original caps remain: buy while below twenty holdings per city; thirty total holdings per city; twenty-five of each territory type worldwide.

Capture chance uses relative family Power, raid defense and geographical foothold factors, bounded 1–55%. Stronger defenders reduce it. The client and server share the same formula; resources and authorization are checked only by the server. A strong attacker never gets a guaranteed capture.

Migration preserves owned legacy land and reconciles it with family assets. Owned high-slot parcels are moved into free normal slots where possible; unowned excess slots are removed. An already completely overfilled legacy city can retain inspectable legacy entries beyond the standard geographic grid rather than silently destroy paid holdings. Fresh cities have the listed 40–60 counts.

## Vehicles and garages
Car theft recovers one specific vehicle, with no duplicate normal crime cash on success. Thirty models range from a Dacia Sandero to a Bugatti Chiron. About 90.30% of the draw weight is cars with base value below $100,000; the three models above $10 million jointly represent about 0.1683%. These are fictional game values, not real car valuations.

The success popup shows the actual recovered car, live sale quote and XP, plus Sell now and Store buttons. A full warehouse offers an owned stored car to sell and replace atomically. A pending vehicle persists across reloads; another theft is blocked until resolved. The warehouse page is an alternative place to make the decision. Big Score triples vehicle value and XP; the multiplier remains attached through storage and resale. Failed thefts retain the ordinary crime failure/fine rules.

Vehicle warehouses start at $7.5 million, twenty bays each, five maximum. Later copies use ordinary increasing acquisition prices. The warehouse page supports quantities/Buy MAX. Vehicle sale quotes change by city and hour. Unsold recovered vehicles also count towards personal asset value/count and the wealth rankings; their value comes from the same server quote function. Boat/plane/connected-region truck shipments have quoted fee, duration and 1.5–4% interception risk. In-transit cars reserve bays. Intercepted cars and fees are lost; delivery/interception creates an in-game notification when inventory next settles. Interception outcomes are hidden until arrival. Server ownership, retry/replay, custody, wallet-overflow and stock-state validation prevents duplicate sales or transfers.

Purchased cars are separate. Each model is limited to one and needs a free six-bay private garage. Five garage types provide thirty bays, enough for all twenty-six purchased models. Four new garage illustrations accompany the expanded selection. Audi RS7 Sportback and black Audi RS Q8 have dedicated new artwork. No Buy MAX for single-copy cars/garages.

Purchased cars appear inside garage collections, not as loose cards in My possessions. Recorded purchase basis is retained and resale pays 80%. Older cars without a historical receipt use catalog base price as their initial migration basis. Cars acquired before garage requirements are retained as an unassigned legacy collection until enough garages are purchased; they can also be sold. Staff asset grants/deletions reconcile garage placement on the next inventory view.

## Production warehouses
Production warehouses start at $15 million and each add 1,000 total unsold crates, shared across drug types. Five maximum give 5,000 crates, enough for 1,000 of each of the five drugs. Producing, ready and in-transit cargo all occupy capacity until sold or settled as intercepted. The existing per-drug 1,000 limit and five occupied-batch slots remain. Personal production requires personal warehouses; family production uses its own warehouse entry under Safehouses, bought by Don/Capo from treasury. Old batches are retained even above current capacity; new batches require available space.

Warehouses cannot masquerade as ordinary garages for car-operation unlocks. Warehouses and private garages grant storage utility, not new passive income. Local Luca knowledge reads the new catalog, vehicle collection and rulebook entries. Market advice accounts for missing/full production storage.

## Bots
Fifty additional named bots were added to the local project database with the additive, idempotent script. Owner account verified unchanged; full backup created before the addition. No existing account or family was reset. Each starts with standard $5,000 and zero XP. Five personalities and activity levels 40–150 vary session duration, action intervals and time offline. Existing bot pause/enable settings are respected.

The bot controller continues to call ordinary game handlers: costs, gear, custody, cooldowns and permissions are not bypassed. Its purchase limits now follow live item limits. It resolves stolen cars, buys needed production warehouses and respects purchased-car parking. Territorial acquisition is possible through the normal map purchase route. Tests exercise all fifty new accounts and the existing mixed-strategy controller without internal errors.

This is autonomous selected-strategy play, not a claim that every player feature is individually automated. Free-form conversations, staff tools, support-ticket creation and real-money checkout are not automated. The bot character badge remains visible.

The ZIP does not contain a database. To add the same wave to a separate hosted database, deploy code, stop the running Node process, then from the game directory run:

    node scripts/add-bot-wave.js --apply
    npm start

The marker prevents a second addition. Running the script without --apply only previews. Do not run reset-bot-world.js for this update.

## Verification and deployment
Regression logs: art/territory-vehicles-final-tests.log and art/territory-vehicle-http-tests.log. All 232 checks passed: 203 serial regression checks plus 29 isolated HTTP checks. The HTTP baseline was rerun separately after a test-environment timeout. New tests cover parking, 80% resale, storage, swaps, transit, shared production capacity, provenance counts, shields, attempt/daily cooldowns, allies and all fifty new bots. Isolated HTTP test checks SQLite integrity, authentication, quantities and locally served images. Browser walkthrough used a disposable EmpirePreview database, not the real player database; theft, popup storage, garage contents, map interaction and ally restrictions were checked. Popup also checked at 390px with no horizontal overflow.

Art: 39 generated raster assets, built-in image_gen, saved in public/images. Prompt/asset manifest: art/territory-vehicles-art.json. Contact sheets: art/vehicle-warehouse-contact.jpg and art/garage-extension-contact.jpg. The interface audit reports no missing icons or page banners and no unintended duplicate page art. The personal/family armory banner remains an intentional shared image.

Deploy the full archive, preserve data/ and environment configuration, restart Node, and verify /api/health returns this build. Back up the live database first. Map and storage schemas migrate at startup. No remote host was updated by this task. The earlier Dutch translation remains in progress and disabled; new interface copy is English.

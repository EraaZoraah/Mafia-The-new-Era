# Police offers and territory presentation

Build: `2026-10-16-police-bribes-1`.

Failed crimes, contact assignments and failed rescue missions that cause prison have a 30% chance of a police offer. The offer lasts up to 90 seconds. Custody starts immediately; only a successful server-side payment releases that specific sentence. Closing, refusing or ignoring an offer never cancels prison. Reports purchased by another player and coma treatment do not generate offers.

The cash quote uses 12% of the activity reference payout plus $2,500 per normal rank level, capped at 65% of that sentence's initial bail. The existing rank-scaled bail calculation supplies the cap. No bank withdrawal, XP award or additional loot accompanies bribery. Prices are immutable during the offer. Repeated payment requests debit once. Replaced sentences and expired offers cannot be released by an old quote.

Bots use the same endpoints, accepting affordable offers or refusing expensive ones. Luca knows the rule and reads each player's current offer and resources. The illustrated dialog uses dedicated police-bribe artwork.

The full-width city atlas now has brass borders, a cartographic grid, an ownership legend with live counts and distinct gold, green, red and neutral parcels. Territory prices and capture rules are unchanged. Desktop and 390px mobile views were reviewed; the mobile page has no horizontal overflow.

## Validation

- 222 non-HTTP tests and 29 isolated HTTP tests passed.
- Browser preview: police offer displayed, payment deducted exactly the quote and removed prison restrictions.
- Payment ownership, quote tampering, repeated requests, insufficient funds, expiry and replacement custody are covered in automated tests.
- Test databases and the preview account are separate from real player data.

## Art and antiques proposal — not implemented

An Art & Antiquities network could combine rare heist rewards, appraisals and timed auctions. Give every object a unique serial number, provenance, rarity and condition. Collections could unlock cosmetic titles and museum-room displays. A fixed schedule could auction a limited number of objects automatically, using escrowed bids, a minimum increment and a short anti-sniping extension. Charge an auction commission and appraisal costs; use pre-funded demand rather than unlimited NPC money creation. A forgery risk could make appraisal meaningful without allowing real player descriptions to misrepresent an item. Separate collectible ownership from ordinary passive-income assets.

## Run locally

From the directory containing package.json, run `npm start`. Restart Node after installing this update and reload the browser. Preserve data/ and local environment configuration when deploying. No remote server was changed.


Art-trade proposal status: subsequently implemented. See ART-COLLECTORS-AND-DUTCH.md for the released mechanics.

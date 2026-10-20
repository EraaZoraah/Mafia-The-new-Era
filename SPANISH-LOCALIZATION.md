# Spanish localization · 1.20.0

English remains the default. The flag menu above Log out now enables Spanish (ES) as well as Dutch (NL). Version 1.21.0 also enables French (FR) and German (DE). Selection persists on the device; authenticated heartbeats record the last reported language for Owner-only aggregate statistics.

`public/es.js` contains the static Spanish resources. Catalog identities, route IDs, numeric DTO fields, saved accounts and player-authored messages/bios are never rewritten. Rank names remain unchanged; dollars and English numeric punctuation are retained. Generated system results translate only controlled slots. Staff-authored announcements are preserved.

Luca recognizes Spanish questions through `guide-es.js` and uses the same English advice/quote paths and account restrictions. His shared knowledge index supports Spanish. Advice is generated locally: no runtime translation or AI service, keys or fees were added. Initial drafts were machine-assisted; core navigation, game terminology, numeric/placeholder integrity and live advice were checked and corrected. Text baked into existing decorative artwork is not changed.

Maintenance checks:

- `node scripts/prepare-localization.mjs`
- `node scripts/audit-language-coverage.mjs`
- `node scripts/audit-language-coverage.mjs --es`
- `node --test test/spanish.test.js test/localization-templates.test.js test/dutch-data.test.js`
- `npm test`

Both language audits fail on missing keys. CI runs all four language audits; the Spanish tests also require matching placeholders, preserved ranks/private content, translated live DTOs and Luca quotes/custody behavior. Future features must add resources to all four non-English dictionaries and extend Spanish topic recognition when a new gameplay domain is introduced. Development translation drafts in art/spanish are local and are not game assets.

For French/German run the audit with `--fr` and `--de`, plus `test/french-german.test.js`. Luca uses the shared local adapter in `guide-locales.js`.

# Dutch localization

English is the default. Dutch is now selectable above Log out. French, German and Spanish show Coming soon. Ranks and player-authored names, biographies, messages, tickets and announcements retain their original text. Currency and numerical punctuation stay unchanged, including dollars and English thousands separators.

Localization is explicit: controlled HTML templates are translated before player values are interpolated. API catalog fields require matching canonical identifiers and authored text. Generated game results use bounded deterministic pattern matching, not general DOM replacement. Trusted system announcements have provenance metadata; staff-authored content is not machine-translated.

Run `node scripts/build-rulebook-nl.mjs`, `node scripts/build-locale-catalog.mjs`, `node scripts/extract-generated-language.mjs`, `node scripts/prepare-localization.mjs` and `node scripts/audit-language-coverage.mjs` after changing content. Review new translations, run tests and inspect changed screens in both languages. The audit covers controlled UI, all 44 rule chapters, catalog descriptions/labels, literal validation, generated results, changelogs and shared Luca facts. User content and proper vehicle/model names are deliberately outside translation.

Luca has a dedicated Dutch account-advice implementation and reads the same catalogs, rules and live quotes as the English guide. Tests cover new content, locked/unaffordable activities, custody, warehouse constraints, art and condition/auction rules. Browser review included the dashboard, language selector, art market, vehicle collection and auction feedback on desktop and mobile. Additional reports of missed wording should be fixed as explicit dictionary keys.

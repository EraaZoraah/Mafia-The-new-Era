# Mobile localization and profile review

- Applied hidden page/drawer scrollbar tracks without disabling scrolling. The toggle joins the drawer's outside edge, at the same measured x coordinate on desktop and mobile.
- Each header metric now has a separate translated label and value. Shared mobile headings, buttons, forms and card containers wrap longer content instead of clipping it.
- Browser review opened all 61 menu destinations in EN, NL, FR, DE and ES at 390px: 305 combinations. No document horizontal overflow or clipped visible headings, paragraphs or action-button text was detected. Horizontally scrollable tables were excluded from text-clipping checks. This is a render/layout check in one isolated test world, not every data state, popup or action combination.
- At 320px, all six header metrics fit in every language, including energy overflow. Currency, punctuation and rank names are unchanged.
- Profile inspection confirmed exactly one online dot inside the profile, a gold family name and no repeated Legacy labels beside the medal collection.
- 200 legacy seals now contain only their level number. The 38 achievement seals retain their individual symbols inside the same gold treatment. Generator output is idempotent for existing achievement artwork.
- New wedding proposals quote $50,000,000. Acceptance charges the recorded proposal price once; the 10% bonus is unchanged. Existing already-quoted proposals retain their recorded price. Rules and their four translations are aligned with the current new-proposal price; Luca indexes those rules and bots read the live marriage quote.
- No live database was changed. No GitHub upload was requested in this update.


## 1.24.0 table regression review

The screenshots exposed that overflow-wrap:anywhere was compressing mobile table words into narrow vertical columns. Tables now use intrinsic column widths and nowrap cells inside .tablewrap. The shared sorter also wraps tables lacking a scroll container.

At 390px: all 61 main pages reviewed in English; 14 contained tables. All 14 table-bearing pages were checked again in Dutch, Spanish, French and German (56 additional page checks). No document-level horizontal overflow or unwrapped/break-anywhere table cells were found in these fixture states. The player directory was physically scrolled horizontally and moved within the table while the page stayed 390px wide. This does not imply every populated staff subpanel or popup was manually exercised; the shared wrapper/style applies to them too.

Evidence: art/mobile-table-audit.json, art/mobile-table-locales-audit.json. Local screenshots: mobile-table-readable.png, premium-crypto-coins.png, drug-best-choice-mobile.png, updates-catchup-announcement.png.

# Mafia: The New Era 1.19.5

19 October 2026.

- Profile editing is a dedicated screen containing appearance controls and account security. Public statistics, possessions and achievements remain on the normal profile. Emblems are graphical radio choices, including the faceted Diamond.
- Silver/gold membership gems use explicit-size SVG image assets. Own-account membership and freshly loaded profile membership take precedence over stale presence responses; newer server expiry responses still remove expired badges.
- Initial page renderers request current artwork. The banner observer attaches before asynchronous page work and replaces stale image nodes rather than allowing their decoded old image to remain while loading. Forty-five unused overview images were retired; runtime references were checked. Functional notification illustrations, current auth art and catalog item images remain.
- Temporary VIP protection has dedicated artwork and gold action buttons. Family identity uses a refined serif nameplate, layered gold border and profile-style fade. Rival-family and airport introductions sit outside the banner. Territory backdrops fade further; the sidebar logo is larger.
- Single-item purchase controls retain accurate role, affordability and ownership explanations. Safehouse acquisition with family funds and its one-item limit are verified. Investment refresh is a labeled standard button.
- Lottery cap is 10,000 tickets per player per draw, shared by server quotes, validation, UI MAX and Luca. Existing price, settlement and payout rules are unchanged. Blackjack/roulette forms remain outside hidden result panels; results and animations still share the selected game.
- Column sorting is available for player/family/ranking tables and staff views, including bot lists and economy activities. Public directory and staff population sort across all matching rows before pagination. Numeric money and rank values sort numerically. Family directories retain crests in a table layout. Admin can read bot/economy views; global bot pause/resume remains Owner-only, and Owner account edit protection is unchanged.
- Premium shop has a dedicated boutique banner; Energy, XP & cash follows Supporter memberships.
- Autonomous public/family chat posting is disabled in both scheduling paths and at the bot action boundary. Private-message behavior remains. Capability boundaries and the current rulebook/Luca explain this restriction.
- Validation: full isolated suite 372 passed; two additional cached-image/membership regressions passed separately. Focused tests cover all new lottery caps, replay protection, safehouse limits, staff/public sorting and permissions, bot boundaries and EN/NL guide facts. Language audit reports zero missing entries. Real browser checks used disposable accounts for profile editor, gems, casino controls, safehouses, family/rival/airport/shop layouts and public/staff sorting.

Existing live accounts and databases were not modified. Real device push remains paused. Release to GitHub main uses the existing deployment workflow and versioned image 1.19.5.

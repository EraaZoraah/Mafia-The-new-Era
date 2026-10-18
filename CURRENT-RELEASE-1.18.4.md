# 1.18.4 — opening-page readability

Restore the gradient fade on the public opening page (before sign-in). One background photo fills the hero without repeating. The heading and text have brighter foreground colors. Login and registration artwork are unchanged; in-game page banners are unchanged.

Cause: a later background-image-only override removed the gradient while inheriting the first layer background sizing from a two-layer declaration. A complete scoped background declaration now specifies gradient, photo, cover sizing and no-repeat together.

Browser verification: one image URL, no-repeat on both gradient/photo layers, cover sizing and a visible fade. Screenshot: art/opening-page-fade-desktop.png. Eight targeted bot/guide/news tests and the Dutch coverage audit pass. No gameplay rules or bot/Luca mechanics changed.

The 1.18.3 income cap, FAQ/Luca corrections and deferred push settings remain in effect. See CURRENT-RELEASE-1.18.3.md and FUTURE-WORK.md.

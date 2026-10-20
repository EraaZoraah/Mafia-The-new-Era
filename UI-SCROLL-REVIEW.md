# Interface and scroll review - 1.22.0

The approved premium panels, typography, logo fade, asset cards and paired straight menu lines with soft gaps are applied through public/premium-theme.css. Fine panel outlines, paired fading inlays and a restrained black/Bordeaux background are now applied. Shared action buttons have consistent polished champagne and distinct danger styles, keyboard focus and reduced-motion states. Page banners remain unchanged. Removed the gold padding/border from navigation-card wrappers so buttons have only their own 1px outline. Screenshot: art/premium-thin-buttons.png.

## Scroll handling

Shared capture/restore handles same-page buttons, form submits and selects, content replacement and later image loads. Manual wheel/touch/keyboard scrolling, scrollbar dragging, navigation links and explicit destinations take priority. The original offset survives a temporarily empty/short document. Sessions expire after 30 seconds. Replay/editor navigation remains intentional. Family editor Save no longer repeats its initial scroll-to-editor; Midnight Circuit no longer automatically jumps to its stage after each action.

Browser review opened all 61 menu destinations in an in-memory Owner fixture without visible render exceptions. This checks page rendering, not every possible button/data combination. Same-page income collection, popup closing, business purchase and Blackjack refresh were measured in the browser. Purchase and its confirmation stayed at scroll Y=720; a Blackjack refresh stayed at Y=1286.4. The 390px asset layout had no horizontal overflow. Unit tests cover delayed content/images, manual scrolling, view changes, expiry and teardown. Full suite: 398 passed. A final focused rerun covers the last restoration efficiency change.

The review found a separate navigation search defect: the clear button could expand to full width and squeeze the input to zero. It now has a fixed 22px flex basis. Browser retry confirmed a usable 162.6px input at desktop size.

## Artwork

294 delivery copies total 78,826,622 bytes versus 741,272,253 original bytes, approximately 89.4% smaller. Originals remain unchanged. WebP quality is 86, maximum 1600px on either side; conversion is not lossless. Mr.Noob and the home banner were visually checked at normal display size without an obvious distracting difference; this is not a claim of pixel identity or a visual review of all 294 images. Clients without WebP receive originals. The HTTP regression verifies MIME negotiation, Vary: Accept and smaller delivery.

Current banner artwork is warmed before replacing a view, with a 1.5-second upper wait to avoid blocking navigation on a slow/missing image. Hovering a navigation destination warms it in advance. Visible/nearby images load eagerly; dimensions reserve banner space. This improves perceived loading and layout stability but cannot guarantee zero loading time on every connection. Original text/ranks/currency and paused push behavior remain intact. Locale audits have no missing keys. Bots/Luca gameplay is unchanged and their regression tests pass.

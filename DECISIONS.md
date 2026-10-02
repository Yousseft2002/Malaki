# fun-rework — decisions

Choices made without asking, during the solo run. ★ = would like the owner's input.

1. **Branch base.** `fun-rework` branches from `boston-localization` (PR #2, not yet merged) so the
   redesign includes the USD / Boston changes. If PR #2 is merged first, `fun-rework` merges cleanly
   on top of `main`.
2. **Motion library.** `motion` (Motion for React) 13.x, MIT. Used only where CSS can't express the
   choreography: pieces entering/leaving the box, cart items animating out, and the gold dot that
   arcs into the bag. Everything else is CSS.
3. **No-JS / reduced-motion safety.** Scroll reveals only hide content once JavaScript has set
   `html[data-js]`, so content is never invisible without JS. Under `prefers-reduced-motion` reveals
   become a plain fade-free appearance and decorative loops are switched off.
4. **Product cards fetch two images** (`take: 2` in the card query) so a second photo can be revealed
   on hover/press. Display-only change; no commerce logic touched.
5. **Collection cards use an overlay link.** The visible title is the one accessible link (44px
   target); an `aria-hidden`, untabbable overlay link makes the whole card tappable. The previous
   stretched-link version accidentally hid the caption behind the image.
6. **Collections are "chapters"** (I, II, III) — numbering is decorative (`aria-hidden`).
7. **Hero caption card links to The Malaki Box** (an existing product) — it names a real product,
   makes no claims.
8. ★ **Gifting tiles now link to the enquiry form with the type preselected** (Weddings / Events /
   Corporate).
9. **Add-to-bag sequence waits for the flight.** The item is added when the gold piece lands
   (~0.65s) so the count bump and drawer follow the animation; instant under reduced motion. The
   role="status" message is unchanged.
10. **Add-to-bag button shows the line total** ("Add to bag | $2.00") so it reads as the page's main
    action. Prices still come from the server when the cart is quoted.
11. **Product "Available" label** reflects stock > 0 only — no stock counts or scarcity claims.
12. ★ **Gift-wrap description** is a placeholder (`[GIFT WRAP DESCRIPTION]`) shown when wrapping is
    free — I didn't want to invent what the wrapping looks like.
13. **Accordions animate to `height: auto`** with `::details-content` + `interpolate-size` where the
    browser supports it (Chrome/Edge today); elsewhere they open instantly, and the content always
    fades/rises in. This is the one place height animates, because opening a section must push the
    content below it down.

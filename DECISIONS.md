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

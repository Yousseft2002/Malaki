# fun-rework — progress

Branch: `fun-rework` (from `boston-localization`). `git push` is blocked in `.claude/settings.json`.
Never push / merge / force-push / delete branches until the owner replies "approved, push it".

## Plan

**Principles.** Visual + interaction layer only. Commerce engine untouched (domain/, orders/,
queries/ logic, Prisma, Stripe, auth). Server components stay server components; only small
interactive islands are client. Palette is fixed (see globals.css tokens). Motion = transform +
opacity; CSS first, Motion (`motion` npm, MIT) only for enter/exit choreography (box pieces,
cart items, fly-to-bag). Every effect degrades under `prefers-reduced-motion` and without JS
(content is never hidden unless JS has run — `html[data-js]` gate).

**Motion system** — `src/components/motion/`: `tokens.ts` (durations, easings, springs, stagger)
mirrored as CSS custom properties in `globals.css`; primitives `Reveal`, `Stagger` (CSS
nth-child), `InteractiveButton` (CSS `.btn-tactile`), `HoverLift` (CSS), `PageIntro` (CSS
keyframes sequence), `AnimatedCounter`, `FloatingMotif`, `AddToBagFeedback`, `MotionProvider`.

**Order of work** (commit after each):

- [ ] 1. Motion foundation: dependency, tokens, CSS utilities, primitives, JS gate, reduced motion
- [ ] 2. Palette audit groundwork: replace off-palette helper hexes (#857a63, #d8ccb0, #d6b45f, #fffdf8, #f3b7a8, white…) with palette + opacity
- [ ] 3. Global delights: gold link underline from centre, tactile buttons, animated StarDivider
- [ ] 4. Header + cart: bag target, count spring bump, drawer spring + staggered items + animated removal, quantity stepper press + number slide
- [ ] 5. Add-to-bag feedback: press → check → gold dot arcs to bag → count bump → drawer
- [ ] 6. Homepage: hero (editorial layout, motif shimmer, staggered intro), section reveals, collection cards, product cards, story arch reveal, build-box steps, gifting, newsletter
- [ ] 7. Product detail: immersive gallery (swipe on mobile, crossfade + zoom on desktop), sticky panel, box-size selector cards, animated price, gift-wrap ribbon preview, live gift-note card, smooth accordions
- [ ] 8. Build-your-own-box signature: visual box, hand-placed pieces, star progress, completion ceremony, mobile pinned preview + bottom sheet, SR announcements
- [ ] 9. Small delights: success page ceremony, 404 empty box, gold skeleton loading states
- [ ] 10. Tests: update flows, add reduced-motion, keyboard, console-error checks; full a11y suite
- [ ] 11. Self-review pass 1 (screenshots 360 / 768 / 1440) + fixes
- [ ] 12. Self-review pass 2 + fixes
- [ ] 13. Quality gate: build, lint, typecheck, unit, integration, e2e, Lighthouse, palette audit, secrets check
- [ ] 14. README "Motion system" section; final screenshots in /preview-screenshots; handoff

## Log

- Safety lock: branch created, push deny rule committed.

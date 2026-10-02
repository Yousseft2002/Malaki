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

- [x] 1. Motion foundation: dependency, tokens, CSS utilities, primitives, JS gate, reduced motion
- [x] 2. Palette audit groundwork: replace off-palette helper hexes (#857a63, #d8ccb0, #d6b45f, #fffdf8, #f3b7a8, white…) with palette + opacity
- [x] 3. Global delights: gold link underline from centre, tactile buttons, animated StarDivider
- [x] 4. Header + cart: bag target, count spring bump, drawer spring + staggered items + animated removal, quantity stepper press + number slide
- [x] 5. Add-to-bag feedback: press → check → gold dot arcs to bag → count bump → drawer
- [x] 6. Homepage: hero (editorial layout, motif shimmer, staggered intro), section reveals, collection cards, product cards, story arch reveal, build-box steps, gifting, newsletter
- [x] 7. Product detail: immersive gallery (swipe on mobile, crossfade + zoom on desktop), sticky panel, box-size selector cards, animated price, gift-wrap ribbon preview, live gift-note card, smooth accordions
- [x] 8. Build-your-own-box signature: visual box, hand-placed pieces, star progress, completion ceremony, mobile pinned preview + bottom sheet, SR announcements
- [x] 9. Small delights: success page ceremony, 404 empty box, gold skeleton loading states
- [x] 10. Tests: update flows, add reduced-motion, keyboard, console-error checks; full a11y suite
- [x] 11. Self-review pass 1 (screenshots 360 / 768 / 1440) + fixes
- [x] 12. Self-review pass 2 + fixes
- [x] 13. Quality gate: build, lint, typecheck, unit, integration, e2e, Lighthouse, palette audit, secrets check
- [x] 14. README "Motion system" section; final screenshots in /preview-screenshots; handoff

## Log

- Safety lock: branch created, push deny rule committed.
- Motion system, palette audit (scripts/palette-audit.mjs), cart animations, homepage done. Screenshot tool: `MSYS_NO_PATHCONV=1 npx tsx scripts/screenshots.mts <dir> [paths]` (dev server on :3000).
- Product page + add-to-bag choreography done (verified in browser: dot flies, count bumps, drawer opens, no console errors). Fixed sheet width (UA dialog max-width).
- Box builder done (desktop sticky box + mobile pinned bar/bottom sheet, ceremony verified in browser, no console errors).
- Delights + tests done: 60 e2e passing (a11y, layout, flows, reduced motion, no-JS, keyboard, console errors), 82 unit.
- Review passes done (tablet nav/gallery layout, collection header band, Our Story arch reveals, empty states).
- Lighthouse mobile (production build): home 91, collection 94, product 94, box 90, enquiries 92, story 92, cart 90, checkout 91; a11y 100 and best-practices 100 everywhere; CLS 0.
- Quality gate passed: build, lint, typecheck, 82 unit, 5 integration, 60 e2e, palette audit, secrets check. Stripe test-mode checkout NOT run end-to-end (no Stripe test keys locally) — covered by integration test with Stripe mocked.
- Handoff given; WAITING for owner feedback. Do not push until the owner replies "approved, push it".

---

# Admin analytics (branch `admin-analytics`, from `main`)

Owner brief (2 Oct 2026): sales chart, best-sellers donut, Meta ads tracker, visitors; first-party
tracking; ad attribution on orders; tests; screenshots. Plan approved by the owner.

- [x] 1. Schema: `PageView`; Order `utmSource/utmMedium/utmCampaign/fbclid` + `paidAt` index (two migrations)
- [x] 2. Pure analytics functions + unit tests (time-zone edges, zero-fill, Other bucket, ÷0, ROAS "-")
- [x] 3. `/api/track` + `PageViewBeacon` (DNT/GPC respected, bots/admin ignored, no raw IP) + tests
- [x] 4. Checkout attribution (own commit: cookie → `createCheckout` → order) + integration test
- [x] 5. Meta Marketing API client (v25.0, cached ~1 h, 8 s timeout, never throws) + tests + docs/META_ADS_SETUP.md
- [x] 6. Dashboard UI: range links, KPI tiles, sales columns, donut, ads tracker, visitors; SVG charts + `ChartHover`
- [x] 7. Sample data script, e2e (axe, keyboard chart, range links, logged-out redirect), screenshots 360/1440
- [x] 8. README §11, DECISIONS 30–45, quality gate

## Log

- Dev server had to be restarted after the migration (it held the old Prisma client: `db.pageView` undefined).
- Screenshots checked at 360 and 1440 px: no overlapping labels, no sideways scroll; KPI tiles two per row on phones.

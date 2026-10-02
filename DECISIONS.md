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
14. ★ **Box pieces are illustrated "sweets", not photos.** Box items have no image field and adding one
    would be a schema change (out of scope), so each kind of piece gets an embossed palette finish
    (six finishes, by list position). Easy to swap for photos later by adding an image to BoxItem.
15. **Placement order is visual state only.** The builder remembers the order pieces were placed so
    each lands in its own slot; the selection (and all rules/pricing) is unchanged.
16. **Completed box closes its lid** (with a "Peek inside" toggle to reopen). Removing a piece reopens
    it automatically.
17. **Pulses are finite** (three gentle beats), so nothing loops forever or distracts.
18. **Mobile box**: a pinned bar (progress stars, count, total) opens a bottom sheet with the full
    box, totals and Add to bag. Page has bottom padding so the bar never covers content.
19. **Loading skeletons only on collection and product pages.** A skeleton boundary at the shop root
    would leave no-JavaScript visitors looking at a skeleton (streamed content needs a tiny script to
    swap in). Collection/product pages are where navigation waits on data, so they get the shimmer.
20. **JS gate uses `next/script` `beforeInteractive`** (an inline `<script>` in the layout triggered a
    React warning). It still runs before hydration.
21. **Playwright runs with one worker** — the local Prisma dev database drops connections under
    parallel load. Production Postgres is unaffected.
22. **Tablets (768–1023px) use the phone layouts** for the header (hamburger), product page
    (stacked, swipe gallery) and box builder (pinned bar) — the desktop versions were cramped there.
23. **Motion loads only where it's used.** The cart drawer is loaded on first open, the product page
    uses a CSS transition for the size highlight, and reduced-motion config sits inside each Motion
    island instead of the root layout. This took Lighthouse mobile performance from 88–91 to 90–94.
24. **Lighthouse SEO notes (not bugs):** cart/checkout score 63 because they are intentionally
    `noindex`. Collection/product score 91 because Next.js streams `generateMetadata` output into
    `<body>` (documented Next.js 16 behaviour; Google reads the full DOM). Turning streaming off
    (`htmlLimitedBots: /.*/`) would trade speed for that score — left at the default.
25. **/preview-screenshots is git-ignored** — the final screenshots are saved there for review but not committed (binary files would bloat the repo).
26. **Phone testing over Wi-Fi works in dev**: `allowedDevOrigins` allows private network addresses (dev only), and the cart no longer depends on `crypto.randomUUID` (missing on plain-http LAN addresses) — a real bug found while preparing the phone link.

## Admin analytics (branch `admin-analytics`)

Numbered from 30 because items 27–29 are on the `royal-experience` branch.

30. **Separate page `/admin/analytics`, linked from the admin nav**, not tiles under `/admin`. The
    dashboard is the daily packing/shipping screen and should stay instant; analytics has a date
    range, a slow third party (Meta) and four chart sections that would bury the operational tiles
    on a phone.
31. **Branched from `main`, not `fun-rework`.** By the time this started, `fun-rework` had been
    merged to `main` (PR #3) at the owner's request, including the `DATABASE_POOL_MAX` change in
    `src/lib/db.ts` / `.env.example` (those were the agent's changes, not the owner's).
32. **Days are grouped in TypeScript, not SQL.** Rows for the two periods are loaded once and bucketed
    with `todayIn(STORE_TIMEZONE)`, which is unit-tested on the 11 pm-Boston and DST edges. Fine for
    a small shop's volumes; switch to `AT TIME ZONE` grouping in SQL if page views reach millions.
33. **Migrations were generated with `prisma migrate diff`**, not `migrate dev`: locally the
    `prisma dev` database lives in `template1`, so `migrate dev`'s shadow database is a copy that
    already has every table and fails. The SQL is identical to what `migrate dev` would write
    (`20261002150000_page_views`, `20261002150100_order_attribution`), additive only.
34. **Unique visitors over a period = sum of daily uniques.** The visitor hash rotates daily (by
    design, for privacy), so one person on three days counts three times. Same convention as
    Plausible. The tile says "Unique visitors"; the README explains it.
35. **Traffic sources are counted per visitor**, by the first known source of their day (utm_source,
    else referrer host, else "Direct"), not per page view; otherwise one Instagram visitor browsing
    ten pages would look like ten. Instagram/Facebook hosts and utm values are normalised to
    "instagram"/"facebook".
36. **The attribution cookie is set by `/api/track`'s response**, not by `proxy.ts`, so the proxy
    stays admin-only and nothing runs on every request. It is `HttpOnly` (checkout reads it on the
    server), first touch wins, and it's only set for visits arriving with `utm_source`/`fbclid`.
    Visitors with Do Not Track / GPC send no beacon, so they get no cookie and their orders are
    not attributed; that's the privacy-respecting trade-off.
37. **Ad revenue/ROAS use our own orders, matched on `utm_campaign` = Meta campaign name**
    (case-insensitive). Meta's own reported purchases are shown as a separate, labelled line.
38. **Budget bar:** for a daily budget, the period budget is daily × days the campaign ran inside
    the range; for a lifetime budget, the bar compares the period's spend with the lifetime
    budget and says so in words. Campaigns budgeted at ad-set level show spend only.
39. **Meta field units were checked in the Marketing API reference (v25.0)**: budgets are integer
    currency sub-units; spend/cpc/cpm are decimal strings in account currency; purchases use
    `omni_purchase` (falling back to `purchase`, then the pixel purchase). If the ad account's
    currency differs from the store's, the tracker says so.
40. **Caching:** this app doesn't enable Cache Components, so per the Next 16 guide
    ("caching without Cache Components") Meta calls use `fetch(..., { next: { revalidate: 3600 } })`.
    The token travels in the `Authorization` header, never in a URL, and only in server code.
41. **Chart colours** (brand tokens + `color-mix` only): emerald, gold, emerald/ivory blend,
    gold-ink, emerald/gold blend, gold-ink/ivory blend; "Other" is a muted/sand blend. A product's
    shade comes from a hash of its id (stable across ranges); if two visible products collide,
    the one with the smaller id keeps it and the other takes the next free shade.
42. **No chart library.** Charts are server-rendered SVG (stretched with non-scaling strokes; all
    text is HTML so it stays legible at 360 px). The only client code is `ChartHover`, exposed as
    an ARIA slider so keyboard and screen-reader users can step through days.
43. **`formatMoney` gained an optional `{ wholeUnits }` option** for chart axes ("$1,250"); default
    output is unchanged.
44. **Sample data (`npm run db:seed:analytics`) uses made-up prices**, not the catalogue's, and is
    tagged (`@analytics-sample.test`, `sample-` hashes) so a re-run replaces it. It exits unless
    `DATABASE_URL` points at localhost and `NODE_ENV`/`VERCEL` aren't production.
45. **The screenshot script can sign in to `/admin`** with the local `.env` admin (same signed-cookie
    approach as the e2e tests) and accepts `SCREENSHOT_WIDTHS`.

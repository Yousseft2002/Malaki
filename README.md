# MALAKI — storefront

E-commerce site for MALAKI, a Moroccan confectionery brand (cookies, stuffed
dates, gift boxes). Next.js (App Router) + TypeScript + Tailwind CSS,
PostgreSQL via Prisma, Stripe Checkout, provider-agnostic email.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the design and
[docs/LICENSES.md](docs/LICENSES.md) for dependency licences.

---

## 1. Quick start (local)

Requirements: **Node.js 20.9+** (developed on 24), npm, and a PostgreSQL
database. No Docker needed.

```bash
npm install                      # also runs `prisma generate`
cp .env.example .env             # then edit .env (see §2)

# Option A — zero-install local Postgres (Prisma's dev server, runs in the background)
npx prisma dev --name malaki --detach
# put the printed TCP URL in DATABASE_URL, e.g.
# postgres://postgres:postgres@localhost:51214/template1?sslmode=disable

# Option B — any PostgreSQL 14+ you already have; set DATABASE_URL accordingly.

npx prisma migrate dev           # create tables
SEED_DEMO_PRICES=true npm run db:seed   # placeholder catalogue (+ fake test prices, see §4)
npm run dev                      # http://localhost:3000
```

Admin: generate credentials (§2 → Admin), then open http://localhost:3000/admin.

## 2. Environment variables

All variables are documented inline in [`.env.example`](.env.example). Never
commit `.env`; it is git-ignored. Empty values are treated as "not set".

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | yes (prod) | Public URL; used for Stripe redirects, sitemap, canonical URLs |
| `NEXT_PUBLIC_STORE_CURRENCY` | no | ISO currency code (default `USD`; MALAKI is based in Boston) |
| `NEXT_PUBLIC_STORE_LOCALE` | no | Number/currency formatting locale (default `en-US`) |
| `STORE_TIMEZONE` | no | Kitchen time zone for "today", lead times and dispatch days (default `America/New_York`) |
| `STRIPE_SECRET_KEY` | for checkout | Stripe secret key (`sk_test_…` while testing) |
| `STRIPE_WEBHOOK_SECRET` | for checkout | Signing secret of the webhook endpoint (`whsec_…`) |
| `CHECKOUT_HOLD_MINUTES` | no | How long a checkout holds capacity / session stays open (31–1380, default 60) |
| `EMAIL_PROVIDER` | no | `console` (logs emails) or `smtp` |
| `EMAIL_FROM` | for email | Sender, e.g. `MALAKI <orders@your-domain>` |
| `ORDER_NOTIFICATION_EMAIL` | no | Owner inbox for new paid orders and enquiries |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASSWORD` `SMTP_SECURE` | for `smtp` | SMTP credentials from your email provider |
| `ADMIN_EMAIL` `ADMIN_PASSWORD_HASH` `ADMIN_SESSION_SECRET` | for admin | Owner login (see below) |
| `NEXT_PUBLIC_ANALYTICS_*` | no | Privacy-friendly analytics script (off when empty) |
| `DATABASE_POOL_MAX` | no | Max DB connections per process; set `1` for the local `prisma dev` database, leave empty in production |
| `ANALYTICS_SALT` | no | Secret for the daily visitor hash (falls back to `ADMIN_SESSION_SECRET`) |
| `META_ADS_ACCESS_TOKEN` `META_AD_ACCOUNT_ID` | for the ads tracker | Read-only Meta Marketing API access, see [docs/META_ADS_SETUP.md](docs/META_ADS_SETUP.md) |
| `META_GRAPH_API_VERSION` | no | Marketing API version (default `v25.0`) |
| `ERROR_WEBHOOK_URL` | no | Server errors are POSTed here as JSON |
| `LOG_LEVEL` | no | `debug` / `info` / `warn` / `error` |
| `IMAGE_REMOTE_PATTERNS` | no | Extra allowed image hosts for `next/image` |

**Admin credentials**

```bash
npm run admin:hash -- "a long unique password"   # → ADMIN_PASSWORD_HASH (scrypt:…)
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"   # → ADMIN_SESSION_SECRET
```

Set `ADMIN_EMAIL` to the email you will sign in with. Changing the secret
signs everyone out.

## 3. Database & migrations

| Task | Command |
| --- | --- |
| Create/apply migrations in development | `npm run db:migrate` (`prisma migrate dev`) |
| Apply migrations in production | `npm run db:deploy` (`prisma migrate deploy`) |
| Seed placeholder data | `npm run db:seed` |
| Browse data | `npm run db:studio` |

After changing `prisma/schema.prisma`, run `npm run db:migrate -- --name what-changed`
and commit the generated folder in `prisma/migrations/`. The Prisma client is
generated into `src/generated/prisma` (git-ignored) by `npm install` and `npm run build`.

## 4. Seed data and placeholders

`npm run db:seed` is idempotent and never overwrites edits made in the admin.
It creates the collections (Gift Boxes, Stuffed Dates, Moroccan Cookies), the
products (The Malaki Box, Stuffed Date Collection, Gazelle Horns, Ghriba
Selection, Build Your Own Box), box items, two shipping options and store
settings.

**Prices are left empty on purpose.** The shop shows `[PRICE]` and the item
can't be bought until you enter a price in the admin. For local testing only,
`SEED_DEMO_PRICES=true` fills obviously fake prices (1.00, 2.00 …) and stock.

Every piece of business content is a visible placeholder in square brackets —
`[INGREDIENTS]`, `[ALLERGENS]`, `[SHIPPING TIMES]`, `[BRAND STORY …]`,
`[PHOTO: …]` etc. Search the codebase and the admin for `[` to find them.

## 5. Stripe (test mode) and webhooks

1. Create a Stripe account and stay in **test mode**. Copy the test secret key
   into `STRIPE_SECRET_KEY`.
2. Payment methods shown on the hosted page come from your Stripe dashboard
   settings (the code doesn't hard-code them).
3. Local webhooks with the [Stripe CLI](https://docs.stripe.com/stripe-cli):
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET` and restart `npm run dev`.
4. Place an order on the site and pay with one of Stripe's
   [test cards](https://docs.stripe.com/testing). The order appears in
   `/admin/orders` as **paid** only once the webhook has been received, and the
   confirmation email is logged to the terminal (with `EMAIL_PROVIDER=console`).
5. In production, add an endpoint in the Stripe dashboard pointing at
   `https://<your-domain>/api/stripe/webhook`, subscribed to:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`.
   Use that endpoint's signing secret in production.

Please verify the CLI commands and dashboard steps against Stripe's current
docs; the code relies only on the stripe-node 23.x SDK calls
`checkout.sessions.create` and `webhooks.constructEvent`.

## 6. Tests and checks

| Command | What it covers |
| --- | --- |
| `npm test` | Unit tests: box rules, pricing, shipping & capacity, webhook handling, Stripe signature verification, emails, admin parsers, CSV, auth, rate limiting, spam checks |
| `npm run test:integration` | Checkout → webhook against a real database with Stripe mocked. **Uses `DATABASE_URL` — point it at a dev database** |
| `npm run test:e2e` | Playwright + axe: WCAG 2.2 AA scan, no horizontal scroll at 360 px, 44 px tap targets, key flows, reduced motion, no-JS, keyboard-only box building, zero console errors (needs the dev server with demo seed; first run `npx playwright install chromium`) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run palette:audit` | Fails on any colour outside the MALAKI palette |
| `npx tsx scripts/screenshots.mts <dir> [paths]` | Screenshots pages at 360 / 768 / 1440 px (dev server running; `/admin` paths are signed in with the local `.env` admin; `SCREENSHOT_WIDTHS=360,1440` limits widths) |
| `npm run db:seed:analytics` | **Local only.** Sample paid orders and page views over 60 days so `/admin/analytics` has something to show. Refuses to run in production or against a non-local database |

## 7. Deployment

The app is a standard Node.js Next.js server; it runs on any host that runs
Node 20.9+ (a VPS, Docker, Render, Railway, Fly.io, Vercel, …) with any
managed PostgreSQL. Generic steps:

```bash
npm ci
npm run build              # prisma generate + next build (no database needed)
npm run db:deploy          # apply migrations to the production database
npm run start              # serves on $PORT (default 3000)
```

Checklist before launch:

- [ ] All env vars set in the host's secret settings; `NEXT_PUBLIC_SITE_URL` is the real https domain.
- [ ] Currency, time zone, shipping rules, dispatch days, capacity and gift-wrap price reviewed in **/admin/shipping**.
- [ ] Every product has real copy, allergens, prices, stock and photos; placeholders gone.
- [ ] Legal templates replaced and reviewed by an adviser.
- [ ] Stripe live keys + live webhook endpoint configured; a real low-value test order placed and refunded.
- [ ] SMTP sending verified (SPF/DKIM/DMARC for your domain set up with your email provider).
- [ ] Database backups enabled at your provider.
- [ ] If running more than one server instance, replace the in-memory rate limiter store (see §9).

Product photos: put files in `public/images/` and reference them as
`/images/<file>` in the admin, or host them on a CDN and add the host to
`IMAGE_REMOTE_PATTERNS`.

## 8. Folder structure

```
prisma/              schema, migrations, seed
src/app/(shop)/      storefront pages (shared header/footer layout)
src/app/admin/       login + protected admin pages and server actions
src/app/actions/     public server actions (cart quote, checkout, enquiry, newsletter)
src/app/api/         Stripe webhook
src/components/      UI by area: layout, ui, home, product, cart, box-builder, checkout, forms, admin
src/components/motion/  motion tokens + primitives (see §10)
src/lib/domain/      pure business rules + unit tests (box, pricing, shipping, capacity, dates, money)
src/lib/orders/      checkout creation, webhook handling, fulfilment
src/lib/email/       EmailProvider interface, console + SMTP providers, templates
src/lib/auth/        admin session + password hashing
src/lib/queries/     database read models
src/content/         legal page templates
src/proxy.ts         admin route guard
src/instrumentation.ts  server error reporting
e2e/                 Playwright accessibility, layout and flow checks
docs/                architecture, licences
```

## 9. Key design decisions

- **Server is the source of truth for money.** The browser cart stores IDs and
  choices only; prices, stock, box rules, shipping and capacity are recomputed
  on the server at checkout with the same pure functions the UI uses.
- **Orders are confirmed only by verified webhooks.** The success page just
  reads status. Webhook processing is idempotent (event ids are recorded) and
  retried by Stripe on failure.
- **Capacity is enforced under a lock.** Checkout takes a per-day Postgres
  advisory lock, so two buyers can't book the last slot. Pending checkouts hold
  capacity for `CHECKOUT_HOLD_MINUTES`; expired sessions release it.
- **Shipping is data, not code.** Regions, prices, thresholds, dispatch days
  (separately for perishables), transit/lead times, pickup and daily capacity
  live in the database and are edited in the admin.
- **No lock-in.** SMTP for email (any provider), any Postgres, any Node host,
  analytics and error reporting configured by env. Swapping email provider =
  changing env vars, or implementing `EmailProvider` in `src/lib/email`.
- **Rate limiting** uses an in-memory store per server instance. That is fine
  on one server; on several instances or serverless, implement `RateLimitStore`
  (in `src/lib/rate-limit.ts`) with Redis or similar.
- **Spam protection** is a honeypot field + minimum fill time + rate limit —
  no third-party CAPTCHA, no tracking.
- **Single owner admin** from env variables, HMAC-signed cookie scoped to
  `/admin`, checked in `proxy.ts` *and* in every admin page/action/route.
- **Dynamic rendering** for database pages: edits appear immediately and the
  build never needs a database.

## 10. Motion system

One motion personality across the site — smooth, elegant, slightly bouncy — defined in one place and
built from a few primitives. Everything animates **transform and opacity only**, respects
`prefers-reduced-motion`, and never hides content when JavaScript is off.

### Tokens

`src/components/motion/tokens.ts` (for Motion/JS) mirrored as CSS custom properties in
`src/app/globals.css` (`:root`). Keep the two in sync.

| Token | JS (`tokens.ts`) | CSS | Use |
| --- | --- | --- | --- |
| Durations | `duration.instant/fast/base/slow/reveal/ceremony` (0.12–1.1 s) | `--dur-*` | press → hover → panels → reveals → box ceremony |
| Easings | `ease.out`, `ease.inOut`, `ease.bounce`, `ease.spring` | `--ease-*` | settle, shimmer, playful overshoot, drawer spring |
| Springs | `spring.soft`, `spring.bouncy`, `spring.drawer` | — | Motion springs (box pieces) |
| Stagger | `stagger.tight/base/loose` (40/70/120 ms) | `--stagger-*` | lists, cards, hero sequence |

### Primitives (`src/components/motion/`)

| Primitive | Kind | What it does |
| --- | --- | --- |
| `Reveal` | client island | Adds `[data-inview]` once when scrolled into view → `.reveal` rises/fades in. Server children pass through. |
| `Stagger` | client island | Same, but its children enter one after another (`.stagger`, nth-child delays). |
| `InView` | client island | Only flags `[data-inview]` — for custom choreography (star dividers, arch reveal). |
| `PageIntro` + `introStep(n)` | server, CSS | Entrance sequence on first paint, before hydration (hero, product title). |
| `InteractiveButton` (`Button` / `ButtonLink`) | CSS `.btn-tactile` | Lifts on hover, arrow slides, gold light sweep, compresses on press. |
| `HoverLift` | CSS `.hover-lift` | Card lift on hover/focus, press-down on tap. |
| `AnimatedCounter` | client | Number rolls up/down on change (cart badge, quantities). |
| `FloatingMotif` | server, CSS | Low-opacity gold zellige pattern + glinting stars (hero, gifting, collections). |
| `AddToBagButton` / `flyToBag()` | client, Web Animations API | Press → gold piece arcs into the bag (`[data-bag-target]`) → item added → count bumps → drawer opens → ✓. |
| `JS_GATE_SCRIPT` | root layout | Sets `html[data-js]`; reveal styles only hide content under it. |

Motion (Motion for React, MIT) is used **only** where CSS can't express the choreography: pieces
entering/leaving the build-your-own box and cart items animating out. Those components wrap
themselves in `<MotionConfig reducedMotion="user">`, and the library is only loaded on pages (or
interactions — the cart drawer is lazy) that use it.

Other named effects live in `globals.css`: `.star-divider` (hairlines grow from the centre, star turns
in), `.link-gold` (underline grows from the centre), `.arch-reveal` (curtain lifts out of an arch),
`.shimmer` (gold skeletons), `dialog.sheet` (spring slide-in), accordions (`::details-content`), and
the box ceremony keyframes (`sweep`, `burst`, `lid-drop`, `pop-in`).

### Adding a new animation

1. Prefer CSS. Use the tokens (`var(--dur-base) var(--ease-out)`), animate only `transform` /
   `opacity`, and give every hover effect a `:focus-visible` / `:active` (tap) equivalent.
2. For "appear on scroll", wrap the element in `<Reveal>` / `<Stagger>` — don't make the section a
   client component.
3. Need enter/exit or layout choreography? Use Motion inside a small client component wrapped in
   `<MotionConfig reducedMotion="user">`, with values from `tokens.ts`.
4. Check reduced motion: the global rule in `globals.css` makes durations instant; add your class to
   the reduced-motion block if it moves things (or loops).
5. Run `npm run test:e2e` (includes reduced-motion, no-JS, keyboard and console-error checks) and
   `npm run palette:audit` (no colours outside the palette).

## 11. Admin analytics

`/admin/analytics` (admin only, linked from the admin nav) shows, for the last 7, 30 or 90 days:

- **KPIs**: revenue, orders, average order, unique visitors, conversion rate, ad spend and ROAS,
  each compared with the previous period.
- **Sales per day**, **best sellers** (donut, top 5 + Other), the **Instagram/Facebook ads tracker**
  and **visitors** (per day, top sources, top pages, mobile vs desktop). Every chart has a
  "View as table" option, and the daily charts can be read with the arrow keys.

A *sale* is an order with status PAID, PACKED or SHIPPED, dated by `paidAt`. Days are calendar
days in `STORE_TIMEZONE` (a sale at 11 pm in Boston counts on that Boston day).

### Visitors (first party, no cookies)

The shop sends one beacon per page to `POST /api/track`. Nothing is sent when the browser has
Do Not Track or Global Privacy Control on, and bots, `/admin` and `/api` paths are ignored. No IP
address is stored and no tracking cookie is set: a visitor is a SHA-256 of a **daily** salt + IP +
user agent, so the same person can only be recognised within one day.

**Clean-up:** page views older than 13 months aren't needed and can be deleted, e.g. monthly:

```sql
DELETE FROM "PageView" WHERE "createdAt" < now() - interval '13 months';
```

### Ads: tag every Instagram ad link

Orders remember where the buyer came from: on the first visit from a link with `utm_source` or
`fbclid`, a first-party cookie (`malaki_attr`, 30 days, `SameSite=Lax`, `HttpOnly`) stores the
campaign, and checkout saves it on the order. So **every ad's website URL must be tagged**:

```
?utm_source=instagram&utm_medium=paid&utm_campaign=<campaign name>
```

Use the exact Meta campaign name for `utm_campaign` (Ads Manager's URL parameters field accepts
`{{campaign.name}}`). The tracker matches our orders to Meta campaigns on that name.

To show spend, budgets and clicks from Meta, follow [docs/META_ADS_SETUP.md](docs/META_ADS_SETUP.md).
Until then the section shows a "Connect Meta Ads" card, never made-up numbers.

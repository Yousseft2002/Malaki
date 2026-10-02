# MALAKI — Architecture

## Overview

One Next.js (App Router) application serves the storefront, the admin area and
the API routes. PostgreSQL (via Prisma) is the single source of truth. Stripe
Checkout (hosted) takes payments; an order only becomes `PAID` when a
signature-verified Stripe webhook says so.

```
Browser ──► Next.js (Server Components, Server Actions, Route Handlers)
              │
              ├── src/lib/domain/*      pure business rules (box, pricing, shipping, capacity)
              ├── src/lib/queries/*     read models (Prisma)
              ├── src/lib/orders/*      checkout + webhook fulfilment (Prisma + Stripe)
              ├── src/lib/email/*       EmailProvider adapter (console | SMTP)
              └── Prisma ──► PostgreSQL
Stripe Checkout ──(webhook)──► /api/stripe/webhook
```

## Folder structure

```
prisma/
  schema.prisma          data model
  migrations/            SQL migrations (committed)
  seed.ts                placeholder catalogue, shipping rules, settings
src/
  app/
    (shop)/              storefront routes, shared header/footer layout
      page.tsx           homepage
      collections/[slug] collection grids (from DB)
      products/[slug]    product page
      build-your-own-box box builder
      cart, checkout     cart page, checkout form, success page
      enquiries          corporate & wedding enquiry form
      our-story, legal/* story page and legal templates
    admin/
      login/             admin sign-in
      (protected)/       products, box items, orders, enquiries, shipping, capacity
    actions/             public server actions: cart quote, delivery dates, checkout, enquiry, newsletter
    api/
      stripe/webhook     Stripe webhook (raw body, signature verified)
      track              first-party page-view beacon (write-only, always 204)
    admin/(protected)/analytics   sales, best sellers, Meta ads, visitors (admin only)
    admin/(protected)/orders/export   CSV export (admin only)
    sitemap.ts, robots.ts
  components/
    layout/  ui/  home/  product/  cart/  box-builder/  checkout/  forms/  admin/
  lib/
    domain/              PURE functions + unit tests (no I/O)
    validation/          Zod schemas shared by client and server
    orders/              create checkout session, handle webhook events
    email/               provider interface, providers, templates
    auth/                admin session (signed cookie) + password hashing
    queries/             catalogue / order / analytics queries
    analytics/           pure analytics functions, page-view tracking + ad-attribution cookie
    ads/                 Meta Marketing API client (server-only, read-only)
    db.ts env.ts logger.ts rate-limit.ts spam.ts stripe.ts money.ts
  proxy.ts               guards /admin (session cookie check)
  instrumentation.ts     server error reporting hook
e2e/                     Playwright accessibility, 360px layout and flow checks
docs/
  ARCHITECTURE.md  LICENSES.md
```

## Key flows

**Cart.** Lives in the browser (`localStorage`), so it persists across visits
without an account. It stores only IDs, quantities and choices — never trusted
prices. Displayed prices come from the server; checkout recomputes everything.

**Build your own box.** The UI calls `validateBox()` /
`priceBox()` from `src/lib/domain/box.ts` for live feedback; the server calls
the *same* functions again at checkout with fresh stock from the database.

**Checkout.**
1. Client submits cart + buyer/recipient/gift/delivery details.
2. Server validates input (Zod), loads products/variants/box items, re-prices
   the cart (`domain/pricing.ts`), checks box rules, shipping rule eligibility
   and that the dispatch date has capacity (`domain/shipping.ts`,
   `domain/capacity.ts`).
3. Creates a `PENDING_PAYMENT` order, then a Stripe Checkout Session with
   `metadata.orderId`; redirects the buyer to Stripe.
4. Pending orders hold capacity for a short window so two buyers cannot take
   the last slot on the same day.

**Webhook.** `/api/stripe/webhook` verifies the signature against the raw
body, records the event id (idempotency), then:
- `checkout.session.completed` with `payment_status = paid`, or
  `checkout.session.async_payment_succeeded` → mark `PAID`, decrement stock
  (flagging `stockIssue` if it ran out), send the confirmation email.
- `checkout.session.expired` → mark `CANCELLED`, releasing capacity.

**Shipping & capacity.** Regions, prices, thresholds, permitted dispatch
weekdays (separately for perishable goods), transit/lead times, pickup and
per-day capacity are rows in the database (seeded from `prisma/seed.ts`,
editable in admin). Code only evaluates them.

**Admin.** Single owner login from env (`ADMIN_EMAIL` +
`ADMIN_PASSWORD_HASH`), HMAC-signed session cookie. `proxy.ts` redirects
unauthenticated requests; every admin Server Action and route re-checks the
session (defence in depth).

## Design decisions

| Decision | Why |
| --- | --- |
| Integer minor units for money | No floating-point rounding errors. |
| `null` price = not for sale yet | Never invent prices; storefront shows `[PRICE]`. |
| Pure domain functions | Business rules are unit-tested without a DB or browser. |
| Hosted Stripe Checkout + webhook-only confirmation | No card data touches our server; success page never marks orders paid. |
| Email behind `EmailProvider` | Swap SMTP host / provider with env vars, no code change. |
| SMTP as the real provider | Every transactional email service supports SMTP → no lock-in. |
| Env-based single admin | No extra auth service; easy to replace with a user table later. |
| In-memory rate limiter behind an interface | Works on one server; swap for Redis when scaling out. |
| Analytics via env-configured script | Plausible/Umami/self-hosted; nothing loads unless configured. |
| Error reporting via `instrumentation.ts` | Logs structured errors; optional webhook to any monitoring tool. |
| Dynamic rendering for DB pages | Builds without a database; catalogue edits show immediately. |

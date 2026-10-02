# Dependency licences

Checked on 2026-10-01 by scanning every `package.json` in `node_modules`.
**No GPL, AGPL, SSPL or source-available (BUSL/Elastic/Commons Clause) licences
were found.** Re-check after adding dependencies.

## Direct dependencies

| Package | Version | Licence | Use |
| --- | --- | --- | --- |
| next | 16.3.8 | MIT | framework |
| react, react-dom | 19.2.8 | MIT | UI |
| @prisma/client, prisma, @prisma/adapter-pg | 7.10.0 | Apache-2.0 | database ORM / CLI |
| pg | 8.x | MIT | PostgreSQL driver |
| stripe | 23.0.0 | MIT | payments SDK |
| zod | 4.x | MIT | validation |
| nodemailer | 10.x | MIT-0 | SMTP email |
| server-only | — | MIT | build-time guard |
| tailwindcss, @tailwindcss/postcss | 4.x | MIT | styling (build) |
| typescript, eslint, eslint-config-next | — | Apache-2.0 / MIT | tooling (dev) |
| vitest, tsx, dotenv | — | MIT / MIT / BSD-2-Clause | tests & scripts (dev) |
| @playwright/test | 1.63 | Apache-2.0 | browser tests (dev) |
| @axe-core/playwright, axe-core | 4.13 | **MPL-2.0** | accessibility tests (dev) |

## Worth knowing (no action needed for normal use)

- **sharp / libvips** (installed by Next.js for image optimisation): Apache-2.0
  with **LGPL-3.0** libvips binaries, dynamically linked. Using it unmodified is
  fine; if you ever modify and redistribute libvips itself, LGPL terms apply.
- **lightningcss** (Tailwind/Next build): **MPL-2.0**, file-level copyleft,
  build-time only.
- **axe-core** (dev only): **MPL-2.0**, used unmodified for tests.
- **elkjs** (pulled in by the Prisma CLI, dev tooling): EPL-2.0.
- **caniuse-lite**: CC-BY-4.0 data (attribution is in its package).
- **seq-queue** (via Prisma CLI → mysql2, not used at runtime): declares no
  licence field in its package.json — dev tooling only; flagging for completeness.

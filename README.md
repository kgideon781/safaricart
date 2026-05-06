# SafariCart

> **Shop the journey** · _Safari yako ya ununuzi_

Kenyan-market e-commerce marketplace (Jumia-style, multi-vendor). "Safari" means
"journey" in Swahili — the brand reads as "shopping journey."

## Stack

- **Next.js 16** (App Router) with TypeScript
- **Tailwind CSS v4** + **shadcn/ui** (base-ui under the hood)
- **PostgreSQL** via **Prisma ORM**
- **Auth.js v5** (NextAuth) — credentials + Google, phone OTP later
- **Zod** for validation, **React Hook Form** for forms
- **Tanstack Query** for client-side data fetching
- **Meilisearch** for product search _(later)_

## Getting started

```powershell
# 1. Start Postgres + pgAdmin
docker compose up -d

# 2. Copy env template and fill in secrets
copy .env.example .env

# 3. Install deps and generate Prisma client
pnpm install
pnpm exec prisma generate

# 4. Run migrations (only after the schema has been reviewed)
pnpm exec prisma migrate dev

# 5. Run the dev server
pnpm dev
```

- App: <http://localhost:3000>
- pgAdmin: <http://localhost:5050> (`admin@safaricart.local` / `admin`)
- Postgres: `localhost:5432` (`safaricart` / `safaricart` / `safaricart`)

## Project structure

```
safaricart/
├── app/              Next.js App Router routes, layouts, route handlers
├── components/
│   └── ui/           shadcn/ui primitives (button, input, …)
├── hooks/            Reusable React hooks (client-only)
├── lib/              Pure utilities, safe to import from server OR client
│   ├── kenya.ts        KES, +254 phone, 47 counties
│   └── utils.ts        cn() helper
├── server/           Server-only code — never import from a client component
│   ├── db.ts           Prisma client singleton
│   └── env.ts          Type-safe env parsing (Zod)
├── prisma/
│   └── schema.prisma   Data model
├── public/           Static assets
├── docker-compose.yml  Local Postgres + pgAdmin
└── .env.example        Required env vars
```

## Conventions

- **Server vs client.** Anything that touches secrets, the DB, or third-party
  server SDKs lives under `server/` and starts with `import "server-only"`.
  Anything safe for both lives in `lib/`. Client-only React hooks live in
  `hooks/`.
- **Money.** Prices are stored as integer KES (no cents — Kenyan currency
  doesn't subdivide in practice). Always render with `formatKES()`.
- **Phones.** Stored as E.164 (`+2547XXXXXXXX`). Normalize input with
  `normalizeKenyanPhone()` before persisting.
- **Addresses.** County is constrained to the 47 official counties via
  `KENYAN_COUNTIES`.
- **Brand colors.** Use semantic Tailwind tokens — `bg-primary` for CTAs
  (savanna orange), `bg-secondary` for trust signals (acacia green), `bg-accent`
  for promotions (amber gold). Never hardcode hex values in components.
- **Migrations.** Schema changes are reviewed before `prisma migrate dev` runs.
- **Path alias.** `@/` resolves to the project root.

## Payment integrations

Placeholders are wired in `.env.example` and the `server/env.ts` schema:

- **M-Pesa Daraja** — Kenya's primary payment rail
- **Paystack** — cards + mobile money fallback
- **Stripe** — international cards

Implementation lives under `server/payments/<provider>/` (added when
each provider is integrated).

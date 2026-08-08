# Sarenza — "L'Art du Shopping"

A full-stack e-commerce scaffold: React 19 + Vite + TypeScript + Tailwind + Framer Motion
storefront, backed by an Express + Prisma API on Postgres (Supabase-ready), with
Cloudinary image storage and guest-only checkout.

> **Branding note:** "Sarenza" is used here as an internal project codename only. The
> real Sarenza is an operating, trademarked French e-commerce company — this scaffold
> does **not** use their logo or brand assets. Swap in your own cleared trademark before
> any public launch.

## Architecture

```
sarenza-platform/
├── frontend/          React 19 + Vite + TS + Tailwind + Framer Motion + React Query
├── backend/            Express + Prisma + PostgreSQL (Supabase) + Cloudinary
└── docker-compose.yml  Local dev stack: Postgres + API + web, all containerized
```

**Frontend stack:** React Router, React Query (data fetching/caching), React Hook Form
(checkout validation), Axios, Framer Motion (page/element animation), i18next (FR/EN/AR
with RTL support), Tailwind CSS.

**Backend stack:** Express, Prisma ORM, Zod validation, JWT admin auth, Cloudinary image
storage, rate limiting, Helmet.

**Data model:** Category (self-referential — main categories and subcategories are both
`Category` rows, linked via `parentId`), Brand, Product (belongs to a subcategory leaf,
with images/variants), Order/OrderItem (guest checkout — no customer accounts), Admin
(the only account type, per the "admin login only" requirement).

**Catalog structure:** 8 main categories (Informatique, Climatiseurs, TV & Audio,
Téléphones & Tablettes, Mobilier, Électroménager, Gaming, Électronique & Accessoires),
each with a full set of real subcategories stored in Postgres — not hardcoded on the
frontend. `GET /api/categories` returns the full tree; `GET /api/products?category=X`
resolves whether `X` is a main or subcategory slug and filters accordingly, and
`?subcategory=Y` filters an exact subcategory.

**Currency:** TND only, everywhere (product cards, detail pages, cart, checkout, admin).
No € or other symbol appears anywhere in the app.

**No demo data:** the frontend calls the real API only — there is no mock-data fallback.
An empty database shows an honest empty state, not fabricated products/reviews/stats.

## Quick start (Docker)

```bash
cp backend/.env.example backend/.env      # fill in JWT_SECRET, Cloudinary keys
cp frontend/.env.example frontend/.env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api/health
- Postgres: localhost:5432 (local dev only — point `DATABASE_URL` at Supabase for staging/prod)

After the containers are up, seed the catalog:

```bash
docker compose exec backend npm run prisma:seed
```

This creates a sample catalog and an admin account
(`admin@sarenza.example` / the password from `SEED_ADMIN_PASSWORD`, default `ChangeMe123!`
— **change this before deploying anywhere real**).

## Running without Docker

**Backend**
```bash
cd backend
cp .env.example .env      # point DATABASE_URL at your Supabase Postgres instance
npm install
npm run prisma:migrate    # creates tables
npm run prisma:seed       # sample data + admin account
npm run dev                # http://localhost:4000
```

**Frontend**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

The frontend currently ships wired to **local mock data** (`src/data/mockData.ts` via
`src/lib/queries.ts`) so it runs standalone with zero backend setup. Each hook in
`queries.ts` has a comment showing the one-line swap to call the real API
(`src/lib/api.ts`) once the backend is deployed — e.g. replace the mock resolver in
`useProducts` with `api.get("/products", { params: filters })`.

## What's production-ready vs. what you still need to configure

**Ready to go:**
- Full REST API with validation, guest checkout with stock-safe transactions, admin JWT auth
- Prisma schema + migrations + seed script
- Responsive, animated, accessible (focus-visible, reduced-motion respected) storefront UI
- i18n for French/English/Arabic with automatic RTL layout flip
- Dockerfiles for both services + docker-compose for local orchestration

**You'll need to supply before going live:**
- A real Supabase Postgres project (`DATABASE_URL`)
- A Cloudinary account (`CLOUDINARY_*` keys) — currently product images are placeholders
- Your own cleared brand name/logo (see branding note above)
- A Heroku app (or equivalent) per service for deployment, with the env vars above set
  as config vars
- Payment processing — checkout currently captures the order and decrements stock, but
  has no payment gateway wired in (add e.g. Stripe before accepting real payments)

## v4 changes — production fixes + new features

### Docker/Prisma errors found and fixed
1. **Backend container restart loop**: the Docker `CMD` ran `prisma migrate deploy`,
   but no `prisma/migrations/` history exists yet in this project → the command failed
   every time and crash-looped the container. **Fixed** by switching the startup command
   to `prisma db push` (safe, additive schema sync, no data loss, no migration files
   required). Once you run `npx prisma migrate dev` locally against a real database and
   commit the generated `prisma/migrations/` folder, switch `backend/Dockerfile`'s `CMD`
   back to `migrate deploy` for proper versioned migrations.
2. **Prisma Client never actually available at runtime**: the Dockerfile's final stage
   copied `node_modules` from the `deps` stage (before `prisma generate` ran) instead of
   the `build` stage (after generation) — the container would crash on the first
   `PrismaClient` import. **Fixed** by copying `node_modules` from `build` instead.
3. **Prisma engine/OpenSSL crash on Alpine**: `node:20-alpine` lacks OpenSSL by default,
   which Prisma's query engine needs — this typically shows up as "Unable to require
   `libquery_engine`". **Fixed** by adding `RUN apk add --no-cache openssl libc6-compat`
   and adding `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` to the Prisma
   schema's generator block.
4. **Seed script**: `npm run prisma:seed` now runs `ts-node --transpile-only` (faster,
   avoids type-check edge cases) and a `"prisma": { "seed": "..." }` block was added to
   `package.json` so Prisma's own seed-discovery (`prisma db seed`) also works.
5. **Unused dependency removed**: `cloudinary` was listed in `package.json` but no longer
   used (product/ad images are stored on local disk) — removed to avoid confusion and
   unnecessary install weight.

### Files modified for the above
`backend/Dockerfile`, `backend/package.json`, `backend/prisma/schema.prisma`,
`backend/src/routes/uploads.ts` (stale comment cleanup), `backend/src/lib/cloudinary.ts`
(deleted, unused).

### New features (from the second request)
- **Filters removed**: `Category.tsx` no longer has price/brand/stock/sale/sort
  controls — browsing is category/subcategory only, via the same accordion sidebar
  (desktop) and drawer (mobile) as before.
- **Promotional carousel**: `PromoCarousel.tsx`, auto-rotating (6s), prev/next arrows,
  pagination dots, pauses on hover, shows nothing if there are no active ads (no fake
  placeholder banners). Sits right below the hero, above the category highlights.
- **Advertisement management**: new `Advertisement` Prisma model; backend routes at
  `/api/advertisements` (public, active-only) and `/api/advertisements/admin` +
  POST/PUT/DELETE/reorder (admin-only, JWT-protected). Admin UI at
  `/admin/advertisements` — create/edit/delete, activate/deactivate, reorder
  (up/down), image upload reuses the existing local-disk upload endpoint.
- **Visual identity**: re-themed to deep blue + warm cream + gold accent (`tailwind.config.js`
  only — same layout/components). Cream (`canvas`) is now the dominant page background
  instead of white; white is still used for card surfaces where it aids readability.
  Gold (`accent`) is used sparingly — star ratings, eyebrow labels, small highlights.
  Header and footer credit bar now carry deep-blue treatments for visual depth.

### How to run
```bash
cp backend/.env.example backend/.env   # set JWT_SECRET at minimum
cp frontend/.env.example frontend/.env
docker compose up -d --build
docker compose ps                       # all three services should show "Up"
docker compose logs backend --tail 50   # should show "Sarenza API listening on port 4000"
docker compose exec backend npm run prisma:seed
```
- Frontend: http://localhost:5173
- Backend/API: http://localhost:4000/api/health
- Admin: http://localhost:5173/admin/login → `admin@sarenza.example` / `ChangeMe123!`

### Remaining non-critical notes
- No `prisma/migrations/` history exists yet (see fix #1 above) — this is fine for
  `db push`-based deployment, but create one via `prisma migrate dev` before you need
  rollback-able, versioned schema changes in a team/production workflow.
- `db push` will refuse (not silently apply) any change that would cause data loss —
  if that happens you'll see it explicitly in `docker compose logs backend` rather than
  losing data silently.


`/admin/login` — sign in with the seeded admin account. The dashboard (`/admin`) covers:
- **Overview** — product/order counts, revenue, low-stock alert, recent orders
- **Products** — full CRUD (create, edit, delete) against the real API
- **Categories** — create/delete
- **Orders** — list all guest orders and update their status (PENDING → CONFIRMED →
  PROCESSING → SHIPPED → DELIVERED, or CANCELLED). Delivered orders can be permanently
  deleted (with a confirmation dialog) — this is the only status that allows deletion.

The storefront and admin dashboard both talk to the same live backend — the storefront
falls back to local mock data only if the API is unreachable (e.g. previewing the
frontend without the backend running), so it never shows a blank page during development.

## Design tokens

Colors, spacing, and type scale live in `frontend/tailwind.config.js`, driven directly
from the brief's palette (`primary` #163B7A, `royal` #2563EB, `accent` #F59E0B, etc.).
Headings use Fraunces (display serif); body text uses Inter. The product/category cards
use an editorial "museum label" treatment — small tracked-out caps for brand/category,
generous whitespace — as the platform's signature visual detail.

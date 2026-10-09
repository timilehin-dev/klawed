# klawhub.xyz — klawed site

The Astro app behind klawhub.xyz. A dated dispatch of real openings for builders,
Nigeria first, then Africa, then global.

## Stack

- **Astro 5** (`output: 'server'`) on the **Vercel** adapter
- **Tailwind v4** through the Vite plugin — utilities for layout, tokens for everything else
- **Prisma** against **Vercel Postgres (Neon)**
- One write path: the keyed Content API at `POST /api/listings`

## Layout

```
src/
  lib/            the contracts: category registry, validation, queries, formatting
  layouts/        Base.astro — dateline, sticky chip bar, footer
  components/     the Variant C component layer + hand-authored inline SVG icons
  pages/          index, [category], listings/[slug], about, closing-soon, archive, 404, api/
  styles/         tokens.css (design-language §2 verbatim) + global.css
prisma/           schema.prisma, migrations/, seed.mjs (the empty-state seed)
tests/            node --test suite — no test framework, no extra deps
scripts/          migrate-ci.mjs — the opt-in migration gate for builds
docs/             WAVE2-BRIEF.md (the build brief), EXTENSIBILITY.md
```

## Getting it running

The real secrets live in `C:\Users\HP\klaw\.env` (gitignored) — `POSTGRES_PRISMA_URL`
(pooled, runtime) and `POSTGRES_URL_NON_POOLING` (direct, migrations). Because that
file sits above this directory, Prisma will not pick it up on its own. Load it
explicitly:

```bash
cd /c/Users/HP/klaw/site

# generate the client
npx prisma generate

# apply migrations to the connected Neon DB
node --env-file=C:/Users/HP/klaw/.env ./node_modules/prisma/build/index.js migrate deploy

# dev server on :4321
npm run dev
```

On Vercel none of that is needed — the Postgres integration injects the variables.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | dev server on port 4321 |
| `npm run build` | `prisma generate && astro build` |
| `npm run prisma:migrate` | `prisma migrate deploy` (needs the env loaded) |
| `npm run db:migrate:ci` | the build-time migration gate — **skips unless `RUN_MIGRATIONS=true`** |
| `npm run seed` | the empty-state seed; inserts zero listings, proves the DB is reachable |
| `npm test` | the `node --test` suite |

## The migration gate

`vercel.json` runs `prisma generate && npm run db:migrate:ci && astro build`. The gate
**skips by default** and only runs `migrate deploy` when `RUN_MIGRATIONS=true` is set on
the build that should apply a schema change. A failed migration exits non-zero and
blocks the deploy (TRD §8) — it is never forced past — but an unattended build does not
migrate production on every push, and two concurrent builds cannot race on the lock.

## Content API

```
POST /api/listings
x-api-key: <KLAWHUB_API_KEY>       (Authorization: Bearer <key> also accepted)
```

The full contract — every field, every validation rule, every status code — is
implemented in `src/pages/api/listings.ts` against `src/lib/validate-listing.ts`. It is
the only write path into the database. The key is read only in `src/lib/env.ts`, never
logged, never echoed, never in a response body.

## No mock data

There is no seed data, no demo listing, no sample org anywhere in this repo. The board
seeds to an empty state and every listing arrives through the Content API from the
pipeline. The design mockup's sample listings were deliberately not carried across.

## Design

Variant C "The Wire" — a dated dispatch. The visual contract is
`klaw/docs/design-language.md`; the tokens are copied verbatim into
`src/styles/tokens.css` and are the only source of colour, type, spacing and radius.
Adding a listing type is documented in `docs/EXTENSIBILITY.md`.

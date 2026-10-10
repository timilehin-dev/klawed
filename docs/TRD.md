# klawhub — Technical Requirements Document (TRD)

> Companion to `PRD.md`. This is the engineering contract. `plan.md` turns it into ordered
> tasks for `builder`. Any deviation from this doc is a spec change and needs owner sign-off.

---

## 1. Stack (locked)

| Layer | Choice | Notes |
|---|---|---|
| Site framework | **Astro** (latest stable, content collections enabled) | Static-first, islands where needed. No SPA. |
| Hosting / edge | **Vercel** | Deploys on push to `main`. Preview deploys on every PR. |
| Database | **Vercel Postgres (Neon)** | Provisioned through Vercel's Storage tab, bound to the project. |
| ORM | **Prisma** | Migrations in `prisma/migrations/`, committed. |
| Data access | Astro server-side + Prisma client | Listings are read server-side and rendered to HTML. No client-side data fetching for the board. |
| Newsletter | Buttondown or Brevo, free tier | Embedded signup form only. Not in critical path. |
| Design tokens | `klaw/docs/design-language.md` | Light editorial. Binding on all CSS. |

**Not in the stack, deliberately:** no CMS, no headless dashboard, no auth provider, no
client-side framework. The Content API *is* the write path.

---

## 2. Repository layout

```
klaw/
  docs/           PRD.md, TRD.md, flow.md, plan.md, design-language.md
  site/           the Astro project (builder owns everything in here)
    src/
      pages/      index.astro, [category].astro, listings/[slug].astro, about.astro, api/
      components/ ListingCard.astro, CategoryNav.astro, DeadlineBadge.astro, Hero.astro
      layouts/    Base.astro
      styles/     tokens.css, global.css
      content/    site copy strings (humanized, reviewed)
    prisma/
      schema.prisma
      migrations/
    public/       generated assets (images), each with provenance note
  quarantine/
    raw/          scout output
    drafts/       editor output
    review/       verifier's numbered link lists + owner approvals
```

The Astro app lives in `klaw/site/`. The quarantine folders are operational data, not part
of the build, and must be in `.gitignore` if they would otherwise be committed — check
before the first push.

---

## 3. Database schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
}

enum Category {
  jobs
  remote
  hackathons
  grants
  accelerators
  visas
  scholarships
  internships
  ai_credits
  student_deals
}

enum Region {
  nigeria
  africa
  global
}

enum Status {
  draft
  live
  expired
}

model Listing {
  id          String    @id @default(cuid())
  title       String
  org         String
  category    Category
  deadline    DateTime?
  evergreen   Boolean   @default(false)
  eligibility String
  link        String
  region      Region
  summary     String
  status      Status    @default(live)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([category, region])
  @@index([status, deadline])
  @@index([createdAt])
}
```

Rules on the schema:

- Prisma enum values are snake_case (`ai_credits`, `student_deals`) at the DB level; the
  URL and API accept the kebab form (`ai-credits`, `student-deals`). Builder writes the
  mapping once and tests it.
- `link` is stored as a plain string, validated for scheme (`https:`) and host at ingest.
  No arbitrary-length cap that would truncate a real application URL — 2048 chars is the
  floor.
- `deadline` is nullable only for `evergreen = true`. A live listing with
  `evergreen = false` and `deadline = null` is invalid and must be rejected at ingest.
- `status` defaults to `live` on ingest via the API (the API is the publish path, after
  owner approval — see §4). `draft` exists for builder-side seeds only.
- Expiry is a render-time filter (`deadline < now()` or `status = expired`), not a
  destructive delete. Listings are never hard-deleted by the pipeline.

---

## 4. The Content API

The single write path into the site. Lives at `site/src/pages/api/listings.ts` as an
Astro API route (or route handler). No other code writes to the database.

### Request

```
POST /api/listings
Headers:
  x-api-key: <KLAWHUB_API_KEY>
  Content-Type: application/json

Body (all fields required unless noted):
{
  "title":       "string, non-empty",
  "org":         "string, non-empty",
  "category":    "jobs | remote | hackathons | grants | accelerators | visas |
                  scholarships | internships | ai-credits | student-deals",
  "deadline":    "ISO-8601 date or null (required unless evergreen)",
  "evergreen":   "boolean",
  "eligibility": "string, non-empty",
  "link":        "https://... direct URL",
  "region":      "nigeria | africa | global",
  "summary":     "string, non-empty",
  "createdAt":   "ISO-8601 timestamp (optional; server defaults to now)"
}
```

The header is **`x-api-key`** (as specified by the owner). Constant-time comparison
against `process.env.KLAWHUB_API_KEY`. A missing or wrong key returns `401` with a body
that says nothing about what was wrong.

### Validation contract

| Check | On failure |
|---|---|
| `x-api-key` present and matches | `401 {"error":"unauthorized"}` |
| Body parses as JSON | `400 {"error":"invalid_json"}` |
| All required fields present and non-empty | `400 {"error":"missing_fields","fields":[...]}` |
| `category` in the ten-value set (kebab accepted) | `400 {"error":"bad_category"}` |
| `region` in the three-value set | `400 {"error":"bad_region"}` |
| `link` is `https:` and parses as a URL with a host | `400 {"error":"bad_link"}` |
| `evergreen=false` ⇒ `deadline` present, parses, and is in the future | `400 {"error":"bad_deadline"}` |
| `evergreen=true` ⇒ `deadline` must be null | `400 {"error":"bad_deadline"}` |
| Duplicate `link` already live | `409 {"error":"duplicate"}` |

On success: `201 {"id":"<cuid>","status":"live"}`.

The API does **not** re-resolve the link or re-check the deadline at ingest beyond the
future-date check — that is the verifier's job upstream. The API enforces shape; the crew
enforces truth. This separation is deliberate: the API is a dumb, fast, reliable pipe.

### Idempotency

The poster may retry. `link` uniqueness among live listings makes a retry a clean `409`
rather than a duplicate card. Do not add a separate idempotency key.

---

## 5. Environment and secrets

- `KLAWHUB_API_KEY` — generated once, 32+ random bytes hex. Lives only in:
  - Vercel project env vars (Production + Preview scopes)
  - the `poster` profile's `.env` at `C:\Users\HP\AppData\Local\hermes\profiles\poster\.env`
- `POSTGRES_PRISMA_URL` — provided automatically by the Vercel Postgres integration.
  Locally, developer copies it into their own `.env` (not committed).
- **`.env` is in `.gitignore` from the first commit.** `.env.example` documents the key
  names with empty values and is the only env file that gets committed.
- The key never appears in: repo, logs, client bundle, `public/`, Prisma seed files, or
  this doc. If it is ever committed, rotate it and re-deploy — that's a P1.

---

## 6. Rendering and content surfaces

- **Homepage** (`/`): hero (tagline "Opportunities, klawed first."), then listings grouped
  by category, ordered `nigeria → africa → global`, then by `createdAt desc` within
  region. Cards show title, org, category, region, deadline countdown or "Rolling", and a
  direct Apply link.
- **Category pages** (`/jobs`, `/ai-credits`, …): a static route per category, generated
  from the enum so a new category is a route with no hand-written file.
- **Detail page** (`/listings/[slug]`): full listing, one Apply button, deadline countdown
  or "Rolling". Slug is a slugified `title` + short id suffix, stored at ingest.
- **About** (`/about`): the PRD's hard rules, plainly stated.
- Deadline countdown is computed at render (or via a lightweight client island for a live
  ticking badge). No serverless function per page view beyond what Vercel gives free.

### Humanizer rule for all UI copy

Every string the site renders — hero, nav, button labels, empty states, 404, About —
is written by builder and must pass the `humanizer` skill before it ships. This is a
build acceptance criterion, not a nice-to-have. Listing copy written by editor is
already humanized upstream; builder's own chrome is not covered by that.

---

## 7. Design constraints (binding, from `design-language.md`)

- Light background by default. No dark-mode-first, no auto dark preference hijack.
- No glassmorphism (no `backdrop-filter` blur panels as decoration).
- No gradient decoration. Flat color, one accent.
- No icon-tile grids (no grid of square rounded boxes each holding a lucide icon).
- Two-tone headings, generous whitespace, pill / radius shape language.
- Real, meaningful icons only — precise inline SVG or the org's real logo. Generic
  icon-set stock is banned as page furniture. Any generated image is delegated to a
  subagent with `muse-media` / `image_generate` and lands in `public/` with a provenance
  note.

---

## 8. Deploy path

1. Builder commits to a branch, opens a PR against `main`.
2. Vercel preview deploy fires. Builder (and owner) check the preview.
3. On merge to `main`: production deploy.
4. Prisma migrations run as part of the Vercel build (`prisma migrate deploy` in the
   build command, or the Vercel Postgres integration's postinstall hook). A migration
   failure blocks the deploy — never force-past a failed migration.
5. Smoke check after deploy: homepage loads, one category page loads, one detail page
   loads, `POST /api/listings` with a bad key returns 401.

---

## 9. Observability and failure handling

- Vercel function logs are the log sink. No third-party analytics in v1 (and no ad
  pixels, ever — they'd violate the no-ads rule).
- If the Content API is down, the site still serves cached/static listings — the API is
  the write path, not the read path. Visitors never see a broken board because the poster
  couldn't reach the API.
- If the database is unreachable at render, Astro returns a static "board is being
  refreshed" state, humanized, not a stack trace.

---

## 10. Acceptance criteria for the build (owner checks these)

1. `npm run build` passes clean on `main`; production deploy is live on klawhub.xyz.
2. `POST /api/listings` with a correct key and a valid body returns `201` and the listing
   appears on the homepage within one deploy/revalidation cycle.
3. Every validation row in §4 returns the specified error code for its bad input.
4. A wrong or missing `x-api-key` returns `401`; the key string appears nowhere in the
   response, the client bundle, or the repo.
5. The Prisma schema matches §3 exactly, including enum kebab↔snake mapping.
6. The rendered site matches `design-language.md` and the PRD's image/icon rules — real
   assets only, no stock, no glass, no gradients, light by default.
7. All UI copy is humanized (no AI-slop voice anywhere on the surface).
8. Nigeria-first ordering is visible on the homepage and on every category page.

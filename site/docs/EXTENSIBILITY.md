# Extending klawed — adding a listing type

The board is built so that a new kind of listing is a **data change, not a code
rewrite**. This file is the walkthrough the PRD (§4, §7.8) and the build prompt
require, and it is the test of whether the architecture is honest.

## The shape of the seam

A listing is one row with one shape. Every surface — the API, the database, the
home board, the category pages, the detail page, the newsletter — consumes the
same nine PRD §3 fields plus system fields. There are no per-category snowflakes
at the schema level (PRD §3 says exactly this), and that is what makes adding a
type cheap.

The category list lives in **two places, both data**, and nothing else:

| What | File | What it drives |
|---|---|---|
| `CATEGORIES` in `src/lib/category-map.ts` | one row per category: `{ kebab, snake, label }` | chip bar, category routes, footer nav, API validation, counts |
| `enum Category` in `prisma/schema.prisma` | one enum value (snake_case) | the database column |

Everything else in the codebase **reads** those two and never hardcodes a
category. `src/pages/[category].astro` generates its routes from `CATEGORIES`, so
a new category is a page with no hand-written file. The chip bar, the footer, the
sitemap and the API's accepted values all follow automatically.

## Walkthrough: add a `fellowships` listing type

Say the crew wants to start filing fellowships alongside scholarships.

**1. Add the enum value** in `prisma/schema.prisma`:

```prisma
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
  fellowships      // ← new
}
```

**2. Add one row** in `src/lib/category-map.ts`:

```ts
{ kebab: 'fellowships', snake: 'fellowships', label: 'fellowships' },
```

**3. Migrate:**

```bash
npm run prisma:migrate      # applies to the connected Neon DB
```

That is the whole change. Immediately, with **no further code**:

- `POST /api/listings` accepts `"category": "fellowships"` — the API validates
  against `isCategoryKebab()`, which reads `CATEGORIES`.
- `/fellowships` exists as a route, because `getStaticPaths()` maps over
  `CATEGORIES`.
- The chip bar shows a `fellowships` chip with its live count.
- The footer, the region ordering, the deadline badges, the "New" pill, the
  closing-soon logic, the archive, the detail page and the RSS feed all work,
  because they operate on the listing shape, not on the category name.

**4. Point the scout at it.** A new lane subagent for `fellowships` in the
scout's fan-out, writing to the same `raw/` format. No change to the editor,
verifier or poster — they are category-agnostic.

**5. Commit.** The diff is two added lines and one migration.

## What a new type must NOT require

- Editing `src/pages/index.astro` — the home board is category-agnostic.
- Editing the API's field whitelist — `title/org/category/deadline/evergreen/
  eligibility/link/region/summary` cover every listing kind; a type that needs a
  genuinely new field (say `award_amount` on grants) is the one case below.
- Touching the render path for existing categories.

## The one deeper case: a type with an extra field

The PRD forbids per-category columns, so a new field is added **once, for all
listings**, as a nullable column — never as a per-category branch:

```prisma
model Listing {
  ...
  awardAmount String?   // new optional field, all categories
}
```

Then `ListingView` in `src/lib/listings.ts` gains the field, the API whitelist
accepts it if it should be settable at ingest, and the component that wants it
renders it conditionally. Existing rows are simply `null`. No migration of
existing data, no category switch, no rewrite.

## Why this holds

- **One registry.** `category-map.ts` is the only module that knows the
  kebab↔snake mapping (TRD §3). Nothing re-derives it, so the mapping can never
  drift between the API and the URLs.
- **Enum-driven routes.** `[category].astro` builds itself from the list.
- **Shape-agnostic components.** Every component takes a `ListingView` and never
  asks which category it is, except to label it.
- **A whitelisted API.** The row is rebuilt from validated values, so a new
  column cannot be written by an unrecognised body field by accident.

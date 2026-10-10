# klawhub — Implementation Plan for Builder

> Ordered, checkable tasks. Work them top to bottom — later tasks depend on earlier
> ones. Each task carries exactly one **acceptance criterion** and a list of the files it
> touches. The owner verifies against the criterion; a task is done when the criterion is
> demonstrably met, not when the code "looks right."
>
> Governing docs: `PRD.md` (what), `TRD.md` (engineering contract), `flow.md` (the
> pipeline this build must serve), `design-language.md` (binding CSS/visual rules).
> Where this plan and the TRD disagree, the TRD wins; where the TRD and the PRD
> disagree, the PRD wins. A deviation from either is a spec change and needs owner
> sign-off before the code lands.

---

## Task 0 — Design variants FIRST (blocks everything)

**Before writing any site code**, produce **three distinct design variants as mockups**
for owner review and approval. Do not start Task 1 until the owner has named the winner.

- Deliver three variants. Each is a rendered mockup the owner can view side by side
  without running code: either HTML files exported to PNG/PDF via a headless browser, or
  a Figma file built through the Figma MCP. Do not ship "code you have to run to see."
- Each variant must cover, at minimum:
  - homepage hero (with the tagline "Opportunities, klawed first.")
  - one listing card in **two states** — live dated deadline, and "Rolling" evergreen
  - a category page strip (three or more cards filtered to one category)
  - the About page opening block
- All three must obey `design-language.md` — light editorial, no dark-by-default, no
  glassmorphism, no gradient decoration, no icon-tile grids, two-tone headings,
  generous whitespace, one accent, pill/radius shape language. They must differ in
  **layout, type scale, and accent colour**, never by breaking those rules.
- **No generic or stock icons or imagery in the mockups.** No lucide/heroicons/devicon/
  font-awesome tiles. Icons are precise inline SVG glyphs that mean something, or the
  org's real logo. Any image that must be generated is delegated to a subagent using the
  `muse-media` skill / `image_generate` tool — never fabricated inline, never a
  placeholder rectangle.
- Record for each variant, in one or two lines: the accent colour, the type pairing, and
  the layout logic. The owner's choice must be reproducible in code.

**Files touched:** `klaw/docs/design-variants/` (new — three rendered mockups plus a
one-paragraph spec note per variant). No `.astro` files may exist yet.

**Acceptance criterion:** three mockups exist in `klaw/docs/design-variants/`; the owner
has named the winner in the builder's chat; and the winning variant's spec (accent, type
pairing, layout logic) is written down in that folder **before** any `.astro` file is
created. A variant that uses glassmorphism, gradients-as-decoration, dark-by-default, or
an icon-tile grid is rejected regardless of how good it looks.

---

## Task 1 — Scaffold the Astro project

- Create the Astro app at `klaw/site/`. Latest stable Astro, static output, TypeScript,
  content collections enabled.
- Create `src/pages`, `src/components`, `src/layouts`, `src/styles`, `src/content`,
  `public/`.
- `.gitignore` from the first commit must include `.env`, `node_modules`, `dist/`,
  `.vercel`, and the `quarantine/` folders if they'd otherwise be committed (TRD §2 —
  check before the first push).
- Add `.env.example` documenting `KLAWHUB_API_KEY` and `POSTGRES_PRISMA_URL` with empty
  values. `.env.example` is the only env file committed.
- Commit on a branch and open a PR against `main`. Do not merge yet.

**Files touched:** `klaw/site/package.json`, `klaw/site/astro.config.mjs`,
`klaw/site/tsconfig.json`, `klaw/site/.gitignore`, `klaw/site/.env.example`,
`klaw/site/src/**` (placeholder only).

**Acceptance criterion:** `npm run dev` serves a placeholder page locally, and the PR
diff shows `.env` ignored and `.env.example` committed with empty values. Owner inspects
the PR before it merges.

---

## Task 2 — Prisma schema and migrations

- Implement the schema from `TRD.md` §3 exactly: `Listing` model, `Category` enum
  (snake_case values), `Region` enum, `Status` enum, and the three indexes
  (`[category, region]`, `[status, deadline]`, `[createdAt]`).
- Write the kebab↔snake enum mapping helper **once, in one module** — the API and URLs
  accept `ai-credits` / `student-deals`, the DB stores `ai_credits` / `student_deals`.
  Cover it with unit tests for all ten categories.
- Run `prisma migrate dev` locally against a dev database and commit
  `prisma/migrations/`.
- Add a seed script inserting at minimum: one listing per category, plus one Nigeria,
  one Africa, one global, and one evergreen. Guard the seed so it cannot run against
  production.

**Files touched:** `klaw/site/prisma/schema.prisma`,
`klaw/site/prisma/migrations/**`,
`klaw/site/src/lib/category-map.ts` (the kebab↔snake helper),
`klaw/site/src/lib/category-map.test.ts`,
`klaw/site/prisma/seed.ts`.

**Acceptance criterion:** `prisma migrate deploy` succeeds against the connected Vercel
Postgres; `prisma studio` shows the `Listing` table with exactly the TRD §3 fields; and
the kebab↔snake mapping unit test passes for all ten categories plus the three regions.

---

## Task 3 — The Content API

- `POST /api/listings` at `klaw/site/src/pages/api/listings.ts`, keyed with the
  `x-api-key` header compared constant-time against `process.env.KLAWHUB_API_KEY`.
- Implement the full validation contract from `TRD.md` §4 — every row, every error code:
  `401 unauthorized`, `400 invalid_json`, `400 missing_fields`, `400 bad_category`,
  `400 bad_region`, `400 bad_link`, `400 bad_deadline`, `409 duplicate`.
- Enforce both directions of the deadline rule: `evergreen=false` requires a future
  `deadline`; `evergreen=true` requires `deadline` to be null.
- Validate `link` for the `https:` scheme and a parseable host; cap it no shorter than
  2048 characters so a real application URL is never truncated.
- Success returns `201 {"id":"<cuid>","status":"live"}` and writes the row.
- The key string must never appear in a response body or a log line.

**Files touched:** `klaw/site/src/pages/api/listings.ts`,
`klaw/site/src/lib/validate-listing.ts`,
`klaw/site/src/lib/env.ts` (env access), a test script under `klaw/site/tests/`.

**Acceptance criterion:** a test script exercises every validation row and each returns
the specified status code and error string; a valid body returns `201` and the row is
queryable in the DB; a wrong or missing key returns `401`; and a grep of the response
bodies and build output shows the key string nowhere.

---

## Task 4 — Design system from the winning variant

- Implement the owner-approved Task 0 variant as real CSS: tokens in
  `src/styles/tokens.css` (accent, type scale, spacing, radii), global styles in
  `src/styles/global.css`.
- `Base.astro` layout carrying the type pairing, two-tone heading treatment, whitespace
  scale, and pill/radius shape language from the winning variant.
- Icon policy enforced: precise inline SVG glyphs only, or real org logos. **No lucide,
  heroicons, devicon, or font-awesome stock tiles as page furniture.** Any generated
  image is delegated to a subagent via `muse-media` / `image_generate`, saved to
  `public/` with a provenance note (prompt, model, date) in the commit message.
- No `backdrop-filter` decoration, no gradient decoration, no dark-mode default.

**Files touched:** `klaw/site/src/styles/tokens.css`,
`klaw/site/src/styles/global.css`,
`klaw/site/src/layouts/Base.astro`,
`klaw/site/src/components/icons/*.astro` (inline SVG only),
`klaw/site/public/` (generated assets only, with provenance notes).

**Acceptance criterion:** a static review page renders the hero, nav, a card, and a
button in the approved design; the owner confirms it matches the chosen variant; and a
grep of the source shows no glassmorphism, no gradient decoration, and no stock-icon
imports.

---

## Task 5 — Homepage and listing components

- `ListingCard.astro` — title, org, category, region, deadline countdown or "Rolling",
  and a direct Apply link (the listing's `link`, nothing else).
- Homepage: hero with "Opportunities, klawed first.", then listings grouped by category,
  ordered **nigeria → africa → global**, then `createdAt desc` within region.
- `DeadlineBadge.astro` — a countdown when dated, "Rolling" when evergreen. Expired
  listings (`deadline < now`, `evergreen` false) are filtered out of live surfaces at
  render, never hard-deleted.
- **Every UI string is humanized** — hero, nav labels, "Rolling", empty state, About
  copy. Run each through the `humanizer` skill before it ships. This is a build
  acceptance criterion, not a nice-to-have (TRD §6).

**Files touched:** `klaw/site/src/components/ListingCard.astro`,
`klaw/site/src/components/DeadlineBadge.astro`,
`klaw/site/src/components/CategoryNav.astro`,
`klaw/site/src/components/Hero.astro`,
`klaw/site/src/pages/index.astro`,
`klaw/site/src/lib/listings.ts` (query + ordering logic).

**Acceptance criterion:** the seeded listings render on the homepage in Nigeria-first
order with correct deadline/"Rolling" badges; an expired seeded listing does not appear
on any live surface; and the owner signs off that the copy carries no AI-slop voice.

---

## Task 6 — Category pages and detail pages

- A static route per category generated from the enum (`/jobs`, `/ai-credits`, …), so
  adding a category never means hand-writing a page file.
- Detail page at `/listings/[slug]`: full listing, one Apply button, countdown or
  "Rolling". Slug = slugified title + short id suffix, stored at ingest.
- `/about` page stating the PRD hard rules in plain language — what klawhub is, that a
  bot writes each listing, that links are verified, and who runs it.

**Files touched:** `klaw/site/src/pages/[category].astro`,
`klaw/site/src/pages/listings/[slug].astro`,
`klaw/site/src/pages/about.astro`,
`klaw/site/src/lib/slug.ts`,
`klaw/site/src/lib/listings.ts` (slug lookup added).

**Acceptance criterion:** all ten category routes build and render their filtered
listings; a detail page renders for a seeded listing with a working Apply button pointing
at the direct URL; and `/about` reads plainly on one screen.

---

## Task 7 — Newsletter signup (non-blocking)

- Buttondown or Brevo free-tier embed: one field, one button, honest cadence copy
  (humanized). No interstitials, no exit-intent, no nag before value.
- Not in the critical path — the board must ship without it.

**Files touched:** `klaw/site/src/components/NewsletterSignup.astro`,
`klaw/site/src/pages/index.astro` (mount point).

**Acceptance criterion:** the form submits to the provider's endpoint with a test
address; the copy is humanized; and the component is not interstitially triggered
anywhere on the site.

---

## Task 8 — Wire the pipeline, deploy, smoke test

- Deploy to Vercel, bound to the Vercel Postgres integration. Migrations run as part of
  the build (`prisma migrate deploy` in the build command, or the integration's
  postinstall hook). A migration failure blocks the deploy — never force-past it.
- Set `KLAWHUB_API_KEY` in Vercel Production **and** Preview env scopes. Confirm it is
  absent from the repo and from the built client bundle (`grep` the build output).
- End-to-end check with the real poster flow: `POST /api/listings` with a valid body →
  the listing renders on the homepage within one revalidation cycle.
- Post-deploy smoke (TRD §8): homepage loads, one category page loads, one detail page
  loads, and a bad-key `POST /api/listings` returns `401`.
- Confirm quarantine folders are not committed and not deployed.

**Files touched:** `klaw/site/vercel.json` (if used), `klaw/site/package.json` (build
script), Vercel project settings (env vars, build command), `klaw/site/.gitignore`
(re-verified), `klaw/.gitignore` (quarantine folders).

**Acceptance criterion:** klawhub.xyz serves the live board; a listing posted through the
Content API appears on the homepage; the bad-key request returns `401`; and the key
string is absent from both the repo and the built client assets. Owner runs the smoke
check on production and confirms.

---

## Definition of done (the owner verifies the whole build against this)

1. `npm run build` passes clean on `main`; production deploy is live on klawhub.xyz.
2. The Content API passes every validation row and the 401 case (TRD §10).
3. The Prisma schema matches `TRD.md` §3 exactly, including the enum kebab↔snake
   mapping.
4. The site matches the owner-approved design variant and `design-language.md` — light,
   editorial, no glass, no gradient decoration, no icon-tile grids, real assets only.
5. No generic or stock icons or imagery anywhere; any generated image carries a recorded
   provenance note (prompt, model, date).
6. All UI copy is humanized — no AI-slop voice anywhere on the surface.
7. Nigeria-first ordering is visible on the homepage and on every category page.
8. Secrets are out of the repo and out of the client bundle.
9. The pipeline in `flow.md` can run end to end: poster posts, the API accepts, the
   listing renders. Task 8's smoke check is the proof.

**A task that misses its acceptance criterion is returned to builder with a specific
note. It does not ship, and the bar does not move.**

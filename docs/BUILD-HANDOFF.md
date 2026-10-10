# STEP 1 — Connect the database (do this FIRST, in the browser)

The builder will build against a REAL database. It must exist before the prompt is run,
so it never has a reason to spin up Docker again.

## 1a. Create the Vercel project
1. Go to https://vercel.com/new
2. Import the GitHub repo: `timilehin-dev/klawed`
3. Framework preset: **Astro** (or leave "Other" — it will be replaced by our config)
4. **Do not deploy yet** — just create the project so a Storage store can attach to it.
   (Team: the one you already have, `team_j6zJZNoFlnCP5hIrZXA3wG8z`)

## 1b. Add a Postgres database (Neon) to that project
1. In the Vercel project → **Storage** tab → **Create Database**
2. Choose **Postgres** (powered by Neon)
3. Region: pick the closest to Nigeria/Africa available (e.g. `eu-west-1` / `iad1`)
4. Name it: `klawed-db`
5. **Connect** it to the `klawed` project → Vercel injects the env vars automatically.

## 1c. Copy the connection strings into the workspace
Vercel injects these (names may vary slightly by integration version):
- `POSTGRES_PRISMA_URL`      ← pooled URL — Prisma uses this at runtime
- `POSTGRES_URL_NON_POOLING` ← direct URL — used for migrations
- `POSTGRES_URL`             ← base URL

Create/open `C:\Users\HP\klaw\.env` and add (paste the REAL values):

```
POSTGRES_PRISMA_URL="postgres://...-pooler...?sslmode=require"
POSTGRES_URL_NON_POOLING="postgres://...?sslmode=require"
```

(Keep the existing `GITHUB_TOKEN` and `KLAWHUB_API_KEY` lines that are already there.)

## 1d. Confirm to me
Say "db connected" and I will hand you the builder prompt (already written, see below).

---
# STEP 2 — The builder prompt

Copy EVERYTHING between the lines into the builder's chat:

═══════════════════════════════════════════════════════════════════

You are the Builder for **Klawed** (klawhub.xyz) — a curated opportunities board for
builders. Nigeria-first, then Africa, then global. Tagline: "Opportunities, klawed first."

## MISSION
Build the site **from scratch, full-stack, at `C:\Users\HP\klaw\site\`**.
A previous attempt produced 47 unverified files; they have been DELETED. You are starting
clean. There is NO `site/` directory yet — create it.

This is a real full-stack application, NOT an HTML mockup and NOT a static site.

## READ FIRST (binding — authoritative)
Read all of these before writing any code:
- `C:\Users\HP\klaw\docs\PRD.md`            — product requirements
- `C:\Users\HP\klaw\docs\TRD.md`            — technical requirements (stack, schema, API)
- `C:\Users\HP\klaw\docs\flow.md`           — the pipeline
- `C:\Users\HP\klaw\docs\plan.md`           — the implementation plan + acceptance criteria
- `C:\Users\HP\klaw\docs\design-language.md`— BINDING visual spec (tokens, bans)
- `C:\Users\HP\klaw\docs\design-variants\variant-c-the-wire.html` — the APPROVED design
- `C:\Users\HP\klaw\docs\design-variants\README.md` — Variant C rationale

## STACK (exact — do not substitute)
- **Astro** + **Tailwind CSS**
- **Prisma** ORM + **Vercel Postgres (Neon)** — already provisioned
- A keyed **Content API**: `POST /api/listings`, auth `Bearer KLAWHUB_API_KEY`
- Deploy target: **Vercel** (do not deploy — just make it deployable)

## ENVIRONMENT — read this twice
- `C:\Users\HP\klaw\.env` holds the real secrets: `GITHUB_TOKEN`, `KLAWHUB_API_KEY`,
  and the database URLs (`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`).
- **THE DATABASE IS ALREADY CONNECTED. It is Vercel Postgres (Neon).**
- Prisma schema: `url = env("POSTGRES_PRISMA_URL")`, `directUrl = env("POSTGRES_URL_NON_POOLING")`.
- Verify the connection actually works by running a real migration — that IS your DB test.

## ABSOLUTE PROHIBITIONS (violating any of these fails the task)
1. **DO NOT start Docker. DO NOT run any `docker` command. DO NOT provision any local
   database** (no local postgres, no sqlite fallback, no embedded DB). The database
   already exists on Vercel/Neon. Use the connection string in `.env`. This is not
   negotiable — a previous run started Docker Desktop on an 8GB laptop and it was wrong.
2. **DO NOT use mock, sample, or placeholder data anywhere.** No invented orgs, no fake
   deadlines, no demo listings. The database seeds to a clean EMPTY state; every listing
   arrives only through the Content API from the pipeline. The zero-listings state must
   render correctly and look intentional.
3. **DO NOT push to GitHub.** Commit locally only.
4. **DO NOT create the Vercel project or deploy.** The human owns that.
5. **NO generic/unreal icons, NO stock imagery.** Thin-line inline SVG only where it aids
   scanning. Any generated image must be delegated to a subagent (muse-media skill).
6. **DO NOT break prompt caching or edit files outside `C:\Users\HP\klaw\site\`.**

## DESIGN — Variant C, exact
Build the approved design faithfully: the dateline bar, the "This week's openings"
masthead with issue number, the two-column front page with the "In this week's issue"
sidebar, entries filed under **date headers**, and the dark "Closing Soon" block.
Obey `design-language.md` exactly:
- accent `#0e7a46`, base `#ffffff`, band `#f4f4f5`, near-black `#0b0b0b`,
  body gray `#71717a`, hairline `#e4e4e7`
- Newsreader (display) + IBM Plex Sans (body)
- two-tone headings (clause 1 near-black, clause 2 gray)
- **EXPLORE surface** — a working board, NOT a marketing landing page
- **BANNED:** dark-by-default, glassmorphism, gradient decoration, icon-tile grids,
  centered-hero-plus-three-cards, drop shadows on light cards

## EXTENSIBILITY (required)
New listing types (news, fellowships, meetups, competitions) must be addable as a **new
Scout lane + a new enum value / field**, WITHOUT rewriting the core. Design the schema,
the category map, and the API validation so a new category is a data change, not a code
surgery. Say so in your report.

## ORCHESTRATION
You have the **dynamic-workflow** skill — load it (`skill_view name=dynamic-workflow`).
Use plan-in-code fan-outs for the parallelizable work (schema, API, pages, components).
Set a goal, work in waves, commit per verified step (locally).

## VERIFY BEFORE YOU REPORT (mandatory — no claims without proof)
Run these and paste the REAL output:
1. `npm install` completes
2. `npx prisma generate` succeeds
3. `npx prisma migrate deploy` (or `migrate dev`) runs against the real Neon URL — proves the DB works
4. `npm run build` succeeds — the Astro build actually produces output
5. A real request to `POST /api/listings` with the key creates a row; a request with a
   bad key returns 401; a malformed body returns 400

If any step fails, report the REAL error. An honest blocker beats an invented success.

## REPORT WHEN DONE
- What you built, and the file tree of `site/`
- The **real** output of the build + migration commands
- The Content API contract as actually implemented (fields, validation, status codes)
- The Prisma schema
- How extensibility works (add-a-category walkthrough)
- Exact human steps left (env vars, Vercel link/deploy)

═══════════════════════════════════════════════════════════════════

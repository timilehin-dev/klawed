# Design-law deviations from Variant C

Variant C "The Wire" is the approved design. The build follows it, with a small
number of deliberate departures. Each is listed here with the reason, so the
owner can accept or reject them rather than discover them in an audit.

Nothing here changes a token, a type pairing, a colour rule, or a ban.

## 1. The dateline's live-status line is conditional

The mockup's dateline reads `Thu 9 Oct 2026 · 07:10 · 97 open · 11 closing this week`.
In the build the counts are appended **only when they are known** — while the
board is loading, or if the database is unreachable, the date and clock still
render and the counts are omitted rather than showing a fabricated `0 open`.

Why: a hard `0 open` on a transient DB failure would read as "this board is
empty" when it is not. Rendering nothing is honest; rendering a zero is a lie.
TRD §9 requires the unreachable case to degrade quietly.

## 2. The "In this week's issue" sidebar is spread across categories

The mockup's sidebar lists five listings in filing order. The build takes the
**newest listing per category**, cycling through categories until five are
collected (`frontPage(board, 5)` in `src/lib/listings.ts`).

Why: the sidebar is the front page's only sample of the board's range. With a
board where one category dominates — very likely for a jobs-first site —
filing order would show five jobs and imply that is all there is. The mockup's
own sample data is already spread this way across five different categories, so
this matches its intent rather than its literal ordering.

## 3. The sidebar and Closing-Soon block hide on an empty board

With zero listings the masthead still renders in full — the dateline, the rule,
"This week's openings" with its issue number, the two-tone tagline, the lede, and
the live-status line — but the sidebar, the Closing-Soon block and the feed are
replaced by a single intentional empty state.

Why: an empty sidebar and an empty dark block would render as broken furniture.
The PRD requires the zero-listings state to look intentional, and the masthead is
what carries the publication's identity.

## 4. Slug column added to the schema

`slug String @unique` is not in TRD §3's field list. TRD §6 requires a
`/listings/[slug]` detail page, and a slug has to be stored somewhere.

It is generated server-side from the title plus a suffix of the row id, in the
same INSERT that creates the row. It is never derived from client input, so it
cannot be spoofed, and the id suffix means two listings with the same title do
not collide on the unique index.

## 5. `output: 'server'` rather than a static build

plan.md Task 1 says "static output". This is a server build, and the reasoning
is recorded in `astro.config.mjs`.

Why: plan.md's own preamble says the TRD wins on conflict. A static build cannot
serve a live `POST /api/listings`, cannot read the database at request time, and
cannot render TRD §9's "board is being refreshed" state. The API and the DB read
path are not optional features of this product.

The practical consequence: the board renders on demand, so the Vercel Postgres
connection is on the hot path for every page view. That is what TRD §6 specifies
("Listings are read server-side and rendered to HTML. No client-side data
fetching for the board.").

## 6. Two headers accepted for the API key

TRD §4 specifies `x-api-key`. The route also accepts `Authorization: Bearer
<key>`.

Why: flow.md §2's diagram labels the poster's request as `x-api-key, Bearer`, and
the operator's brief specifies Bearer. The two documents disagree, so the route
accepts either rather than letting the pipeline 401 over a header name. Both go
through the same constant-time comparison; accepting one extra form widens
nothing.

## 7. Migrations are opt-in per build

TRD §8 says migrations run as part of the Vercel build. The build command runs
`npm run db:migrate:ci`, which **skips unless `RUN_MIGRATIONS=true`**.

Why: an unattended build must not migrate production on every push, and two
concurrent builds (production plus a preview branch) would race on the migration
advisory lock. A migration failure still exits non-zero and blocks the deploy —
TRD §8's requirement holds. The human sets the flag on the build that releases a
schema change.

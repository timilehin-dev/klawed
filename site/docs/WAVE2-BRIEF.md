# klawed — Wave 2 build brief (READ FULLY BEFORE WRITING CODE)

You are building part of **klawed** (klawhub.xyz), a curated opportunities board for
builders — Nigeria-first, then Africa, then global. It is an **Astro 5 (server output)
+ Tailwind v4 + Prisma** app at `C:\Users\HP\klaw\site\`. The foundation (config,
Prisma schema, lib modules, migration) is **already committed**. You are writing
files that consume it. Do not modify committed foundation files unless your task says so.

## Your non-negotiables

1. **NO MOCK DATA. ZERO invented listings.** Never write a hardcoded org, title,
   deadline, link, count, or summary into any file. Every listing comes from the
   database through `loadBoard()`. The empty board must render cleanly and look
   intentional. This is the single most important rule in the project.
2. **NO secrets.** Never reference `KLAWHUB_API_KEY`, any DB URL, or any value from
   `.env` in a page or component. The API key is read only inside
   `src/lib/env.ts` and only inside `src/pages/api/listings.ts`.
3. **Design tokens only.** Import `../styles/tokens.css`. Use the CSS variables
   (`var(--accent)`, `var(--ink-2)`, `var(--radius-card)`, …). Never hardcode a hex
   colour, a font stack, a radius, or a spacing value in a component. Never use a
   Tailwind colour utility for anything the token set covers.
4. **Icons: thin-line inline SVG only, hand-authored, `currentColor`, ~16px, and only
   where the icon genuinely aids scanning.** Banned as furniture: lucide, heroicons,
   devicon, font-awesome, any icon library, any "icon in a rounded tile" grid, stock
   photography, decorative SVG blobs, placeholder grey boxes, emoji-as-icons.
5. **No drop shadows on light cards.** Depth comes only from: solid near-black cards,
   flat `--band`/`--accent-tint` fills, and 1px `--hairline` borders.
6. **Copy must be humanised** — plain, specific, no AI-slop ("elevate", "seamlessly",
   "unlock", "empower", "delve", "in today's fast-paced world", "look no further",
   tricolon lists, "It's not just X, it's Y"). Write like a person who edits a
   newsletter. No exclamation marks. Never fabricate a fact.
7. **Do not run `npm run build`, `npm install`, or `git commit`.** The parent owns the
   build and the commits. Do not touch files outside `src/`, `public/`, `prisma/seed.mjs`
   and `tests/`. Never run any `docker` command.
8. **Write complete, working files** — no TODO stubs, no pseudo-code, no
   "// implement later". Assume the file will be built immediately.

## The design — Variant C "The Wire" (approved)

A **dated dispatch**, not a marketing landing page. The home page is an **EXPLORE
surface**: a working board.

- **Colours:** accent `#0e7a46`, base `#ffffff`, band `#f4f4f5`, near-black `#0b0b0b`,
  body gray `#71717a`, hairline `#e4e4e7`. One accent only, reserved for: primary
  buttons, the Nigeria region tag, status/New pills, and ONE footer line.
- **Type:** Newsreader (display, headings, masthead) + IBM Plex Sans (body, UI, feed).
  Loaded once in `Base.astro` via the Google Fonts link already specified.
- **Two-tone headings (exact markup):** clause 1 near-black, clause 2 gray, same
  weight, split at a clause boundary, no `<br>` inside:
  `<h2 class="section-title"><span class="tone-1">Open right now,</span> <span class="tone-2">closing soon.</span></h2>`
  CSS is `.tone-1{color:var(--ink)} .tone-2{color:var(--body)}`.
- **BANNED:** dark-mode-by-default or a `prefers-color-scheme` hijack, glassmorphism
  (`backdrop-filter`), gradient decoration, icon-tile grids, centered-hero-plus-three-
  equal-cards, drop shadows on light cards.
- **Motion:** 200ms `var(--ease)` only. Hover lift `translateY(-2px)` on rows/cards with
  the border darkening. Nothing autoplays. `prefers-reduced-motion` must disable all
  transitions/transforms.
- **A11y:** one `<h1>` per page. 44px minimum hit targets on interactive controls.
  `:focus-visible` gets a 2px `var(--accent)` outline at 2px offset — never
  `outline:none`. Body text ≥7:1 contrast (use `--ink-2`/`--body-2`); `--body` is for
  meta only. Badges carry a word, never colour alone.

## The shape of Variant C, top to bottom (home page)

1. **Dateline bar** — a thin top strip: left "The Wire · klawed dispatch · Lagos, WAT",
   right a live status line (date + time in WAT, total open, closing count). Real
   values only, all computed from `loadBoard()`.
2. **Sticky filter bar** — wordmark left, the ten category chips with live counts plus a
   "closing soon" chip, region links right (Nigeria/Africa/Global). Active chip is
   `--ink` fill with white text.
3. **Dispatch masthead** — a 2px `--ink` rule, then "This week's openings" with an issue
   number (ISO week) and the compiled date. Two columns: left the two-tone tagline
   `<h1>Opportunities, klawed first.</h1>` + one lede line + a quiet live-status line;
   right an "In this week's issue" sidebar (newest listing per category, spread across
   categories, not five of one kind) each showing title + "category · region · filed <date>".
   **No CTA buttons in the masthead** — the board below is the call to action.
4. **Closing Soon** — the one sanctioned near-black solid card (`--ink` fill,
   `--radius-card-lg`), titled with a two-tone h3, holding ≤7-day listings as compact
   two-column items with countdown badges. First-class, never buried.
5. **The dated wire** — section heading "The board, filed by day." Entries grouped
   under **date headers** ("9 Oct" + "Thu" + a hairline rule + region label), each entry
   a row-card: filing stamp, title (+ "New" pill within 72h), meta line
   (org · category · filed HH:MM), 2-line-clamped summary, and a right column with
   region tag, deadline badge, and an "Apply" affordance (small right-arrow glyph +
   "Apply" in accent).
6. **Archive strip** — expired listings, muted, strikethrough "Closed <date>", labelled
   as kept in the archive. Renders nothing when the archive is empty.
7. **About block**, then the **newsletter block** (one email field + one button, honest
   one-line cadence copy, never an interstitial), then the **footer** (wordmark, one
   2px accent rule, category nav, About, one small humanised line about checking links).

**Empty state:** when `board.total === 0` and not unreachable, render an intentional
"nothing filed yet" block in place of the feed — humanised, plain, not an error.

**DB-unreachable state:** when `board.unreachable` is true, render a quiet humanised
"the board is being refreshed" message. Never a stack trace, never a raw error.

## The interfaces you consume (already committed — trust these exactly)

```ts
// src/lib/listings.ts
interface ListingView {
  id: string; slug: string; title: string; org: string;
  category: string;           // PUBLIC kebab slug, e.g. 'ai-credits'
  deadline: Date | null;
  evergreen: boolean;
  eligibility: string;
  link: string;               // direct https URL, already validated
  region: string;             // 'nigeria' | 'africa' | 'global'
  summary: string;
  createdAt: Date;
}
interface Board {
  live: ListingView[];        // Nigeria-first, newest first within region
  closingSoon: ListingView[]; // deadline <= 7 days out
  archive: ListingView[];     // past-deadline, kept not deleted
  counts: Record<string, number>; // per PUBLIC kebab slug
  total: number;
  unreachable: boolean;       // DB down -> render refresh state
}
function loadBoard(now: Date): Promise<Board>;
function loadCategory(category: string, now: Date): Promise<Board>;
function loadBySlug(slug: string, now: Date): Promise<ListingView | null>;
function frontPage(board: Board, limit: number): ListingView[];

// src/lib/category-map.ts
CATEGORIES: readonly { kebab: string; snake: string; label: string }[]  // the ten, in order
REGIONS: readonly string[]   // ['nigeria','africa','global'] = sort order
toKebab(snake): string; toSnake(kebab): string | null;
isCategoryKebab(v): boolean; isRegion(v): boolean;

// src/lib/format.ts  (all dates render in Africa/Lagos WAT)
formatDayMonth(d): '9 Oct'      formatDow(d): 'Thu'
formatWeekday(d): 'Thursday'    formatLongDate(d): '9 October 2026'
formatWatTime(d): '07:10'       formatDatelineDate(d): 'Thu 9 Oct 2026'
formatFilingTime(d): '09:00'    isoWeek(d): 41
deadlineState(deadline, evergreen, now): 'rolling'|'closed'|'today'|'closing'|'safe'
daysLeft(deadline, now): number
formatClosesDate(d): 'Closes 12 Nov'   formatClosedDate(d): 'Closed 1 Nov'
isNew(createdAt, now): boolean   isExpired(d, evergreen, now): boolean
plural(n, one, many): string

// src/lib/env.ts
apiKey(); hasApiKey(); prismaUrl(); hasDatabase(); siteUrl();
```

Deadline badge copy by state (design-language §5.3): `rolling` → "Rolling" (outlined,
quiet); `safe` → "Closes 12 Nov" (band fill, no urgency colour); `closing` →
"3 days left" (amber, urgent); `today` → "Closes today"; `closed` → archive only.

Region tag tiers (encode Nigeria-first): `nigeria` = solid accent + white text;
`africa` = outlined ink; `global` = muted band.

## Report back

When done, reply with: the exact list of files you wrote, and for each a one-line
statement of what it renders and which lib interface it consumes. State plainly
anything you could not complete or any interface mismatch you hit. Do not claim a
build passes — you do not run the build.

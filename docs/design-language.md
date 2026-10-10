# klawhub — Design Language (binding)

> Site: **klawhub.xyz** · Brand voice: **Klawed.** "Opportunities, klawed first."
> Owner: `owner`. Status: **authoritative and binding on all CSS/visual output.**
> This file is the visual contract referenced by `PRD.md` §7.6, `TRD.md` §7, and
> `plan.md` **Task 0**. Task 0's three variants are reviewed *against this document*; the
> owner approves one; `plan.md` Task 4 implements the winner using this file's tokens.
> Where a variant, a component, or a builder instinct disagrees with this file, this file
> wins. A deviation is a spec change and needs owner sign-off.

Aesthetic lineage: **Kage** (`kage.design`) and **minimal.gallery** — a light, editorial,
confidently typeset system. Hierarchy comes from **type scale, weight, colour and
whitespace** — never from boxes, shadows, gradients or icons.

---

## 1. Design posture

### What we are doing
A **light, editorial opportunities board** for builders, Nigeria-first. Big confident
type, generous whitespace, one saturated accent, a pill/radius shape language, and a
working dated feed as the primary surface. It should read like a **well-set publication
that happens to be live** — closer to a curated gazette than a SaaS dashboard.

### What we are NOT doing (the ban list — non-negotiable)
These bans are taken verbatim from the owner and repeated across `PRD.md` §7 and
`TRD.md` §7. Any variant or build that breaks one is **rejected regardless of how good
it looks**:

1. **No dark-mode by default.** No dark-first theme, and no `prefers-color-scheme: dark`
   hijack. Light is the default and the only shipped theme in v1.
2. **No glassmorphism.** No `backdrop-filter` blur panels, no frosted/translucent
   surfaces used as decoration.
3. **No gradient decoration.** No decorative gradients anywhere. Flat colour only. (A
   single flat accent is fine; gradients are not.)
4. **No icon-tile grids.** No grid of rounded-square boxes each holding an icon (the
   "lucide in a tile" pattern). Banned as page furniture.
5. **No generic or unreal icons.** No off-the-shelf icon-set stock (lucide, heroicons,
   devicon, font-awesome, etc.) as decoration. See §7.
6. **No stock imagery.** No stock photos, no filler photography.
7. **No decorative SVG illustrations pretending to be product imagery.** No abstract
   "hero blob" / "isometric dashboard" SVGs standing in for real content.
8. **No centered-hero + three-equal-feature-cards landing-page pattern.** The home page
   is a board, not a brochure. See §6.
9. **No drop shadows on light cards.** See §4.
10. **No dark patterns.** No interstitials, no exit-intent, no newsletter nag before
    value, no sponsored/featured tiers (PRD §7.5).

---

## 2. Colour system

**Refinement of the starting palette.** Neutrals are a zinc-tuned light set. The single
accent is a **deep, confident green** — chosen because Nigeria's flag is green-and-white
(so it reads instantly at home to the primary audience) and because green is the honest
colour of "go / build / ship" for a builder board. It is dark enough that white text on
it clears WCAG AA with margin (≈5.2:1), so it works as a real button fill, not just a
tint. The accent is **reserved**: primary actions, the Nigeria region tag, status pills,
and **one** footer line. Nothing else gets saturated colour.

Semantic deadline colours are a **separate, small set** and are deliberately *not* the
accent — colour on this board means **exception, not furniture**, so only urgency gets
colour and the common case stays quiet gray.

### Full token block

Drop this verbatim into `klaw/site/src/styles/tokens.css` as the `:root` block.

```css
:root {
  /* ---- Neutrals (light editorial base) ---- */
  --base:  #ffffff;   /* page background                                   */
  --band:  #f4f4f5;   /* light-gray section band / chip fill / input wash  */
  --ink:   #0b0b0b;   /* near-black: headings clause 1, solid dark cards,  */
                      /*   primary text, secondary-button border            */
  --body:  #71717a;   /* body/meta gray: secondary text, headings clause 2 */
  --hairline: #e4e4e7;/* 1px borders, dividers                            */
  --white: #ffffff;

  /* Supporting neutrals (refinements) */
  --ink-2:  #18181b;  /* softer near-black: card titles / strong body on light */
  --body-2: #52525b;  /* darker gray for small body copy that must stay AA-safe */

  /* ---- Single accent (considered Nigerian-green) ---- */
  --accent:        #0e7a46;  /* primary actions, nigeria tag, status pills,     */
                             /*   ONE footer line — and nothing else             */
  --accent-strong: #0a6238;  /* hover / pressed state of the accent            */
  --accent-tint:   #eaf5ee;  /* very light flat accent wash for one highlight   */
                             /*   band — flat fill only, never a gradient        */

  /* ---- Deadline urgency (semantic; distinct from accent) ---- */
  --deadline-safe:        var(--body);     /* >7 days — quiet neutral gray text   */
  --rolling-fg:           var(--body-2);   /* evergreen "Rolling" — quiet, outlined */
  --rolling-border:       var(--hairline);
  --closing-bg:           #fef3c7;         /* amber-100 pill fill                 */
  --closing-fg:           #92400e;         /* amber-800 text — urgent, NOT green   */
  --closing-border:       #fde68a;         /* amber-200 pill border               */
  --expired-fg:           #a1a1aa;         /* zinc-400 — muted, strikethrough,     */
                                          /*   archive surfaces only              */

  /* ---- Region tags (hierarchy reinforces Nigeria-first) ---- */
  --region-nigeria-bg:    var(--accent);   /* solid = foregrounded, first-class   */
  --region-nigeria-fg:    #ffffff;
  --region-africa-fg:     var(--ink);      /* outlined = second tier              */
  --region-africa-border: #d4d4d8;
  --region-global-bg:     var(--band);     /* muted = third tier                  */
  --region-global-fg:     var(--body);

  /* ---- Radii (pill / radius shape language) ---- */
  --radius-card:    18px;    /* listing rows, standard cards                  */
  --radius-card-lg: 24px;    /* large feature blocks, newsletter block        */
  --radius-input:   12px;    /* text inputs                                   */
  --radius-pill:    9999px;  /* buttons, chips, badges, tags (fully round)    */

  /* ---- Spacing scale (4px base) ---- */
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
  --space-5: 24px;  --space-6: 32px;  --space-8: 48px;  --space-10: 64px;
  --space-12: 96px; --space-16: 128px;

  /* ---- Layout ---- */
  --content-max: 1120px;
  --gutter: 24px;             /* 20px below 640px */

  /* ---- Type families ---- */
  --font-display: "Newsreader", Georgia, "Times New Roman", serif; /* headings/hero */
  --font-sans:    "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;

  /* ---- Motion ---- */
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --dur: 200ms;
}
```

**Contrast reference (all on `--base` #ffffff):** `--ink` ≈ 19:1 · `--ink-2` ≈ 17:1 ·
`--body-2` ≈ 7:1 · `--body` ≈ 4.7:1 (AA floor for secondary text only) · white on
`--accent` ≈ 5.2:1 · `--closing-fg` on `--closing-bg` ≈ 7:1. See §9 for the rules these
numbers enforce.

---

## 3. Typography

**Pairing: `Newsreader` (display) + `IBM Plex Sans` (body/UI).**
Why: `Newsreader` is a contemporary editorial serif with enough weight range and optical
polish to give the two-tone headings and the masthead real publication character — it
reads like a curated editorial board, not a SaaS template, which is exactly the posture
in §1. `IBM Plex Sans` is a humanist grotesque with honest, slightly technical
letterforms and strong small-size legibility for the dense feed; it is characterful
without being loud, and pairs with `Newsreader` because both share a grounded, serious
voice. Neither is "Inter by default," and both are free on Google Fonts.

Load once in `Base.astro`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

### Type scale (px)

| Token | Family | Size / weight | Line-height | Tracking | Use |
|---|---|---|---|---|---|
| `--text-display` | Newsreader | 64 / 400 | 1.04 | −0.02em | Home masthead tagline (≥1280px); scales down responsively |
| `--text-h1` | Newsreader | 40 / 500 | 1.08 | −0.01em | Section headings, page titles |
| `--text-h2` | Newsreader | 32 / 500 | 1.14 | −0.01em | Sub-section headings |
| `--text-h3` | Newsreader | 24 / 500 | 1.20 | 0 | Block headings (e.g. newsletter, closing-soon block) |
| `--text-card-title` | IBM Plex Sans | 20 / 600 | 1.28 | −0.01em | Listing card title |
| `--text-lead` | IBM Plex Sans | 18 / 400 | 1.6 | 0 | Masthead lede, detail intro |
| `--text-body` | IBM Plex Sans | 16 / 400 | 1.6 | 0 | Detail page body, summary |
| `--text-body-sm` | IBM Plex Sans | 15 / 400 | 1.55 | 0 | Card summary (2-line clamp) |
| `--text-meta` | IBM Plex Sans | 14 / 400 | 1.5 | 0 | Org · category · meta line, nav, footer links |
| `--text-label` | IBM Plex Sans | 12 / 500 | 1.3 | 0.04em | Uppercase eyebrows, section labels |
| `--text-chip` | IBM Plex Sans | 14 / 500 | 1 | 0 | Category chips, buttons, region tags |
| `--text-badge` | IBM Plex Sans | 12 / 600 | 1 | 0.02em | Deadline badges, "New" pill |

**Responsive display rule:** `--text-display` steps 64 → 48 → 36 at the 1280 / 900 /
640 breakpoints. Everything else is fixed; the feed is tuned for small sizes, not
shrunk.

### The two-tone heading device (exact)

Kage's signature: the heading splits at a **natural clause boundary** (comma or em-dash);
**clause 1 is near-black (`--ink`)**, **clause 2 is body gray (`--body`)**. Same weight,
same family — only colour differs. One real space separates the clauses; do **not** use
`<br>` inside the heading, and do **not** change weight between clauses.

Exact markup pattern:
```html
<!-- Home masthead -->
<h1 class="display">
  <span class="tone-1">Opportunities,</span>
  <span class="tone-2">klawed first.</span>
</h1>

<!-- Section heading -->
<h2 class="section-title">
  <span class="tone-1">Open right now,</span>
  <span class="tone-2">closing soon.</span>
</h2>
```

Exact CSS:
```css
.tone-1 { color: var(--ink); }
.tone-2 { color: var(--body); }
```
Both spans inherit the heading's size/weight/line-height/tracking. The space between the
two clauses lives as a literal space (or a single `&nbsp;` if a line must not break there)
**inside** the `<h1>`/`<h2>`, between the spans.

---

## 4. Shape, depth and spacing

### Radii (the shape language)
- **Cards** (listing rows, standard cards): `--radius-card` **18px**.
- **Large feature blocks** (closing-soon dark block, newsletter block): `--radius-card-lg`
  **24px**.
- **Text inputs**: `--radius-input` **12px**.
- **Pills** (buttons, chips, badges, tags, count chips): `--radius-pill` **9999px**
  (fully round). A count chip is a **circle** (equal width/height, `border-radius: 50%`).

### Depth — and the no-shadow rule
**Light cards carry NO drop shadow.** Full stop. Depth on a light surface comes from
exactly three things, used sparingly:
1. **Solid near-black cards** (`--ink` fill) — the only sanctioned "heavy" element,
   used for the Closing-Soon highlight block and the newsletter block. One per screen at
   most.
2. **Tinted frames** — a `--band` fill and/or a flat `--accent-tint` wash behind a block
   (flat fill, never a gradient).
3. **Hairline borders** — a single 1px `--hairline` border defines every light card.

A light card is therefore: `background: var(--base); border: 1px solid var(--hairline);`
and nothing else. If you reach for `box-shadow` on a light card, you are breaking the rule.

### Spacing scale and section rhythm
Use the `--space-*` tokens (4 → 128) — never arbitrary pixel values.
- **Section vertical rhythm:** `--space-12` (**96px**) between major sections; **64px**
  below 900px.
- **Masthead → first section:** `--space-10` (64px).
- **Feed row gap:** `--space-3` (12px) between stacked listing rows.
- **Card internal padding:** `20px 24px` (rows), `24px` (large blocks).
- **Max content width:** `--content-max` **1120px**, centered, with `--gutter` **24px**
  side padding (**20px** below 640px).

---

## 5. Components

Every component below is specified to the pixel. Values are concrete defaults; the
token block in §2 supplies the colours.

### 5.1 Listing row-card (the primary surface)
The home board is a vertical stack of **row-cards**. Each is a horizontal card: main
content on the left, meta on the right, whole card is one `<a>` to the direct link.
```
Row-card:
  display: grid; grid-template-columns: 1fr auto; gap: 24px;
  background: var(--base); border: 1px solid var(--hairline);
  border-radius: var(--radius-card); padding: 20px 24px;
  text-decoration: none; color: inherit;
  transition: transform var(--dur) var(--ease), border-color var(--dur) var(--ease);
```
- **Left column:** title (`--text-card-title`, `--ink-2`), then a meta line
  (`--text-meta`, `--body`) — `org · category` with the region tag pill appended, then
  the summary (`--text-body-sm`, `--body`, clamped to **2 lines**).
- **Right column** (min-width ~200px, right-aligned): region tag on top, deadline badge
  below it, then the Apply affordance (a small right-pointing arrow glyph + "Apply" in
  `--accent`, `--text-meta`, 600). Below 720px the row stacks: meta column drops under
  content, Apply becomes full-width pill.
- **Hover:** `transform: translateY(-2px)` and `border-color` shifts toward `--ink-2` at
  low alpha. **No shadow appears.**

### 5.2 Category chip with count
A pill + a circular count chip. In the top nav, inactive:
```
Chip:  height: 36px; padding: 0 16px; border: 1px solid var(--hairline);
       border-radius: var(--radius-pill); background: var(--base);
       font: var(--text-chip); color: var(--ink-2);
Count: 24px circle, background: var(--band); color: var(--body);
       font: var(--text-badge); margin-left: 8px; (the circular count chip)
Active: background: var(--ink); color: var(--white); border-color: var(--ink);
        count circle → background: rgba(255,255,255,.18); color: var(--white);
```
The ten categories (§PRD §4) are the chips; each shows its live count. A **"Closing
soon"** pseudo-chip sits with them (see §6).

### 5.3 Deadline badge (pill) — four states
```
Rolling (evergreen):  border: 1px solid var(--rolling-border); color: var(--rolling-fg);
                      background: transparent; text: "Rolling".
Safe (>7 days):       color: var(--deadline-safe); background: var(--band);
                      text: "Closes 12 Nov" (dated, no urgency colour).
Closing soon (≤7 days): background: var(--closing-bg); color: var(--closing-fg);
                      border: 1px solid var(--closing-border);
                      text: "3 days left" (or "Closes today").
Expired:              NOT rendered on live surfaces. Archive only:
                      color: var(--expired-fg); text-decoration: line-through;
                      text: "Closed 1 Nov".
All badges:           height: 26px; padding: 0 12px; border-radius: var(--radius-pill);
                      font: var(--text-badge); display: inline-flex; align-items: center.
```
`closing_soon` = deadline within 7 days (PRD §3). Only the closing-soon state carries
urgency colour.

### 5.4 Region tag (pill) — three tiers, encoding Nigeria-first
```
nigeria: background: var(--region-nigeria-bg); color: var(--region-nigeria-fg);
africa:  background: transparent; color: var(--region-africa-fg);
         border: 1px solid var(--region-africa-border);
global:  background: var(--region-global-bg); color: var(--region-global-fg);
All:     height: 24px; padding: 0 10px; border-radius: var(--radius-pill);
         font: var(--text-badge); text-transform: uppercase; letter-spacing: .04em.
```
Solid (nigeria) > outlined (africa) > muted (global) mirrors the ordering rule.

### 5.5 Status pill ("New")
Small pill on a listing `createdAt` within 72h (PRD §3):
```
"New": height: 22px; padding: 0 8px; border-radius: var(--radius-pill);
       background: var(--accent-tint); color: var(--accent-strong);
       font: var(--text-badge);
```

### 5.6 Buttons
```
Primary:   height: 44px; padding: 0 24px; border-radius: var(--radius-pill);
           background: var(--accent); color: #ffffff; font: var(--text-chip);
           border: none; transition: background var(--dur) var(--ease);
           hover/active: background: var(--accent-strong);
Secondary: height: 44px; padding: 0 24px; border-radius: var(--radius-pill);
           background: var(--base); color: var(--ink);
           border: 1px solid var(--ink); font: var(--text-chip);
           hover: background: var(--band);
```
Both are `inline-flex; align-items: center; justify-content: center;`. Apply-links inside
a row are the arrow-glyph text link from §5.1, not a full primary button (the row itself
is the link).

### 5.7 Section heading block
Left-aligned (editorial), never centered:
```
Eyebrow:   font: var(--text-label); text-transform: uppercase; color: var(--body);
           margin-bottom: var(--space-2);
Heading:   font: var(--text-h1 or --text-h2); the two-tone device (§3); margin-bottom: var(--space-3);
Lede (opt):font: var(--text-body-sm or --text-lead); color: var(--body); max-width: 60ch;
Block bottom margin: var(--space-8) (48px) to the content it introduces.
```

### 5.8 Footer
Quiet, on `--base` or `--band`, separated by a `1px` `--hairline` top border.
- Left: the wordmark ("klawhub") in Newsreader, `--ink`.
- **One accent line** — the single permitted saturated use in the footer: a short 2px
  `--accent` rule under the wordmark, or one accent-coloured link. Not a gradient, not a
  full bar.
- Nav: category links, About, newsletter anchor (`--text-meta`, `--body`).
- Small print: one humanized line (`--text-meta`, `--body-2`).
- Padding: `--space-8` top/bottom.

### 5.9 Newsletter capture
A single block (mount near the foot of the home page, never an interstitial):
```
Block:  background: var(--band); border-radius: var(--radius-card-lg);
        padding: var(--space-6); max-width: 640px; (OR the near-black solid card,
        --ink bg + white text, used at most once on the page — never both)
Heading: font: var(--text-h3); Newsreader; one-tone --ink (or white on dark);
Copy:    font: var(--text-body-sm); color: var(--body) (or band-gray on dark);
         one honest humanized line about cadence.
Row:    display:flex; gap: var(--space-3); margin-top: var(--space-4);
Input:  flex:1; height:44px; border:1px solid var(--hairline); border-radius: var(--radius-input);
        padding: 0 16px; background: var(--base); font: var(--text-body-sm);
Button: the primary button (§5.6).
```
One field, one button. No second opt-in, no nag (PRD §7.5).

---

## 6. Board layout composition

**Surface archetype (one line, binding):** The home page is an **EXPLORE surface — a
working, dated board — NOT a marketing landing page.** There is no centered hero, no
three-equal-feature-cards grid, no "how it works" tile section. The feed *is* the page.

### Composition, top to bottom
1. **Slim top bar (sticky).** Wordmark left. **This is where filtering lives:** the
   category chips with counts (§5.2) run across the bar — the ten categories plus a
   **"Closing soon"** chip. A region filter (Nigeria / Africa / Global) may sit at the
   bar's right as small text links. Filtering is therefore always in reach, never a
   separate marketing nav.
2. **Compact editorial masthead (NOT a full-viewport centered hero).** Left-aligned, in
   the content column: the two-tone tagline (`--text-display`), one humanized lede line
   (`--text-lead`, `--body`, max 60ch), and a quiet live-status line
   (`--text-meta`): e.g. "N open opportunities · updated 9 Oct". Short block, ~`--space-10`
   to the first section. **No CTA buttons here** — the board below is the call to action.
3. **"Closing Soon" — a first-class view.** Surfaced as a distinct band **above** the
   main feed: a near-black solid card (`--ink`, `--radius-card-lg`, the one sanctioned
   dark block) titled with a two-tone h3 ("Closing soon" / gray clause) that holds the
   ≤7-day listings as compact horizontal items with countdown badges. The "Closing soon"
   chip in the top bar toggles the same filter. Urgency is never buried in the feed.
4. **Main feed.** A vertical stack of listing row-cards (§5.1) at full content width,
   ordered **nigeria → africa → global**, then `createdAt desc` within region (PRD §7.9).
   No multi-column card grid. A quiet group label (`--text-label`, `--body`) may mark a
   region boundary; otherwise the region tag on each row carries it.
5. **Newsletter block** (§5.9) near the foot, then the **footer** (§5.8).

### Density vs whitespace
The **masthead and section gaps are generous** (96px rhythm, 60ch ledes) — that is the
editorial air. The **feed rows are tight and scannable** — 12px gaps, 20–24px padding,
2-line summaries, fixed small type — that is the working board. The balance is the whole
point: breathing room around the page, density inside the feed. Category pages repeat
composition 2→4 with the chip pre-filtered; the detail page is a single wide row-card
expanded (title, org, region, deadline badge, eligibility, summary, one primary Apply
button) with no related-listing spam (PRD §8).

---

## 7. Iconography and imagery rules

**Allowed (real, meaningful assets only):**
- **Precise inline SVG glyphs** — thin-line, drawn to match what they represent, used
  *only where they genuinely aid scanning*: e.g. a small right-arrow on Apply, a clock
  glyph in a deadline badge, an external-link glyph on a direct link. Hand-authored,
  currentColor, ~16px. Not decorative.
- **The org's real logo** on a listing, where licensing allows — the actual company mark,
  not a stand-in.
- **Generated assets** — any image that needs generating is **delegated by builder to a
  subagent** using the `muse-media` skill / `image_generate` tool. It lands in `public/`
  with a recorded provenance note (prompt, model, date) in the commit message (PRD §7.1.11).

**Banned (hard):**
- Generic icon-set stock as page furniture: **lucide, heroicons, devicon, font-awesome**,
  or any "icon-in-a-rounded-tile" grid.
- Stock photography of any kind.
- Decorative SVG illustrations (abstract blobs, isometric dashboards) posing as product
  imagery.
- Placeholder rectangles, gray boxes, or "image coming soon" frames.
- Emoji-as-icons in UI chrome.

Rule of thumb: **if an icon doesn't carry meaning a word would carry better, cut it.**
On this board, words and type do the work; glyphs are rare and load-bearing.

---

## 8. Motion posture

Restrained. Motion confirms an interaction; it never performs.
- **Duration:** `--dur` **200ms** for all transitions. **Easing:** `--ease`
  `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Hover lift on cards:** row-cards rise `translateY(-2px)` with the border darkening
  (§5.1). Buttons/chips transition background/border colour only. **No shadow grows.**
- **Nothing else moves.** No autoplay, no parallax, no scroll-triggered reveals beyond a
  very subtle opacity fade if truly needed, no animated counters, no carousels.
- **`prefers-reduced-motion`:** when set, **all** transitions and transforms are disabled
  (`transition: none; transform: none;`). Hover states still convey via colour change
  only. This is required, not optional:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; animation: none !important; }
  }
  ```

---

## 9. Accessibility and contrast

- **Body text:** `--ink`/`--ink-2` on `--base` — always ≥ 7:1. `--body` (#71717a) is the
  **AA floor (~4.7:1) and is for secondary/meta text only**; primary reading copy
  (summaries, detail body) must use `--ink-2` or `--body-2` (#52525b, ~7:1), never lighter
  than `--body`. Small body copy (<16px) must not sit on `--body`.
- **Badges:** closing-soon (`--closing-fg` on `--closing-bg` ≈ 7:1) and region/badge text
  all ≥ 4.5:1. Muted "expired" (#a1a1aa) is archive-only and never the sole carrier of
  meaning.
- **Buttons:** white on `--accent` ≈ 5.2:1 (AA for normal text, AAA for large). Secondary
  `--ink` on `--base` ≈ 19:1.
- **Minimum hit targets:** **44×44px** for all interactive controls (buttons, inputs,
  primary links). **36px** is acceptable only for inline chips/tags that are part of a
  larger clickable row. The row-card itself is one large target.
- **Focus visibility:** every interactive element shows a **2px `--accent` outline at 2px
  offset** on `:focus-visible`. Never `outline: none` without a replacement.
- **Semantics:** one `<h1>` per page (the masthead); listing titles are `<h3>` inside
  `<a>`; badges/tags carry text, not colour alone (the deadline state always has a word).

---

## 10. Owner self-audit checklist (run against each of the 3 Task 0 variants)

Each is a **yes/no**. A single "no" on 1–6 or 10–12 fails the variant.

1. Is the background **light** (`--base`/`--band`) with **no** dark-mode default and **no**
   `prefers-color-scheme` hijack?
2. Is there **no** glassmorphism / `backdrop-filter` blur used as decoration?
3. Is there **no** gradient used as decoration anywhere (flat colour only)?
4. Is there **no** icon-tile grid (grid of rounded squares each holding an icon)?
5. Are **all** icons either meaningful inline SVG, real org logos, or delegated-generated
   assets — **no** lucide/heroicons/devicon/font-awesome stock tiles, **no** stock photos,
   **no** decorative SVG illustrations, **no** placeholder boxes?
6. Are headings **two-tone** (clause 1 near-black, clause 2 gray) using the exact §3 markup,
   same weight, split at a clause boundary?
7. Is the **accent a single saturated colour**, used only for primary actions, the nigeria
   tag, status pills, and **one** footer line — not scattered across the page?
8. Is the home an **Explore board** (dated feed, category chips with counts, deadline
   badges, tight rows) and **not** a centered hero + three equal feature cards?
9. Is **"Closing Soon"** surfaced as a **first-class view** (its own block and/or chip)?
10. Are **light cards shadow-free**, with depth coming only from solid dark cards, tinted
    frames, and hairlines?
11. Is **motion restrained** (~200ms ease, hover lift, no autoplay/parallax) and does
    `prefers-reduced-motion` disable all transitions/transforms?
12. Do **body text, badges, and buttons** all meet ≥4.5:1 contrast, with ≥44px hit targets
    on interactive elements and visible focus rings?
13. Is **Nigeria-first ordering** visible (nigeria → africa → global), reinforced by the
    region-tag tiers (solid / outlined / muted)?

**Verdict:** a variant passing 1–12 is compliant and can be approved; the owner's choice
among compliant variants is then written down (accent, type pairing, layout logic) in
`klaw/docs/design-variants/` before any `.astro` file is created (`plan.md` Task 0).

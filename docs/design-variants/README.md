# klawhub — Task 0 design variants

Three mockups of the klawhub.xyz board, built against `../design-language.md`.
All three are **EXPLORE surfaces** — a working dated board, not a marketing landing page.
Each is a single self-contained HTML file (no build step) rendered to PNG by headless Chrome.

**Every listing in these files is illustrative sample data.** Orgs, deadlines and regions are
plausible but invented for design purposes. Nothing here is live, endorsed, or real.

Reply in the builder's chat with the winner — e.g. `variant A`. Task 1 does not start until the
owner names one.

---

## Variant A — "The Board"

`variant-a-the-board.html` · `variant-a-the-board.png`

- **What it is.** The densest, most typographic read. Tight 12px feed gaps, numbered rows
  (`01`, `02`), 15px two-line summaries, and a right-hand meta column that carries region tag,
  deadline badge and Apply on one line. Closest to a serious daily-read board.
- **Layout logic.** Slim sticky filter bar holding all ten category chips with counts; compact
  left-aligned masthead; "Closing Soon" as a **two-column dark card** above the feed; then the
  main stack grouped by explicit region labels (Nigeria · 41 / Africa · 33 / Global · 23) with
  row numbers running continuously. An archive strip shows the expired state; a category strip
  and the About block follow.
- **Accent / type.** `#0e7a46` deep Nigerian green, used only for the Nigeria tag, Apply links,
  the primary button, the New pill and one footer rule. Newsreader display (48px masthead) +
  IBM Plex Sans body.
- **Who it suits.** The returning visitor who checks the board every morning and wants maximum
  information per screen. Strongest for habit and retention.
- **Its one risk.** Density can read as cold or utilitarian, and the two-column dark block spends
  its visual weight on volume rather than on the single most urgent item. If the owner wants the
  board to feel like a publication rather than a tool, this is the least editorial of the three.

## Variant B — "The Broadside"

`variant-b-the-broadside.html` · `variant-b-the-broadside.png`

- **What it is.** The air and scale read. A 72px single-statement display heading, generous 96px
  section rhythm, and listings rendered as **tall cards** with 32px Newsreader titles, a stated
  eligibility line, and a full-width summary before the Apply link.
- **Layout logic.** Same sticky filter bar and Nigeria-first order, but the feed is vertical cards
  instead of tight rows. "Closing Soon" is the dark block given the most room — a 40px heading,
  a full-width list with 26px serif titles, and one row per urgent item. The About block gets a
  2px accent rule; the newsletter gets the band card.
- **Accent / type.** Identical token set and identical single accent (`#0e7a46`), as required —
  the difference is purely scale and rhythm, never colour.
- **Who it suits.** A first-time visitor, a shareable link, or anyone who wants the board to feel
  like a well-set publication. Best for credibility and for the Nigeria-first story landing hard.
- **Its one risk.** It shows far fewer listings above the fold, so the board feels less like a
  working tool the longer the list grows. It also leans closest to a "hero" and needs discipline
  to never drift into landing-page furniture.

## Variant C — "The Wire"

`variant-c-the-wire.html` · `variant-c-the-wire.png`

- **What it is.** The dated dispatch. A newspaper dateline bar, a "This week's openings" masthead
  with issue number, a two-column front page pairing the tagline with an "In this week's issue"
  sidebar, and a feed filed under **date headers** ("9 Oct · Thu") with filing times on each entry.
- **Layout logic.** The editorial narrative carries the freshness story the product depends on:
  every entry says when it was filed, the region groups sit inside dated day-headers, and the
  copy voice shifts to journalistic ("filed", "compiled", "dispatch"). The dark Closing-Soon block
  keeps its two-column form. The About block states the four hard rules as a list.
- **Accent / type.** Same tokens, same single accent, same type pairing — the distinction is the
  **dated framing and the front-page sidebar**, not colour.
- **Who it suits.** An audience that values recency and provenance — the newsletter-friendly,
  share-per-screenshot reader, and anyone who wants "refreshed daily" to be visible rather than
  claimed.
- **Its one risk.** The dated framing fights a rolling board: an evergreen item filed on 1 October
  looks stale in a "filed by day" column, and the day-headers fragment the feed as the backlog
  grows. It also adds copy surface that must be generated, not just fetched.

---

## Compliance note (all three)

Checked against `../design-language.md` §10:

| Rule | Status |
|---|---|
| Light background, no dark default, no `prefers-color-scheme` hijack | yes |
| No glassmorphism / `backdrop-filter` decoration | yes (variant B sets it to `none` explicitly) |
| No gradient decoration, flat colour only | yes |
| No icon-tile grid | yes |
| Icons limited to hand-authored thin-line inline SVG (right-arrow on Apply, clock on deadline) | yes |
| Two-tone headings via the exact §3 markup, same weight, clause boundary | yes |
| Single accent reserved for Nigeria tag, Apply, primary button, New pill, one footer line | yes |
| Explore board, not centered hero + three equal cards | yes |
| "Closing Soon" as a first-class near-black block + its own chip | yes |
| Light cards shadow-free; depth from dark card, band/tint fills, hairlines | yes |
| Motion 200ms `--ease`, hover lift only, `prefers-reduced-motion` disables all | yes |
| Contrast ≥4.5:1, 44px hit targets, visible 2px accent focus rings | yes |
| Nigeria-first ordering visible, reinforced by region tag tiers | yes |

**Not yet decided by these mockups** (needs the owner, before Task 1):
1. Which variant wins.
2. Whether "Closing Soon" is two-column (A, C) or full-width list (B) in the winner.

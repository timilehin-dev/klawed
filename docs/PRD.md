# klawhub — Product Requirements Document (PRD)

> Product: **klawhub** — klawhub.xyz
> Brand voice: **Klawed.** "Opportunities, klawed first."
> Owner: `owner` (stepfun/step-5-preview). Status: authoritative. Supersedes PROJECT.md on any product conflict.
> Audience of this doc: the whole crew (scout, editor, verifier, poster, builder) and the human running it.

---

## 1. What Klawhub is

A curated opportunities board for builders. One bot writes each listing. Every listing
carries a **direct link that actually resolves**, a **real deadline in the future**, and
**stated eligibility**. That's the whole product.

Klawhub is not a job board with a scraper. It is an editorial board: a small, trusted,
hand-gated set of real opportunities, refreshed daily, aimed first at the Nigerian
builder and second at African builders, reachable from anywhere.

The product is **trust**. A visitor who lands on klawhub.xyz must be able to click any
listing and reach the real application page, on time, knowing they qualify. That is the
only competitive advantage worth defending, and every rule below exists to protect it.

### Tagline

> **Opportunities, klawed first.**

Use it on the homepage hero and nowhere else in a competing form. It is the one piece of
marketing copy that is allowed to be a slogan; everything below it is utility.

---

## 2. Audience

| Tier | Who | What they need from klawhub |
|---|---|---|
| **Primary** | Nigerian builders — students, junior devs, designers, indie hackers | Roles and opportunities that don't require 5 years of experience or a foreign address. Cheap or free. Deadlines they can still make from Lagos. |
| **Secondary** | African builders — Ghana, Kenya, South Africa, Rwanda, Egypt | Everything above, plus region-tagged filters so they aren't scrolling Nigerian-only roles. |
| **Tertiary** | Global builders | Hackathons, grants, accelerators, AI credits, student deals — the genuinely open-to-anyone tier. |

**Default rule:** when a decision is ambiguous, choose what a Nigerian builder in Lagos
with a laptop and a phone needs. Not what a Series A founder in Berlin needs.

**Explicit non-audience:** recruiters paying for placement. There is no audience of
advertisers because there are no advertisers. See §7.

---

## 3. The listing data model

Every listing, in every category, in every surface (API, database, homepage, newsletter),
is exactly these fields. No per-category snowflakes at the schema level.

| Field | Type | Required | Meaning |
|---|---|---|---|
| `title` | string | yes | The opportunity's own name, as the org writes it. e.g. "Paystack Backend Engineer", "Global AI Hackathon 2026". |
| `org` | string | yes | The company, foundation, or program running it. e.g. "Paystack", "Mercy Corps Ventures". |
| `category` | enum | yes | One of the ten categories in §4. |
| `deadline` | ISO date \| `null` | conditional | Real closing date. Required unless `evergreen` is true. Must be in the future at publish time. |
| `evergreen` | boolean | yes | `true` for always-open listings (perpetual grants, ongoing student-deal programs, standing visa pages). When true, `deadline` is null and the card shows "Rolling" instead of a countdown. |
| `eligibility` | string | yes | Who can apply, stated plainly. One or two sentences, never blank. e.g. "Nigerian residents, any degree field, under 30." If the page doesn't state it, the listing is dropped. |
| `link` | URL | yes | The direct application/info URL. Verified to resolve by the verifier. Never a search page, never a guessed URL. |
| `region` | enum | yes | `nigeria`, `africa`, or `global`. Drives the Nigeria-first ordering. |
| `summary` | string | yes | One to three sentences in klawhub's voice, written by the editor, humanized. What it is, who it's for, why it's on the board. Never a copy-paste of the org's marketing paragraph. |
| `createdAt` | timestamp | auto | Set by the Content API at ingest. Drives "New" badges and the 30-day archive. |

### Derived fields (computed at render, never stored)

- `closing_soon` — deadline within 7 days.
- `new` — `createdAt` within 72 hours.
- `expired` — deadline in the past and `evergreen` false → auto-hidden from live surfaces, kept in the archive.

---

## 4. Categories

Exactly ten. They are the site's primary navigation and the scout's lane structure.
A new category is a new scout lane plus a new enum value — never a core rewrite.

1. **jobs** — full-time and part-time roles open to Nigerian/African builders.
2. **remote** — remote roles with no location restriction, or explicitly global.
3. **hackathons** — time-boxed build competitions. Deadlines are non-negotiable here.
4. **grants** — funding for builders, researchers, and small teams. Often evergreen.
5. **accelerators** — cohort programs. Heavy on eligibility (stage, sector, geography).
6. **visas** — programs, lotteries, and standing routes (e.g. the US Diversity Visa, startup visas). Usually evergreen.
7. **scholarships** — funded study, fellowships for students.
8. **internships** — student and early-career placements.
9. **ai-credits** — free or discounted AI compute, API credits, student/startup programs (e.g. cloud credits, model provider grants).
10. **student-deals** — free tools, discounts, and programs verified as available to students in Nigeria.

---

## 5. The automated pipeline

The board is written by a cron-driven crew of five bots. No human writes a listing. The
human's only editorial act is the approval step in §6.

```
07:00  scout    → raw finds + direct links        → klaw/quarantine/raw/
09:00  editor   → clean listing drafts            → klaw/quarantine/drafts/   [humanizer mandatory]
11:00  verifier → gate + numbered link list       → klaw/quarantine/review/   → owner approves
       poster   → publishes approved via Content API → live on klawhub.xyz
builder (separate profile) → owns the site + Content API code, deploys
```

Each stage's full behaviour is specified in `flow.md`. In product terms:

- **scout** fans out into one lane subagent per category, each returning raw finds with a
  direct link. No link, no find.
- **editor** turns each raw find into a full listing object (all §3 fields), with the
  humanizer skill run on **every string** — title stays verbatim, but `summary` and any
  display copy is rewritten in klawhub's voice.
- **verifier** is the gate. It re-checks that every link resolves, every deadline is real
  and future, every eligibility is stated. Survivors go to a numbered flat link list in
  `klaw/quarantine/review/`. The rest are killed with a reason.
- **owner** (human, or this profile acting for them) opens the link list, clicks through,
  and replies `approved: 1,3,5` or `kill 2`.
- **poster** calls the Content API only for approved IDs. Nothing reaches the site that
  the owner did not sign off.

---

## 6. Quarantine and approval (the human-in-the-loop gate)

- The verifier writes survivors to `klaw/quarantine/review/` as a **numbered flat link
  list** — one line per listing, number, title, direct URL, nothing else.
- The owner clicks the links and replies in the verifier's chat: `approved: 1,3,5` or
  `kill 2` (with optional reason).
- **The verifier is the single gate; the owner's approval is the final human check** on
  "does this link actually go where it says."
- Only approved listings reach the poster. A listing that survives the verifier but not
  the owner is killed and logged, not re-queued silently.

---

## 7. Hard rules (non-negotiable, every bot, every listing)

1. **Direct links, always.** A listing without a working direct link is dropped, never
   guessed. No search-result URLs, no homepage URLs standing in for an application page.
2. **Deadline must be real and in the future.** No date and not evergreen = no listing.
   Never invent a date to make a card look complete.
3. **Eligibility must be stated.** Who can apply, where. If the source page doesn't say,
   the listing is dropped.
4. **humanizer on all copy.** Every headline, body, tag, summary, button label, empty
   state, 404 line — all of it runs through the humanizer skill. No AI-slop voice
   anywhere on the site. This includes UI strings written by builder, not just listing
   copy written by editor.
5. **No ads, no sponsored slots, no dark patterns.** Pure utility. No paid placements,
   no affiliate links, no "featured" tiers, no interstitials, no exit-intent popups, no
   newsletter nag before value.
6. **Light, editorial design language.** No dark-mode-by-default, no glassmorphism, no
   gradients-as-decoration, no icon-tile grids. Full spec: `klaw/docs/design-language.md`.
7. **Never fabricate.** If a link doesn't resolve or a fact isn't on the page, drop the
   listing. No invented data, no placeholder text that could ship.
8. **Extensible.** A new listing type is a new scout lane + a new category enum value.
   It must never require editing the core flow, the API contract, or the homepage layout.
9. **Nigeria-first ordering.** Region-tagged listings sort Nigeria → Africa → Global on
   every surface that shows multiple listings.

### 7.1 Image and icon rules (binding on builder)

10. **No generic or unreal icons, no stock imagery.** Every icon and image on the site
    must be a real, meaningful asset — either a precise geometric glyph drawn as inline
    SVG that matches what it represents, the org's real logo where licensing allows, or a
    generated asset. Off-the-shelf icon-set stock (devicon, heroicons, fontawesome,
    lucide "generic" tiles) is banned as page furniture.
11. **Any image that needs generating is delegated by builder to a subagent** using the
    `muse-media` skill / the `image_generate` tool. Builder does not fabricate image
    assets inline and does not place placeholder rectangles. Generated assets land in
    `public/` with a recorded provenance note (prompt, model, date) in the PR comment or
    commit message.

---

## 8. Site surfaces (what the build must produce)

- **Homepage** — hero with the tagline, then a live board grouped by category, Nigeria
  first, each card showing title, org, category, region, deadline or "Rolling", and a
  "Apply" link that is the direct link.
- **Category pages** — `/jobs`, `/remote`, `/hackathons`, etc. Same card grid, filtered.
- **Listing detail** — title, org, category, region, deadline countdown or "Rolling",
  eligibility, summary, one primary Apply button. No comments, no related-listing spam.
- **About page** — what klawhub is, the rules above, who writes it. Plain, one screen.
- **Newsletter signup** (Buttondown or Brevo free tier) — one field, one button, honest
  copy about cadence. No interstitials.

---

## 9. Non-goals (explicit)

- No user accounts, no saved listings, no apply-tracking.
- No recruiter portal, no employer self-service, no paid promotion path. Ever.
- No comments, no reviews, no ratings.
- No mobile app. The site is responsive; that's enough.
- No aggregator-of-aggregators. If a source is itself a scraped list with no direct
  links, it is not a source.

---

## 10. Success measures

- Every listing on the homepage resolves on click. Target: 100%. A dead link on the
  homepage is a P1 bug, fixed same day.
- Median time from a real opportunity going live to it appearing on klawhub: under 24h.
- Owner approval turnaround: same day.
- Zero sponsored placements, forever. This is a constraint, not a KPI to optimise.

# klawhub — Flow (the daily pipeline)

> Companion to `PRD.md` (what we build) and `TRD.md` (how it's engineered).
> This document specifies **how the board actually gets written every day** — the
> order of stages, what each bot does, where files land, what happens when
> something fails, and when the cron fires.
>
> Audience: the whole crew (scout, editor, verifier, poster, builder), the human
> running the operation, and anyone debugging why a listing is or isn't live.

---

## 1. The pipeline at a glance

```
                    ┌──────────────────────────────────────────────────────────┐
                    │  KLAWHUB DAILY PIPELINE  (WAT, Africa/Lagos)             │
                    └──────────────────────────────────────────────────────────┘

  ┌─────────────────────────── PUBLIC SITE ───────────────────────────────┐
  │        klawhub.xyz  (Astro on Vercel, Vercel Postgres + Prisma)       │
  │   /  homepage ─ category pages ─ /listings/[slug] ─ /about            │
  │                        ▲                                              │
  │                        │ read (Prisma, server-side)                   │
  │                 ┌──────┴───────┐                                      │
  │                 │  Vercel      │                                      │
  │                 │  Postgres    │◀──────────── WRITE ──────────┐        │
  │                 │  (listings)  │                             │        │
  │                 └──────────────┘                             │        │
  │                        ▲                                     │        │
  │                        │ POST /api/listings  (x-api-key)     │        │
  │                 ┌──────┴───────┐                             │        │
  │                 │ CONTENT API  │                             │        │
  │                 │ site/src/    │                             │        │
  │                 │ pages/api/   │                             │        │
  │                 │ listings.ts  │                             │        │
  │                 └──────▲───────┘                             │        │
  └────────────────────────┼─────────────────────────────────────┼────────┘
                           │                                     │
  ══════════════════════════ BOT CREW (Hermes profiles) ═══════════════════
                           │                                     │
   07:00  ┌─────────┐      │                                     │
          │  SCOUT  │──────┼──► klaw/quarantine/raw/YYYY-MM-DD.md  │
          │ longcat │      │    (raw finds + DIRECT links)        │
          └─────────┘      │                                     │
                           │                                     │
   09:00  ┌─────────┐      │                                     │
          │ EDITOR  │──────┼──► klaw/quarantine/drafts/           │
          │ solar   │      │    YYYY-MM-DD/<n>-<slug>.json        │
          │humanizer│      │    (full listing objects)            │
          └─────────┘      │                                     │
                           │                                     │
   11:00  ┌─────────┐      │                                     │
          │VERIFIER │──────┼──► klaw/quarantine/review/           │
          │ solar   │      │    YYYY-MM-DD-links.md  (numbered)   │
          │ THE GATE│      │    YYYY-MM-DD-kills.md  (reasons)    │
          └────┬────┘      │                                     │
               │           │            ┌──────────────────┐     │
               │           └────────────│  HUMAN (owner)   │     │
               │                        │ clicks links     │     │
               │                        │ replies in the   │     │
               │                        │ verifier's chat  │     │
               │                        └────────┬─────────┘     │
               │◀────────────────────────────────┘               │
               │        "approved: 1,3,5"   /   "kill 2"         │
               │                                                 │
               └──► klaw/quarantine/approved/YYYY-MM-DD.json      │
                    (only the approved IDs, full objects)         │
                              │                                  │
   11:30  ┌─────────┐          │                                  │
          │ POSTER  │──────────┘                                  │
          │ solar   │──────────────────────────────────────────────┘
          └─────────┘      POST /api/listings  (x-api-key, Bearer)
                                  │
                                  ▼
                        live on klawhub.xyz  ─► newsletter send

  ┌──────────┐  (on code change, not on cron)
  │  BUILDER │──► site/, prisma/, Vercel deploys ─► production
  └──────────┘
```

**One line version:** scout finds → editor writes → verifier gates → human
approves → poster publishes → newsletter announces. Builder keeps the pipe
standing.

---

## 2. Stage-by-stage walkthrough

### 07:00 — SCOUT (meituan/longcat-2.5-preview:free)

**Trigger:** cron, daily 07:00 Africa/Lagos.

**Job:** Fan out. Spawn **one subagent per category lane** — jobs, remote,
hackathons, grants, accelerators, visas, scholarships, internships, ai-credits,
student-deals — and have each return raw finds with a **direct link**.

**Output:** `klaw/quarantine/raw/YYYY-MM-DD.md`

```markdown
# Raw finds — 2026-01-15

## hackathons
- Global AI Hackathon 2026 | organizer | https://hackathon.example.com/apply
  note: deadline Feb 1 2026, open to all

## ai-credits
- Cloud credits for startups | Provider | https://provider.example.com/credits
  note: rolling
```

**Hard rules:**
- Every find carries a direct link. **No link, no find.** A lane subagent that
  returns a URL without a scheme/host is rejected by the scout before it is
  written to disk.
- No search-result URLs, no homepage URLs standing in for an application page.
- Raw findings are *not* listings. They are leads. No prose, no summary, no
  eligibility guess.

**Failure mode:** a lane subagent that errors out is logged as `lane-failed` for
that category in the raw file's header, and the run continues with the remaining
lanes. The pipeline never aborts because one lane is empty — a thin day is
allowed, a fabricated day is not.

---

### 09:00 — EDITOR (upstage/solar-mini4:free)

**Trigger:** cron, daily 09:00 (or chained off the scout run completing).

**Job:** Read every raw find from today's `raw/` file. Turn each into a full
listing object with all PRD §3 fields: `title, org, category, deadline,
evergreen, eligibility, link, region, summary`.

**Output:** `klaw/quarantine/drafts/YYYY-MM-DD/<nn>-<slug>.json`, one file per
listing, numbered in the order they were read.

```json
{
  "title": "Global AI Hackathon 2026",
  "org": "Global AI Foundation",
  "category": "hackathons",
  "deadline": "2026-02-01T23:59:59Z",
  "evergreen": false,
  "eligibility": "Open to builders anywhere; teams of 1-4.",
  "link": "https://hackathon.example.com/apply",
  "region": "global",
  "summary": "A 48-hour build sprint with cash prizes and cloud credits..."
}
```

**Hard rules:**
- **humanizer skill runs on every string.** `summary` and any display copy are
  rewritten in klawhub's voice. `title` stays verbatim (it is the org's own
  name for the thing). No AI-slop voice reaches the verifier.
- `summary` is 1–3 sentences, never a copy-paste of the org's marketing
  paragraph.
- `region` is assigned: `nigeria`, `africa`, or `global`. Nigeria-first is a
  sort rule, not a filter.
- If the source page states no eligibility, the editor writes nothing in that
  field — the verifier drops the listing. The editor does not invent
  eligibility.

**Failure mode:** a raw find the editor cannot turn into a valid object
(missing eligibility, no parseable deadline and not evergreen) is written to
`drafts/YYYY-MM-DD/rejected.md` with a one-line reason. Nothing is silently
dropped — every find leaves a trace.

---

### 11:00 — VERIFIER (upstage/solar-mini4:free) — **the gate**

**Trigger:** cron, daily 11:00.

**Job:** Re-check every draft against the three truths, independently of the
editor:

1. **The link resolves.** Fetch it. A 404, a redirect to a homepage, a login
   wall with no public path, or a page that does not mention the opportunity =
   kill.
2. **The deadline is real and in the future.** No date and not evergreen =
   kill. Never invent a date.
3. **Eligibility is stated.** If the page doesn't say who can apply, kill.

**Output — two files in `klaw/quarantine/review/`:**

`YYYY-MM-DD-links.md` — survivors, a **numbered flat link list**:

```markdown
# Review list — 2026-01-15
# 6 survivors, 4 killed. Reply in chat: approved: 1,3,5   |   kill 2

1. Global AI Hackathon 2026 — Global AI Foundation
   https://hackathon.example.com/apply

2. Paystack Backend Engineer — Paystack
   https://paystack.com/careers/backend-engineer

3. ...
```

`YYYY-MM-DD-kills.md` — the rest, with reasons:

```markdown
# Killed — 2026-01-15
4. "Free AI course" — link 404
5. "Crypto visa lottery" — eligibility not stated on page
...
```

**The numbered list is the contract.** Numbers are stable within the day's file
and map 1:1 to the corresponding JSON in `drafts/YYYY-MM-DD/`. The human
replies with numbers; the verifier maps them back.

---

### The approval loop (the only human editorial act)

The human (owner) opens `YYYY-MM-DD-links.md`, clicks each link, and replies
**in the verifier's chat**:

- `approved: 1,3,5` — publish those.
- `kill 2` (optionally `kill 2 — link goes to a generic jobs page`) — drop that
  one, even though it passed the gate.
- `approved: all` — publish every survivor. Allowed, but the human should have
  clicked; `approved: all` after no review is a trust failure, not a shortcut.
- No reply by 23:59 — the run is treated as **no approvals**. Nothing publishes.
  A missing human is a kill switch, not a default-yes.

**Verifier parses the reply:**

- Every number in `approved:` must exist in today's review file. A number that
  doesn't exist gets a clarifying question back in chat, not a silent skip.
- `approved:` + `kill` in the same message: `kill` wins for any overlapping ID.
- The verifier writes the approved subset to
  `klaw/quarantine/approved/YYYY-MM-DD.json` — full listing objects for the
  approved IDs only — and hands off to the poster with the file path.
- Everything the human killed (or never approved) is logged in
  `YYYY-MM-DD-kills.md` with `killed-by-owner` as the reason. **Killed listings
  are not re-queued.** They may reappear as a fresh find from scout on a later
  day; they are never resurrected from the kill log.

---

### 11:30 — POSTER (upstage/solar-mini4:free)

**Trigger:** runs on the verifier's hand-off (typically minutes after approval,
same day).

**Job:** Read `klaw/quarantine/approved/YYYY-MM-DD.json`. For each listing,
`POST /api/listings` to klawhub.xyz with the `x-api-key` header and the PRD §3
body.

**Per-listing behaviour:**

| Response | What the poster does |
|---|---|
| `201 {id, status:"live"}` | Mark the listing posted, record the returned cuid against the listing in the run log. |
| `409 duplicate` | The link is already live. Not an error — mark it `already-live`, skip, continue. |
| `400` (bad field) | The object is malformed. The verifier's gate leaked a bad draft. Log the exact error body, skip this listing, and message the verifier + owner in chat: "listing N failed validation at the API: <code>". Do **not** patch and retry blind. |
| `401 unauthorized` | **Stop the whole run.** This is a key/config problem, not a listing problem. Message the owner immediately. Retrying on 401 is pointless and looks like an attack. |
| `5xx` / network timeout | Retry that one listing up to 3 times with backoff. If it still fails, park it in `quarantine/approved/failed-YYYY-MM-DD.json` with the error and tell the owner in chat. Do not continue posting through a hard outage. |

**After the batch:** the poster posts a run summary in its chat: posted count,
skipped-duplicate count, failures with IDs.

---

### Newsletter (post-batch)

Once the day's listings are live, the owner (or a small poster step) sends the
daily digest via Buttondown/Brevo free tier: the day's new listings, grouped by
category, Nigeria first, one Apply link each. The digest is generated from the
same `approved/` JSON, so the newsletter never contains anything the board
doesn't show. No newsletter without listings — an empty digest is not sent.

---

## 3. What happens at each failure

| Failure | Detected by | Behaviour | Recovery |
|---|---|---|---|
| Scout lane subagent errors | scout | Log `lane-failed:<category>` in the raw file header, continue other lanes | Re-run that lane manually, or accept a thin day |
| Raw find has no direct link | scout | Rejected before it is written to `raw/` | Nothing to recover — it never entered the pipeline |
| Editor can't build a valid object | editor | Write to `drafts/.../rejected.md` with reason | Re-run editor for that date, or drop |
| **Link doesn't resolve** | verifier | Kill, logged in `YYYY-MM-DD-kills.md` | May return as a fresh find later; never force-published |
| **Deadline missing/past, or fabricated-looking** | verifier | Kill, logged | Same |
| **Eligibility not stated** | verifier | Kill, logged | Same |
| Owner kills a listing | verifier (owner reply) | Logged `killed-by-owner`, not re-queued | Fresh scout find only |
| Owner replies late or not at all | verifier | No approvals → nothing publishes. **Default is silent.** | Approve manually later that day; otherwise the day's finds are lost and re-scouted |
| Owner references an unknown number | verifier | Ask in chat, don't guess | Human corrects |
| **API returns `409 duplicate`** | poster | Treat as success-with-skip | None needed |
| **API returns `400 bad_*`** | poster | Skip listing, report error code to owner + verifier | Verifier inspects the draft; usually a schema/format slip upstream |
| **API returns `401`** | poster | **Halt entire run**, notify owner | Fix the key in the poster's `.env` (or rotate in Vercel), re-run the poster |
| **API `5xx` / timeout** | poster | 3 retries w/ backoff, then park in `failed-*.json` | Retry the parked file once the site is healthy |
| **DB unreachable at render** | Astro (site) | Serve the humanized "board is being refreshed" state — visitors never see a stack trace | Auto-recovers; builder alerts owner if sustained |
| Content API down entirely | site | Site still serves cached/static listings — the API is the write path, not the read path | Builder investigates; pipeline queues in `approved/` until it returns |
| Prisma migration fails on deploy | Vercel build | **Deploy blocked** — never force-past a failed migration | Builder fixes the migration; the previous production stays live |
| A dead link ships to production (P1) | owner/anyone | Fix same day: verifier re-checks, listing set `expired` or removed | Root-cause: what did the gate miss? Tighten the verifier prompt |

**The invariant behind the whole table:** a missing listing is always cheaper
than a bad listing. Every failure path that can't be resolved safely ends in a
kill, never in a guess.

---

## 4. Cron schedule

All times **Africa/Lagos (WAT, UTC+1)**. All jobs run in the crew's own Hermes
profiles; each job writes to `C:\Users\HP\klaw\quarantine\`.

| Time | Profile | Job | Output |
|---|---|---|---|
| 07:00 | `scout` | Spawn 10 lane subagents, collect raw finds | `quarantine/raw/YYYY-MM-DD.md` |
| 09:00 | `editor` | Draft every raw find into a listing object (humanizer on every string) | `quarantine/drafts/YYYY-MM-DD/*.json` |
| 11:00 | `verifier` | Gate: resolve links, check deadlines, check eligibility; write numbered review list | `quarantine/review/YYYY-MM-DD-links.md`, `-kills.md` |
| — | human | Click links, reply `approved: 1,3,5` / `kill 2` in the verifier's chat | (chat reply) |
| on approval | `verifier` | Write approved subset, hand off | `quarantine/approved/YYYY-MM-DD.json` |
| ~11:30 | `poster` | POST approved listings to the Content API; send newsletter digest | live listings + digest |
| on code change | `builder` | Build, preview, merge → production deploy | klawhub.xyz |

**Design notes on the schedule:**
- 07:00 → 09:00 → 11:00 gives each stage its own window; nothing races.
- The human has from 11:00 to 23:59 to approve. Approval turnaround target is
  same day (PRD §10).
- A day with zero survivors is a legitimate outcome. An empty `-links.md` file
  is written so the human knows the run happened and found nothing worth
  publishing.
- Weekly: the owner reviews the `kills` files across the week to spot
  systematic gate failures (e.g. a source that's gone dead).

---

## 5. Ownership summary

| Path | Owner | Notes |
|---|---|---|
| `klaw/quarantine/raw/` | scout | Operational data |
| `klaw/quarantine/drafts/` | editor | One JSON per listing |
| `klaw/quarantine/review/` | verifier | The numbered link list + kills |
| `klaw/quarantine/approved/` | verifier (writes), poster (reads) | The hand-off artifact |
| `klaw/site/**` | builder | Astro app, Content API, Prisma |
| `klaw/docs/**` | owner | PRD, TRD, flow, plan, design-language |

Quarantine folders are operational data and are gitignored (TRD §2) — they are
never committed. Only the site and the docs live in the repo.

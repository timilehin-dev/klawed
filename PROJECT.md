# klawhub — Project Root

**Domain:** klawhub.xyz
**What it is:** A curated opportunities board for builders — jobs, remote roles, hackathons, grants, accelerators, visas, scholarships, internships, AI tools & free credits, student deals.
**Audience:** Nigeria-first, Africa-next, global-reachable. Default every decision to what a Nigerian builder needs.
**Monetization:** None. Pure utility. No ads, no sponsored slots.

## The Crew

Every bot below lives in its own Hermes profile and works inside this folder. The pipeline is fully automated via cron.

| Profile | Model | Role | Trigger |
|---|---|---|---|
| `owner` | stepfun/step-5-preview:free | Product Owner — PRD, TRD, app flow, implementation plan, verifies Builder's work against spec | on demand / before build |
| `scout` | meituan/longcat-2.5-preview:free | Orchestrator — spawns lane subagents (jobs, hackathons, grants, visas, scholarships, internships, AI credits, student deals) → raw finds + DIRECT links | cron daily 07:00 |
| `editor` | upstage/solar-mini4:free | Turns raw finds into clean listing drafts. **humanizer skill mandatory on every string** | after scout |
| `verifier` | upstage/solar-mini4:free | Deadline/eligibility/link-format gate → quarantine list → awaits owner approval → go-signal | after editor |
| `poster` | upstage/solar-mini4:free | Calls Content API (`POST /api/listings`) to publish approved listings | after approval |
| `builder` | meituan/longcat-2.5-preview:free | Owns Astro site + Content API code, Vercel deploys | on code change |

## The Flow

```
cron 07:00  scout    → raw finds + direct links        (klaw/quarantine/raw/)
cron 09:00  editor   → clean listing drafts            (klaw/quarantine/drafts/)  [humanizer]
cron 11:00  verifier → gate + numbered link list       (klaw/quarantine/review/)  → owner approves
             poster  → publishes approved via Content API → live
builder      → owns site + Content API code, deploys
```

## Quarantine / Approval

- Verifier writes survivors to `klaw/quarantine/review/` as a **numbered flat link list**.
- Owner opens the list, clicks links, replies `approved: 1,3,5` or `kill 2` in the verifier's chat.
- Only approved listings reach the Poster. The verifier is the single gate; the owner's approval is the final human eyes on "does this link go where it says."

## Hard Rules (every bot)

1. **Direct links, always.** A listing without a working direct link is dropped, never guessed.
2. **Deadline must be real and in the future.** No date = no listing.
3. **Eligibility must be stated.** Who can apply, where.
4. **humanizer on all copy** (editor). Every headline, body, tag — no AI-slop voice.
5. **Light, editorial design language.** No dark-mode-by-default, no glassmorphism, no gradients-as-decoration. See `klaw/docs/design-language.md`.
6. **Extensible.** New listing types (news, fellowships, meetups) are added without touching the core — new lane subagent + new content type.
7. **Never fabricate.** If a link doesn't resolve or a fact isn't on the page, drop it. No invented data.

## Stack

- **Site:** Astro + content collections, Vercel
- **Datastore:** Vercel Postgres (Neon) + Prisma
- **Content API:** keyed `POST /api/listings` on the site itself (Bearer `KLAWHUB_API_KEY`, in poster's env, never committed)
- **Newsletter:** Buttondown or Brevo free tier

## Paths

- All bots operate inside `C:\Users\HP\klaw`
- Docs (PRD/TRD/flow/plan) live in `klaw/docs/`
- Secrets live in each profile's `.env`, never in the repo

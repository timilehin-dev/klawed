# klawhub Agent Context

> Loaded automatically as project context for every bot working in `C:\Users\HP\klaw`.
> Read `PROJECT.md` in this same folder first — it holds the crew roster, the pipeline,
> and the hard rules. This file is the operational brief; PROJECT.md is the map.

## What klawhub is

A curated, Nigeria-first (then Africa, then global) opportunities board for builders.
One bot writes each listing. Every listing carries: title, org, category, deadline,
eligibility, and a **direct link that actually resolves**. That's the whole product.

## The pipeline (cron, hands-off)

scout (longcat, spawns lane subagents) → editor (solar, humanizer on all copy)
→ verifier (solar, gate) → owner approves link list → poster (solar) calls Content API → live.

## The one rule that protects the site

**Never publish a listing whose direct link does not resolve, whose deadline is not real
and in the future, or whose eligibility is not stated.** Drop it — never guess, never
invent. A dead link on the homepage is worse than a missing listing.

## Design posture

Light, editorial, typographic. Big confident type, generous whitespace, one accent.
No dark-mode default, no glassmorphism, no gradient decoration, no icon-tile grids.
Full spec: `klaw/docs/design-language.md`.

## Extensibility

New categories (news, fellowships, local meetups) are added as a new scout lane +
new content type — never by editing the core flow. Design for the next listing type.

## Coordination

- Owner profile (`owner`) holds the PRD/TRD and verifies Builder's work.
- Quarantine link lists live in `klaw/quarantine/review/`; owner approves in verifier's chat.
- Secrets (API keys, DB URLs) go in each profile's `.env`, never the repo.

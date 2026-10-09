# klawhub GitHub Workflow

## Repo
- Local: `C:\Users\HP\klaw`
- Branch: `main` (auto-deploys to Vercel once connected)
- Remote: `https://github.com/<owner>/klawhub.git`  ← **fill in after you create the repo**

## What lives in git
- Site code, Content API, Prisma schema (Builder owns)
- Docs in `klaw/docs/` (Owner owns: PRD, TRD, flow, plan, design-language)
- `PROJECT.md`, `AGENTS.md`, `.gitignore`, `.env.example`

## What NEVER lives in git (see .gitignore)
- `.env` and any secrets (API keys, DB URLs, Vercel token)
- `quarantine/` working files — the pipeline's scratch stage, local only

## Commit convention
- `feat:` new capability
- `fix:` bug fix
- `chore:` scaffolding, config, docs, cleanup
- Small commits, messages that say what changed. The repo is the source of truth.

## Daily pipeline (content does NOT commit to git)
The content pipeline (scout → editor → verifier → poster) never touches git. It writes to
`quarantine/` locally and publishes through the keyed Content API. Git is for CODE only.
This keeps content fast (instant via API) and off the deploy critical path.

## To connect the remote (one time, run by the human)
```
cd C:\Users\HP\klaw
git remote add origin https://github.com/<owner>/klawhub.git
git push -u origin main
```
Then connect that same repo to Vercel so `main` auto-deploys.

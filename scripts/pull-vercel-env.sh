#!/usr/bin/env bash
# Pull the klawed Vercel project's env vars locally and merge into klaw/.env
# Run from Git Bash:  bash /c/Users/HP/klaw/scripts/pull-vercel-env.sh
set -e

cd /c/Users/HP/klaw

echo "==> 1/4  Log in to Vercel (opens a browser / prompts for email)"
npx --yes vercel@latest login

echo "==> 2/4  Link this folder to the klawed project"
npx --yes vercel@latest link --yes --project klawed --scope hinttimi-1044s-projects

echo "==> 3/4  Pull production env vars to .env.vercel"
npx --yes vercel@latest env pull .env.vercel --environment=production --yes

echo "==> 4/4  Merge into .env (existing keys are preserved; Vercel keys win)"
python - <<'PY'
import os, re, shutil
base = ".env"
pulled = ".env.vercel"
if not os.path.exists(pulled):
    raise SystemExit("ERROR: .env.vercel not created — did step 3 fail?")

def parse(path):
    out = {}
    if not os.path.exists(path): return out
    for line in open(path, encoding="utf-8", errors="replace"):
        line = line.rstrip("\n")
        m = re.match(r'^([A-Za-z_][A-Za-z0-9_]*)=(.*)$', line)
        if m: out[m.group(1)] = m.group(2)
    return out

existing = parse(base)
new = parse(pulled)
# keep existing secret keys we set ourselves, unless Vercel defines them
for k, v in new.items():
    existing[k] = v
# ensure our own keys survive
existing.setdefault("GITHUB_TOKEN", "")
existing.setdefault("KLAWHUB_API_KEY", "")

shutil.copyfile(base, base + ".bak") if os.path.exists(base) else None
with open(base, "w", encoding="utf-8") as f:
    for k in sorted(existing):
        f.write(f'{k}={existing[k]}\n')

need = ["POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING"]
have = [k for k in need if existing.get(k)]
print("merged keys:", len(existing))
print("required present:", have)
missing = [k for k in need if k not in existing or not existing[k]]
if missing:
    print("MISSING (need attention):", missing)
else:
    print("OK: all required DB vars are present in .env")
PY

echo "==> Done. .env updated (backup at .env.bak if it existed)."

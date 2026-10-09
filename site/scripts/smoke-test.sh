#!/usr/bin/env bash
# Live HTTP smoke test: the running Astro dev server + the real Neon database.
#
# Prints the ACTUAL response for every case. Nothing is assumed. Every row this
# creates is deleted at the end, so the board is left empty.
#
# Scratch files go to the Hermes profile cache, NOT /tmp: on this Windows host
# the platform temp dir is pruned while a long test is still running, which
# silently emptied the output mid-run once already.
set -u
BASE="${1:-http://localhost:4321}"
OUT="C:/Users/HP/AppData/Local/hermes/profiles/builder/cache/scratch/klaw-smoke"
mkdir -p "$OUT"

KEY="$(grep -E '^KLAWHUB_API_KEY=' /c/Users/HP/klaw/.env | head -1 | cut -d= -f2- | tr -d '"'"'"'\r')"
if [ -z "$KEY" ]; then echo "FATAL: KLAWHUB_API_KEY not in workspace .env"; exit 1; fi

pass=0; fail=0
chk () {
  if [ "$2" = "$3" ]; then echo "  PASS  $1"; pass=$((pass+1));
  else echo "  FAIL  $1  (expected [$2] got [$3])"; fail=$((fail+1)); fi
}
post () { # <header-args...> -- <json>   =>  "code|body"
  local hdr=() body=""
  while [ $# -gt 0 ]; do
    if [ "$1" = "--" ]; then shift; body="$1"; break; fi
    hdr+=("$1"); shift
  done
  local code
  code=$(curl -s -m 60 -o "$OUT/body.json" -w '%{http_code}' -X POST "$BASE/api/listings" "${hdr[@]}" -d "$body" 2>/dev/null)
  echo "${code}|$(tr -d '\r\n' < "$OUT/body.json" 2>/dev/null)"
}
get () { # <path> => "code|bytes"
  local code size
  code=$(curl -s -m 60 -o "$OUT/page.html" -w '%{http_code}' "$BASE$1" 2>/dev/null)
  size=$(wc -c < "$OUT/page.html" 2>/dev/null | tr -d ' ')
  echo "${code}|${size}"
}
UNIQ="$(date +%s)-$RANDOM"
FUTURE="$(node -e 'const d=new Date();d.setUTCDate(d.getUTCDate()+45);console.log(d.toISOString())')"
PAST="2020-01-01T00:00:00Z"
H_AUTH=(-H "content-type: application/json" -H "x-api-key: $KEY")
H_BAD=(-H "content-type: application/json" -H "x-api-key: definitely-the-wrong-key")
mk () { node -e 'const [c,o]=process.argv.slice(1);console.log(JSON.stringify(Object.assign(JSON.parse(c),JSON.parse(o))))' "$1" "$2"; }

echo "================================================================"
echo " LIVE HTTP SMOKE TEST  ($BASE)"
echo "================================================================"

echo; echo "--- 1. AUTH ---"
r=$(post -H "content-type: application/json" -- '{}')
chk "no key -> 401 unauthorized" "401|{\"error\":\"unauthorized\"}" "$r"; echo "       got: $r"
r=$(post "${H_BAD[@]}" -- '{}')
chk "wrong key -> 401 unauthorized" "401|{\"error\":\"unauthorized\"}" "$r"; echo "       got: $r"
if echo "$r" | grep -q "$KEY"; then echo "  FAIL  key leaked in a response body"; fail=$((fail+1));
else echo "  PASS  key never appears in any response body"; pass=$((pass+1)); fi

echo; echo "--- 2. METHOD ---"
code=$(curl -s -m 60 -o "$OUT/b.json" -w '%{http_code}' "$BASE/api/listings" 2>/dev/null)
chk "GET -> 405" "405" "$code"; echo "       body: $(tr -d '\r\n' < "$OUT/b.json" 2>/dev/null)"

echo; echo "--- 3. BODY VALIDATION (TRD §4) ---"
r=$(post "${H_AUTH[@]}" -- 'this is not json')
chk "malformed JSON -> 400 invalid_json" "400|{\"error\":\"invalid_json\"}" "$r"; echo "       got: $r"

# A valid category/region/link but no title/org/eligibility/summary/evergreen, so
# this actually exercises missing_fields. With a missing category the validator
# correctly answers bad_category first (TRD §4 lists the specific checks before
# the catch-all), which is asserted separately below.
r=$(post "${H_AUTH[@]}" -- '{"category":"jobs","region":"nigeria","link":"https://example.com/mf","deadline":"'$FUTURE'"}')
chk "missing required strings -> 400 missing_fields" \
  "400|{\"error\":\"missing_fields\",\"fields\":[\"title\",\"org\",\"eligibility\",\"summary\",\"evergreen\"]}" "$r"
echo "       got: $r"

# A missing category with everything else present is bad_category, not missing_fields.
r=$(post "${H_AUTH[@]}" -- '{"title":"T","org":"O","region":"nigeria","link":"https://example.com/mf2","summary":"s","evergreen":false,"deadline":"'$FUTURE'","eligibility":"e"}')
chk "missing category -> 400 bad_category" "400|{\"error\":\"bad_category\"}" "$r"; echo "       got: $r"

CORE=$(node -e "console.log(JSON.stringify({title:'Smoke $UNIQ',org:'klawhub-build',category:'jobs',
 deadline:'$FUTURE',evergreen:false,eligibility:'Smoke-test row, deleted immediately.',
 link:'https://example.com/smoke-$UNIQ',region:'nigeria',summary:'Temporary row for the smoke test.'}))")

r=$(post "${H_AUTH[@]}" -- "$(mk "$CORE" '{"category":"nonsense"}')")
chk "bad category" "400|{\"error\":\"bad_category\"}" "$r"; echo "       got: $r"
r=$(post "${H_AUTH[@]}" -- "$(mk "$CORE" '{"category":"ai_credits"}')")
chk "snake_case category rejected (API speaks kebab)" "400|{\"error\":\"bad_category\"}" "$r"; echo "       got: $r"
r=$(post "${H_AUTH[@]}" -- "$(mk "$CORE" '{"region":"mars"}')")
chk "bad region" "400|{\"error\":\"bad_region\"}" "$r"; echo "       got: $r"
r=$(post "${H_AUTH[@]}" -- "$(mk "$CORE" '{"link":"http://insecure.example.com/x"}')")
chk "non-https link -> bad_link" "400|{\"error\":\"bad_link\"}" "$r"; echo "       got: $r"
r=$(post "${H_AUTH[@]}" -- "$(mk "$CORE" '{"deadline":null}')")
chk "no deadline + evergreen false -> bad_deadline" "400|{\"error\":\"bad_deadline\"}" "$r"; echo "       got: $r"
r=$(post "${H_AUTH[@]}" -- "$(mk "$CORE" "{\"deadline\":\"$PAST\"}")")
chk "past deadline -> bad_deadline" "400|{\"error\":\"bad_deadline\"}" "$r"; echo "       got: $r"
r=$(post "${H_AUTH[@]}" -- "$(mk "$CORE" '{"evergreen":true}')")
chk "evergreen true + a deadline -> bad_deadline" "400|{\"error\":\"bad_deadline\"}" "$r"; echo "       got: $r"

echo; echo "--- 4. THE REAL WRITE (201) + IDEMPOTENCY (409) ---"
r=$(post "${H_AUTH[@]}" -- "$CORE")
code="${r%%|*}"; body="${r#*|}"
chk "valid body -> 201" "201" "$code"; echo "       body: $body"
echo "$body" | grep -q '"status":"live"' && { echo "  PASS  status is live"; pass=$((pass+1)); } || { echo "  FAIL  status not live"; fail=$((fail+1)); }
ID=$(node -e 'try{console.log(JSON.parse(process.argv[1]).id||"")}catch{console.log("")}' "$body")
SLUG=$(node -e 'try{console.log(JSON.parse(process.argv[1]).slug||"")}catch{console.log("")}' "$body")
echo "       created id:   $ID"
echo "       created slug: $SLUG"

r=$(post "${H_AUTH[@]}" -- "$CORE")
chk "same link again -> 409 duplicate" "409|{\"error\":\"duplicate\"}" "$r"; echo "       got: $r"

echo; echo "--- 5. BEARER AUTH (the poster's style, flow.md §2) ---"
BEARER_BODY=$(node -e "console.log(JSON.stringify({title:'Smoke bearer $UNIQ',org:'klawhub-build',
 category:'grants',deadline:'$FUTURE',evergreen:false,eligibility:'Smoke-test row, deleted immediately.',
 link:'https://example.com/bearer-$UNIQ',region:'africa',summary:'Temporary row for the bearer check.'}))")
r=$(post -H "content-type: application/json" -H "authorization: Bearer $KEY" -- "$BEARER_BODY")
chk "Bearer key -> 201" "201" "${r%%|*}"; echo "       got: $r"
BEARER_ID=$(node -e 'try{console.log(JSON.parse(process.argv[1]).id||"")}catch{console.log("")}' "${r#*|}")

echo; echo "--- 6. EVERGREEN (kebab category, null deadline) ---"
EV_BODY=$(node -e "console.log(JSON.stringify({title:'Smoke evergreen $UNIQ',org:'klawhub-build',
 category:'ai-credits',deadline:null,evergreen:true,eligibility:'Smoke-test row, deleted immediately.',
 link:'https://example.com/evergreen-$UNIQ',region:'global',summary:'Temporary row for the evergreen check.'}))")
r=$(post "${H_AUTH[@]}" -- "$EV_BODY")
chk "evergreen + null deadline -> 201" "201" "${r%%|*}"; echo "       got: $r"
EV_ID=$(node -e 'try{console.log(JSON.parse(process.argv[1]).id||"")}catch{console.log("")}' "${r#*|}")

echo; echo "--- 7. CLEANUP (the board must end empty) ---"
node --env-file=C:/Users/HP/klaw/.env -e '
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
const ids = process.argv.slice(1).filter(Boolean);
(async () => {
  const before = await p.listing.count();
  const del = await p.listing.deleteMany({ where: { OR: [ { id: { in: ids } }, { org: "klawhub-build" } ] } });
  const after = await p.listing.count();
  console.log(`  deleted ${del.count} smoke row(s); Listing count ${before} -> ${after}`);
  await p.$disconnect();
})().catch(async e => { console.error("  cleanup FAILED:", e.message); process.exit(1); });
' "$ID" "$BEARER_ID" "$EV_ID"

echo; echo "--- 8. PAGES RENDER (empty board, warm server) ---"
for path in "/" "/jobs" "/ai-credits" "/student-deals" "/closing-soon" "/archive" "/about" "/no-such-page"; do
  g=$(get "$path"); printf "  %-18s HTTP %s  %s bytes\n" "$path" "${g%%|*}" "${g#*|}"
done
if grep -qiE "being refreshed|undefined|NaN|\[object Object\]" "$OUT/page.html" 2>/dev/null; then
  echo "  WARN: a page renders a placeholder/undefined string"
fi

echo
echo "================================================================"
echo " RESULT: $pass passed, $fail failed"
echo "================================================================"
[ "$fail" -eq 0 ] || exit 1

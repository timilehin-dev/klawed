#!/usr/bin/env bash
# Live test of the Content API management endpoints against a running dev
# server + the real Neon database. Exercises PATCH and DELETE through the
# documented contract, including the board/archive status behaviour.
#
# Usage: bash scripts/api-endpoints-test.sh [base_url]
# Default base_url: http://localhost:4321

set -u
BASE="${1:-http://localhost:4321}"
# The key comes from the environment, never from a file this script names.
# Keeping the path out of the repo means the script is portable (CI, another
# machine) and publishes nothing about where secrets live on this one.
#   export KLAWHUB_API_KEY=... && bash scripts/api-endpoints-test.sh
KEY="${KLAWHUB_API_KEY:-}"
if [ -z "$KEY" ]; then
  echo "KLAWHUB_API_KEY is not set. Export it before running this script." >&2
  exit 2
fi
PASS=0; FAIL=0
TMP="C:/Users/HP/AppData/Local/hermes/profiles/builder/cache/scratch/apitest"
mkdir -p "$TMP"

# A unique, clearly-labelled probe listing. Deleted by the final step; the
# script also self-cleans any stragglers on exit.
TITLE="APIProbe $(date +%s)"
LINK="https://example.com/api-probe-$(date +%s)"

cleanup() {
  for id in $(cat "$TMP/ids" 2>/dev/null); do
    curl -s -X DELETE "$BASE/api/listings/$id" -H "x-api-key: $KEY" >/dev/null 2>&1
  done
  rm -rf "$TMP"
}
trap cleanup EXIT
: > "$TMP/ids"

hr() { echo; echo "════ $1 ════"; }

# check <label> <expected> <actual>
check() {
  if [ "$2" = "$3" ]; then
    echo "  PASS  $1 ($3)"; PASS=$((PASS+1))
  else
    echo "  FAIL  $1 — expected $2, got $3"; FAIL=$((FAIL+1))
  fi
}

# Reject a body with a bad key — used to prove auth is enforced on every method.
BAD='{"error":"unauthorized"}'

hr "1. POST — create a listing (must stay 201)"
BODY=$(cat <<EOF
{"title":"$TITLE","org":"ProbeCo","category":"jobs","region":"nigeria",
 "deadline":"2030-01-15T23:59:59Z","evergreen":false,
 "eligibility":"Anyone may apply.","link":"$LINK",
 "summary":"Probe listing for endpoint tests."}
EOF
)
RESP=$(curl -s -m 90 -X POST "$BASE/api/listings" \
  -H "x-api-key: $KEY" -H 'content-type: application/json' -d "$BODY" \
  -w '\n%{http_code}')
CODE=$(echo "$RESP" | tail -1)
ID=$(echo "$RESP" | head -n -1 | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
SLUG=$(echo "$RESP" | head -n -1 | sed -n 's/.*"slug":"\([^"]*\)".*/\1/p')
check "POST /api/listings" 201 "$CODE"
[ -n "$ID" ] && echo "$ID" >> "$TMP/ids"
echo "        id=$ID"
[ -n "$ID" ] || { echo "  ABORT — no id returned, remaining tests cannot run"; exit 1; }

hr "2. PATCH summary -> 200, and the new summary is actually returned"
NEW_SUMMARY="Humanized summary from the editor pass."
RESP=$(curl -s -m 90 -X PATCH "$BASE/api/listings/$ID" \
  -H "x-api-key: $KEY" -H 'content-type: application/json' \
  -d "{\"summary\":\"$NEW_SUMMARY\"}" -w '\n%{http_code}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
check "PATCH status" 200 "$CODE"
if echo "$BODY" | grep -q "$NEW_SUMMARY"; then
  echo "  PASS  summary was updated and returned"; PASS=$((PASS+1))
else
  echo "  FAIL  summary not in response"; FAIL=$((FAIL+1))
fi

hr "3. PATCH with a bad key -> 401"
CODE=$(curl -s -m 90 -o /dev/null -w '%{http_code}' -X PATCH "$BASE/api/listings/$ID" \
  -H "x-api-key: not-the-real-key" -H 'content-type: application/json' -d '{"summary":"hijacked"}')
check "PATCH bad key" 401 "$CODE"

hr "4. PATCH a nonexistent id -> 404"
CODE=$(curl -s -m 90 -o /dev/null -w '%{http_code}' -X PATCH "$BASE/api/listings/no-such-id-xyz" \
  -H "x-api-key: $KEY" -H 'content-type: application/json' -d '{"summary":"x"}')
check "PATCH unknown id" 404 "$CODE"

hr "5. PATCH evergreen:true with a deadline still in place -> 400 bad_deadline"
RESP=$(curl -s -m 90 -X PATCH "$BASE/api/listings/$ID" \
  -H "x-api-key: $KEY" -H 'content-type: application/json' \
  -d '{"evergreen":true}' -w '\n%{http_code}')
CODE=$(echo "$RESP" | tail -1)
ERR=$(echo "$RESP" | head -n -1 | sed -n 's/.*"error":"\([^"]*\)".*/\1/p')
check "PATCH evergreen/deadline status" 400 "$CODE"
check "PATCH evergreen/deadline code" "bad_deadline" "$ERR"

hr "5b. DELETE with a bad key -> 401 (auth on every method)"
CODE=$(curl -s -m 90 -o /dev/null -w '%{http_code}' -X DELETE "$BASE/api/listings/$ID" \
  -H "x-api-key: not-the-real-key")
check "DELETE bad key" 401 "$CODE"

hr "5c. DELETE an unknown id -> 404"
CODE=$(curl -s -m 90 -o /dev/null -w '%{http_code}' -X DELETE "$BASE/api/listings/no-such-id-xyz" \
  -H "x-api-key: $KEY")
check "DELETE unknown id" 404 "$CODE"

hr "6. PATCH {\"status\":\"expired\"} -> 200"
RESP=$(curl -s -m 90 -X PATCH "$BASE/api/listings/$ID" \
  -H "x-api-key: $KEY" -H 'content-type: application/json' \
  -d '{"status":"expired"}' -w '\n%{http_code}')
CODE=$(echo "$RESP" | tail -1)
check "PATCH expire status" 200 "$CODE"

hr "6b. the listing is OFF the board but IN the archive"
# Render-time: the board excludes it, /archive includes it. Both fetched from
# the live DB through the real read path, so this tests the status filter.
HOME=$(curl -s -m 90 "$BASE/" 2>/dev/null)
ARCH=$(curl -s -m 90 "$BASE/archive" 2>/dev/null)
if echo "$HOME" | grep -qF "$TITLE"; then
  echo "  FAIL  expired listing still renders on the board"; FAIL=$((FAIL+1))
else
  echo "  PASS  not on the board"; PASS=$((PASS+1))
fi
if echo "$ARCH" | grep -qF "$TITLE"; then
  echo "  PASS  present in /archive"; PASS=$((PASS+1))
else
  echo "  FAIL  missing from /archive"; FAIL=$((FAIL+1))
fi
# The detail page must not resolve an expired listing. The slug came back from
# the create call above; ask the dev server for that URL directly.
CODE=$(curl -s -m 90 -o /dev/null -w '%{http_code}' "$BASE/listings/$SLUG")
if [ "$CODE" = "404" ]; then
  echo "  PASS  /listings/[slug] no longer serves it (404)"; PASS=$((PASS+1))
else
  echo "  FAIL  /listings/[slug] still serves it ($CODE)"; FAIL=$((FAIL+1))
fi

hr "6c. an illegal status transition is refused"
CODE=$(curl -s -m 90 -o /dev/null -w '%{http_code}' -X PATCH "$BASE/api/listings/$ID" \
  -H "x-api-key: $KEY" -H 'content-type: application/json' -d '{"status":"live"}')
check "PATCH status:live" 400 "$CODE"
CODE=$(curl -s -m 90 -o /dev/null -w '%{http_code}' -X PATCH "$BASE/api/listings/$ID" \
  -H "x-api-key: $KEY" -H 'content-type: application/json' -d '{"status":"draft"}')
check "PATCH status:draft" 400 "$CODE"
CODE=$(curl -s -m 90 -o /dev/null -w '%{http_code}' -X PATCH "$BASE/api/listings/$ID" \
  -H "x-api-key: $KEY" -H 'content-type: application/json' -d '{"status":"expired","summary":"sneak"}')
check "PATCH status+extra fields" 400 "$CODE"

hr "6d. immutable fields are refused in a general patch"
# Each of these must 400: a client cannot set identity or history.
# ({"status":"expired"} is NOT here — it is legal, and is handled by 6.)
for f in '{"id":"hacked"}' '{"slug":"hacked"}' '{"createdAt":"1999-01-01T00:00:00Z"}'; do
  CODE=$(curl -s -m 90 -o /dev/null -w '%{http_code}' -X PATCH "$BASE/api/listings/$ID" \
    -H "x-api-key: $KEY" -H 'content-type: application/json' -d "$f")
  if [ "$CODE" = "400" ]; then
    echo "  PASS  $f -> 400"; PASS=$((PASS+1))
  else
    echo "  FAIL  $f -> $CODE (expected 400)"; FAIL=$((FAIL+1))
  fi
done

hr "7. DELETE -> 204, and the row is gone"
CODE=$(curl -s -m 90 -o /dev/null -w '%{http_code}' -X DELETE "$BASE/api/listings/$ID" \
  -H "x-api-key: $KEY")
check "DELETE status" 204 "$CODE"
# It must now be absent from the archive too — a hard delete removes it entirely.
ARCH=$(curl -s -m 90 "$BASE/archive" 2>/dev/null)
if echo "$ARCH" | grep -qF "$TITLE"; then
  echo "  FAIL  deleted row still in /archive"; FAIL=$((FAIL+1))
else
  echo "  PASS  gone from /archive too"; PASS=$((PASS+1))
fi
CODE=$(curl -s -m 90 -o /dev/null -w '%{http_code}' -X DELETE "$BASE/api/listings/$ID" \
  -H "x-api-key: $KEY")
check "DELETE again (now unknown)" 404 "$CODE"

hr "8. Auth failures carry no leakage, and headers are set"
RESP=$(curl -s -m 90 -D "$TMP/hdr" -o "$TMP/body" -X PATCH "$BASE/api/listings/$ID" \
  -H "x-api-key: not-the-real-key" -H 'content-type: application/json' -d '{"summary":"x"}')
BODY=$(cat "$TMP/body")
if echo "$BODY" | grep -q "$KEY"; then
  echo "  FAIL  key echoed in an error body"; FAIL=$((FAIL+1))
else
  echo "  PASS  no key in error body ($BODY)"; PASS=$((PASS+1))
fi
if grep -qi "cache-control: no-store" "$TMP/hdr" && grep -qi "x-content-type-options: nosniff" "$TMP/hdr"; then
  echo "  PASS  no-store + nosniff headers present"; PASS=$((PASS+1))
else
  echo "  FAIL  security headers missing"; FAIL=$((FAIL+1))
fi

hr "RESULT: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1

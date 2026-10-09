# klawed tests

Plain `node --test`. No test framework, no TypeScript toolchain, no extra
dependencies — the suite imports the project's real TypeScript sources and
runs on a stock Node 22+ install.

## Run

```bash
node tests/run-tests.mjs        # the command `npm test` runs
```

Or one file at a time:

```bash
node --test tests/category-map.test.ts
node --test tests/validate-listing.test.ts
node --test tests/format.test.ts
```

(`node --test tests/` — a bare directory argument — does not work on this
Node build; `tests/run-tests.mjs` globs the `*.test.ts` files itself and
passes them to the runner, which is why `npm test` calls it.)

## What the files are

| File | Covers |
|---|---|
| `ts-resolver.mjs` | Resolve shim: the lib sources use extensionless imports (`./category-map`), which Vite/Astro resolve and Node's ESM loader does not. It retries them as `.ts` and hands the file to Node's native type-stripping. Not a test file. |
| `run-tests.mjs` | Runner: globs `tests/*.test.ts` and spawns `node --test` on the list. Not a test file. |
| `category-map.test.ts` | The ten kebab↔snake mappings round-tripped both directions (especially `ai-credits`↔`ai_credits` and `student-deals`↔`student_deals`), the snake forms the API must reject, unknown/malformed/cased values rejected, `REGIONS` order is exactly `nigeria, africa, global`. |
| `validate-listing.test.ts` | Every row of the TRD §4 validation contract: a valid body passes; each required field missing/blank/non-string → `missing_fields` naming it; bad category (including the snake form `ai_credits`, which must be rejected because the API speaks kebab); bad region; `bad_link` for http, `javascript:`, ftp, hostless and >2048-char links; the deadline rule in both directions (`evergreen=false` with missing/past/malformed deadline, `evergreen=true` with a non-null deadline) → `bad_deadline`; `evergreen=true` with null → valid; `createdAt` passthrough and trimming; non-object bodies. A fixed `now` (2026-10-09T12:00Z) is injected everywhere so past/future assertions are deterministic. |
| `format.test.ts` | `isoWeek` on known dates (9 Oct 2026 is **week 41**, measured), year-boundary ISO behaviour, all five `deadlineState` values, `daysLeft` rounding, the `isNew` 72h/73h boundary, `isExpired` for past/evergreen/null, `plural(1,…)` vs `plural(2,…)`, and the WAT display formatters (`formatDayMonth`, `formatDow`, `formatWatTime`, …). |

## Conventions

- Expected values were measured against the modules before being asserted —
  nothing here encodes a guess about what the code *should* do.
- `now` is always injected; no test reads the wall clock.
- Every test asserts. A test that only prints is a bug.

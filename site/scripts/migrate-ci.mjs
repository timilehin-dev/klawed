#!/usr/bin/env node
/**
 * Migration gate for CI/Vercel builds.
 *
 * Why this exists rather than calling `prisma migrate deploy` directly in the
 * Vercel build command (TRD §8):
 *
 *  - A migration failure must BLOCK the deploy — never force-past it. So a
 *    failure exits non-zero, which fails the build. That part is the same.
 *  - But an unattended build should not migrate production on every deploy, and
 *    two concurrent builds (production + a preview branch) would race on the
 *    advisory lock. So migrations are OPT-IN per build via RUN_MIGRATIONS=true,
 *    which the human sets when they intend a schema release.
 *
 * Default behaviour on Vercel (RUN_MIGRATIONS unset): skip, and say so plainly
 * in the build log. Local `npm run prisma:migrate` remains the explicit path.
 *
 * `prisma migrate deploy` only needs the direct (unpooled) URL — Neon's pooled
 * endpoint is PgBouncer and cannot run migrations.
 */

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const run = process.env.RUN_MIGRATIONS === 'true';

if (!run) {
  console.log(
    '[migrate-ci] RUN_MIGRATIONS is not "true" — skipping migrations. ' +
      'Set RUN_MIGRATIONS=true on the build that should apply the schema.',
  );
  process.exit(0);
}

if (!process.env.POSTGRES_URL_NON_POOLING && !process.env.DIRECT_DATABASE_URL) {
  console.error(
    '[migrate-ci] RUN_MIGRATIONS=true but no direct database URL is set. ' +
      'Migrations need POSTGRES_URL_NON_POOLING (the Vercel Postgres integration ' +
      'provides it). Refusing to run — a failed migration must block the deploy, ' +
      'and a silently skipped one is worse.',
  );
  process.exit(1);
}

console.log('[migrate-ci] applying migrations against the direct URL...');
try {
  execFileSync(
    process.execPath,
    [path.join(here, '..', 'node_modules', 'prisma', 'build', 'index.js'), 'migrate', 'deploy'],
    { stdio: 'inherit' },
  );
} catch {
  // Non-zero exit blocks the deploy. Never force past a failed migration (TRD §8).
  console.error('[migrate-ci] migration failed — build blocked. The previous deployment stays live.');
  process.exit(1);
}

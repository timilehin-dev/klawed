/**
 * The empty-state seed — `node prisma/seed.mjs` (TRD §3, WAVE2 brief §1).
 *
 * This file inserts ZERO listings. On purpose. Its job is to prove two things
 * and nothing else:
 *
 *   1. the database is reachable and POSTGRES_PRISMA_URL is valid, and
 *   2. the schema is applied — the Listing table exists and counts cleanly.
 *
 * It is the guarantee that no mock data ever enters the pipeline. If you are
 * looking for a demo row to delete, there is nothing here to delete: this
 * script never creates one, never has, and never will. Every listing on the
 * board arrives through POST /api/listings, from the poster, after owner
 * approval.
 *
 * It refuses to run unless you explicitly ask it to:
 *
 *   node prisma/seed.mjs --force      # or SEED_EMPTY=1
 *
 * Nothing is destructive — it performs exactly one read (a COUNT) and prints
 * the number of rows before and after (the count is unchanged; that is the
 * point of the file).
 */

const FORCE_FLAG = '--force';
const FORCE_ENV = 'SEED_EMPTY';

const forced =
  process.argv.slice(2).includes(FORCE_FLAG) ||
  process.env[FORCE_ENV] === '1' ||
  process.env[FORCE_ENV] === 'true';

if (!forced) {
  console.error(
    'seed.mjs refuses to run unasked. This script verifies the database and\n' +
      'inserts nothing. Re-run with the flag when you want the check:\n\n' +
      '  node prisma/seed.mjs --force\n' +
      '  SEED_EMPTY=1 node prisma/seed.mjs',
  );
  process.exit(1);
}

const url = process.env.POSTGRES_PRISMA_URL;
if (!url || url.trim().length === 0) {
  console.error(
    'POSTGRES_PRISMA_URL is not set. The seed needs it to reach the database.\n' +
      'Copy it from the Vercel Postgres (Neon) integration into your local .env —\n' +
      'the file is gitignored, so the value never lands in the repo (TRD §5).',
  );
  process.exit(1);
}

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

/** A count of every row, regardless of status — drafts are never hidden here. */
async function countAll() {
  return prisma.listing.count();
}

let before;
try {
  before = await countAll();
} catch (error) {
  console.error(
    'The database could not be reached, or the schema is not applied.\n' +
      'Expected the Listing table from prisma/schema.prisma (TRD §3).\n' +
      `Prisma said: ${firstLine(error)}`,
  );
  await prisma.$disconnect();
  process.exit(1);
}

console.log(`Listings before: ${before}`);

// --- nothing happens here, and that is the contract ---
// No listing is inserted. No demo row is created. No mock data exists.
// The seed proves the database is live and the schema is applied; the board
// starts empty and stays empty until the poster POSTs an approved listing.

let after;
try {
  after = await countAll();
} catch (error) {
  console.error(`The follow-up count failed: ${firstLine(error)}`);
  await prisma.$disconnect();
  process.exit(1);
}

console.log(`Listings after:  ${after}`);

if (after !== before) {
  console.error('Internal check failed: the count changed, which this script never does.');
  await prisma.$disconnect();
  process.exit(1);
}

console.log(
  `Seed complete. ${after} listing${after === 1 ? '' : 's'} in the database, none added by this script.`,
);

await prisma.$disconnect();

/** A Prisma error's first line — the message minus the invocation boilerplate. */
function firstLine(error) {
  if (error instanceof Error && typeof error.message === 'string') {
    const first = error.message.split('\n').find((line) => line.trim().length > 0);
    return first ?? error.message;
  }
  return String(error);
}

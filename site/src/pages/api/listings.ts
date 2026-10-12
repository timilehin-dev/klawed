/**
 * The Content API — POST /api/listings (TRD §4).
 *
 * The single write path into the database. Nothing else in the codebase writes
 * a Listing row; the poster's pipeline calls this endpoint with the owner's
 * key and an approved body.
 *
 * The contract, enforced here exactly as TRD §4 spells it out:
 *
 *   401  {"error":"unauthorized"}     missing or wrong key, or no key configured
 *   405  Allow: POST                  any other method
 *   400  {"error":"invalid_json"}     body does not parse as JSON
 *   400  {"error":"missing_fields","fields":[...]}
 *   400  {"error":"bad_category"}     category is not one of the ten kebab slugs
 *   400  {"error":"bad_region"}       region is not nigeria|africa|global
 *   400  {"error":"bad_link"}         link is not https with a host
 *   400  {"error":"bad_deadline"}     evergreen/deadline rule violated
 *   409  {"error":"duplicate"}        a live listing already holds this link
 *   503  {"error":"db_unavailable"}   the database could not be reached
 *   400  {"error":"bad_created_at"}   the optional createdAt is not a real date
 *   201  {"id":"<cuid>","status":"live"}   created
 *
 * Two rules this file keeps above all others:
 *   1. The API key never appears in a response body, an error body, or a log
 *      line. Only counts and error codes are ever logged.
 *   2. The database row is built from validated values only — the raw body is
 *      never spread into Prisma. An unknown or hostile field cannot reach the
 *      table.
 */

import crypto from 'node:crypto';
import type { APIRoute } from 'astro';
import { apiResponse, authorized, presentedKey, readJsonBody, dbErrorSummary } from '../../lib/api-auth';
import { validateListing } from '../../lib/validate-listing';
import { toSnake } from '../../lib/category-map';
import { makeSlug } from '../../lib/slug';
import { getPrisma } from '../../lib/prisma';

export const prerender = false;

/**
 * A collision-resistant id in Prisma's cuid() shape.
 *
 * The schema declares `slug String @unique` (non-nullable), and the slug is
 * derived from the id. Generating the id here lets the slug be written in the
 * same INSERT — no backfill, no window where a row has no resolvable URL.
 * Shape matters more than provenance: it only needs to be unique, URL-safe, and
 * stable as a slug suffix. crypto.randomUUID is the strongest source available
 * in the runtime.
 */
function createCuid(): string {
  const time = Date.now().toString(36);
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const counter = crypto.randomBytes(4).toString('hex');
  return `c${time}${rand}${counter}`;
}

export const POST: APIRoute = async ({ request }) => {
  // --- auth: before anything else touches the body ---
  if (!authorized(presentedKey(request))) {
    // No detail about what was wrong (TRD §4). Nothing about the key is logged.
    return apiResponse({ error: 'unauthorized' }, 401);
  }

  // --- body ---
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return apiResponse({ error: 'invalid_json' }, 400);

  const result = validateListing(parsed.value);
  if (!result.ok) {
    // Map the validator's failure codes one-for-one onto the TRD §4 table.
    return apiResponse({ error: result.failure.code, ...(result.failure.fields ? { fields: result.failure.fields } : {}) }, 400);
  }
  const input = result.value;

  const categorySnake = toSnake(input.category);
  if (!categorySnake) return apiResponse({ error: 'bad_category' }, 400);

  const prisma = getPrisma();
  if (!prisma) return apiResponse({ error: 'db_unavailable' }, 503);

  // --- the optional client timestamp: a real date, and a plausible one ---
  // The validator passes createdAt through untouched (it is optional), so the
  // parse check lives here. An unparseable value is rejected honestly rather
  // than handed to Prisma, where it would fail as a 503 that blames the
  // database for a bad body.
  //
  // It is also bounded. createdAt drives the "New" pill (72h) and the filing
  // order, so an unbounded override lets a valid key holder back-date a listing
  // by decades — or future-date it, which makes it "New" forever and sorts it to
  // the top of the wire. A timestamp more than a day ahead of the server, or
  // more than a year behind it, is a pipeline bug, not a filing.
  let createdAt = new Date();
  if (typeof input.createdAt === 'string' && input.createdAt.trim().length > 0) {
    const parsed = new Date(input.createdAt.trim());
    if (Number.isNaN(parsed.getTime())) {
      return apiResponse({ error: 'bad_created_at' }, 400);
    }
    const skewMs = Math.abs(parsed.getTime() - createdAt.getTime());
    if (skewMs > 365 * 86_400_000) {
      return apiResponse({ error: 'bad_created_at' }, 400);
    }
    createdAt = parsed;
  }

  // --- idempotency: a live listing already holding this link is a clean 409 ---
  // (TRD §4 — the poster may retry; no separate idempotency key is involved.)
  try {
    const existing = await prisma.listing.findFirst({
      where: { link: input.link, status: 'live' },
      select: { id: true },
    });
    if (existing) return apiResponse({ error: 'duplicate' }, 409);
  } catch (error) {
    // The client gets a code, never a stack trace (TRD §9). The server log gets
    // the error code and message — enough to diagnose a DB outage, and never the
    // API key or the request body.
    console.error('[api/listings] duplicate check failed:', dbErrorSummary(error));
    return apiResponse({ error: 'db_unavailable' }, 503);
  }

  // --- write, from the whitelist only ---
  // The id is generated here rather than by the database so the slug can be
  // derived from it in the SAME write. `slug` is non-nullable and unique in the
  // schema, so a two-step "insert, then backfill the slug" would either violate
  // the constraint or need a nullable column. One write, no window where a row
  // exists without a resolvable URL.
  const id = createCuid();
  const slug = makeSlug(input.title, id);

  let created: { id: string };
  try {
    created = await prisma.listing.create({
      data: {
        id,
        slug,
        title: input.title,
        org: input.org,
        category: categorySnake as never,
        deadline: input.deadline ? new Date(input.deadline) : null,
        evergreen: input.evergreen,
        eligibility: input.eligibility,
        link: input.link,
        region: input.region as never,
        summary: input.summary,
        status: 'live', // the API is the publish path (TRD §3/§4)
        createdAt,
      },
      select: { id: true },
    });
  } catch (error) {
    // P2002 is the unique index on (link) where status = 'live'. Reaching it
    // means the findFirst check above lost a race with a concurrent POST, so the
    // database — not the route — decided this link is already live. That is
    // still a clean 409 for the poster (TRD §4's idempotency contract), not a
    // 500 and not a duplicate row.
    if ((error as { code?: string }).code === 'P2002') {
      return apiResponse({ error: 'duplicate' }, 409);
    }
    console.error('[api/listings] create failed:', dbErrorSummary(error));
    return apiResponse({ error: 'db_unavailable' }, 503);
  }

  return apiResponse({ id: created.id, slug, status: 'live' }, 201);
};

// Only POST is accepted (TRD §4). Astro 404s unmatched methods by default; the
// explicit 405 + Allow header is the documented behaviour of the route.
export const GET: APIRoute = async () =>
  apiResponse({ error: 'method_not_allowed' }, 405, { Allow: 'POST' });
export const PUT: APIRoute = GET;
export const PATCH: APIRoute = GET;
export const DELETE: APIRoute = GET;
export const HEAD: APIRoute = GET;
export const OPTIONS: APIRoute = GET;

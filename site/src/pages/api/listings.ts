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
import { apiKey, hasApiKey } from '../../lib/env';
import { validateListing } from '../../lib/validate-listing';
import { toSnake } from '../../lib/category-map';
import { makeSlug } from '../../lib/slug';
import { getPrisma } from '../../lib/prisma';

export const prerender = false;

/** The three headers every response from this route carries. */
function jsonResponse(body: unknown, status: number, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extraHeaders,
    },
  });
}

/**
 * Constant-time key comparison (TRD §4).
 *
 * Both sides are SHA-256 digested before timingSafeEqual, so a mismatch in
 * length can never throw (timingSafeEqual requires equal-length buffers and a
 * throw would leak a timing side-channel anyway). With no key configured the
 * request is rejected outright — an unconfigured deployment is a closed door,
 * never an open one.
 */
function authorized(headerValue: string | null | undefined): boolean {
  const expected = apiKey();
  if (!hasApiKey() || !expected) return false;
  if (typeof headerValue !== 'string' || headerValue.length === 0) return false;
  const a = crypto.createHash('sha256').update(expected, 'utf8').digest();
  const b = crypto.createHash('sha256').update(headerValue, 'utf8').digest();
  return crypto.timingSafeEqual(a, b);
}

/** Accept `x-api-key: <key>` (TRD §4) and `Authorization: Bearer <key>` (flow.md §2). */
function presentedKey(request: Request): string | null {
  const direct = request.headers.get('x-api-key');
  if (direct && direct.trim().length > 0) return direct.trim();
  const auth = request.headers.get('authorization');
  if (auth) {
    const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (match && match[1].trim().length > 0) return match[1].trim();
  }
  return null;
}

/** Parse the body as JSON, returning a discriminated result. */
async function readJsonBody(request: Request): Promise<{ ok: true; value: unknown } | { ok: false }> {
  try {
    const text = await request.text();
    if (text.trim().length === 0) return { ok: false };
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

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

/**
 * A one-line, safe description of a database error for the server log.
 *
 * Deliberately narrow: the Prisma error code and the first line of the message.
 * Never the connection string, never the request body, never the API key. TRD §9
 * wants a diagnosable outage without turning Vercel's logs into a leak.
 */
function dbErrorSummary(error: unknown): string {
  if (error instanceof Error) {
    // Prisma's validation errors carry `name` but no `code`, and their first
    // line is the whole diagnosis ("Argument `slug` is missing."). A missing
    // message would log a blank line, which is worse than no log at all.
    const code = (error as { code?: string }).code;
    const first = error.message.split('\n').filter((l) => l.trim().length > 0)[0]?.slice(0, 200);
    if (!first) return code ?? error.name ?? 'unknown error';
    return code ? `${code}: ${first}` : first;
  }
  return 'unknown error';
}

export const POST: APIRoute = async ({ request }) => {
  // --- auth: before anything else touches the body ---
  if (!authorized(presentedKey(request))) {
    // No detail about what was wrong (TRD §4). Nothing about the key is logged.
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  // --- body ---
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return jsonResponse({ error: 'invalid_json' }, 400);

  const result = validateListing(parsed.value);
  if (!result.ok) {
    // Map the validator's failure codes one-for-one onto the TRD §4 table.
    return jsonResponse({ error: result.failure.code, ...(result.failure.fields ? { fields: result.failure.fields } : {}) }, 400);
  }
  const input = result.value;

  const categorySnake = toSnake(input.category);
  if (!categorySnake) return jsonResponse({ error: 'bad_category' }, 400);

  const prisma = getPrisma();
  if (!prisma) return jsonResponse({ error: 'db_unavailable' }, 503);

  // --- the optional client timestamp: a real date, or the server's now ---
  // The validator passes createdAt through untouched (it is optional), so the
  // parse check lives here. An unparseable value is rejected honestly rather
  // than handed to Prisma, where it would fail as a 503 that blames the
  // database for a bad body.
  let createdAt = new Date();
  if (typeof input.createdAt === 'string' && input.createdAt.trim().length > 0) {
    const parsed = new Date(input.createdAt.trim());
    if (Number.isNaN(parsed.getTime())) {
      return jsonResponse({ error: 'bad_created_at' }, 400);
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
    if (existing) return jsonResponse({ error: 'duplicate' }, 409);
  } catch (error) {
    // The client gets a code, never a stack trace (TRD §9). The server log gets
    // the error code and message — enough to diagnose a DB outage, and never the
    // API key or the request body.
    console.error('[api/listings] duplicate check failed:', dbErrorSummary(error));
    return jsonResponse({ error: 'db_unavailable' }, 503);
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
    console.error('[api/listings] create failed:', dbErrorSummary(error));
    return jsonResponse({ error: 'db_unavailable' }, 503);
  }

  return jsonResponse({ id: created.id, slug, status: 'live' }, 201);
};

// Only POST is accepted (TRD §4). Astro 404s unmatched methods by default; the
// explicit 405 + Allow header is the documented behaviour of the route.
export const GET: APIRoute = async () =>
  jsonResponse({ error: 'method_not_allowed' }, 405, { Allow: 'POST' });
export const PUT: APIRoute = GET;
export const PATCH: APIRoute = GET;
export const DELETE: APIRoute = GET;
export const HEAD: APIRoute = GET;
export const OPTIONS: APIRoute = GET;

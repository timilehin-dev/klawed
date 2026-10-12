/**
 * Listing management — PATCH and DELETE /api/listings/:id.
 *
 * The POST route at ../listings.ts is the publish path: it creates a row and
 * publishes it. This route is the opposite — it corrects and retracts what is
 * already live. Two real needs it serves:
 *
 *   1. The Editor stage REWRITES a listing after the humanizer pass. The copy
 *      that went live is Scout's raw voice; PATCH is how the humanized version
 *      replaces it without creating a duplicate row.
 *   2. The Verifier EXPIRES or DELETEs a listing when a deadline passes or a
 *      role is filled, so the board never shows something stale.
 *
 * Contract:
 *
 *   PATCH /api/listings/:id
 *     401  {"error":"unauthorized"}      missing/wrong key
 *     400  {"error":"invalid_json"}      body is not JSON
 *     400  {"error":"empty_patch"}       {} — nothing to change
 *     400  {"error":"unknown_fields"}    a field that is not editable
 *     400  {"error":"immutable_fields"}  id/slug/createdAt/status in the body
 *     400  {"error":"bad_category"|"bad_region"|"bad_link"|"bad_deadline"|"bad_field"}
 *     404  {"error":"not_found"}         no such id
 *     409  {"error":"duplicate"}         the new link is already live elsewhere
 *     200  the updated listing as JSON
 *
 *   DELETE /api/listings/:id
 *     401 / 404 as above, 204 no body on success.
 *     A hard delete — correct for pulling a fraudulent or wrong listing.
 *
 *   PATCH with {"status":"expired"}
 *     The one writable status transition, and only that shape: body must be
 *     exactly `{ "status": "expired" }` with nothing else. 400 bad_status for
 *     any other value. `live` and `draft` are never settable — a listing becomes
 *     live only by being created.
 *
 * Auth is the same key and the same constant-time comparison the POST route
 * uses, imported from lib/api-auth.ts so there is exactly one implementation.
 */

import type { APIRoute } from 'astro';
import {
  apiResponse,
  authorized,
  presentedKey,
  readJsonBody,
  dbErrorSummary,
} from '../../../lib/api-auth';
import { validateListingPatch } from '../../../lib/validate-listing';
import { toSnake } from '../../../lib/category-map';
import { makeSlug } from '../../../lib/slug';
import { getPrisma } from '../../../lib/prisma';

export const prerender = false;

/** Fields a client may change. Anything else is refused, not silently ignored. */
const EDITABLE = ['title', 'org', 'category', 'region', 'link', 'deadline', 'evergreen', 'eligibility', 'summary'] as const;

/** A 401 with no detail (TRD §4). Nothing about the key is logged. */
function unauthorized(): Response {
  return apiResponse({ error: 'unauthorized' }, 401);
}

function notFound(): Response {
  return apiResponse({ error: 'not_found' }, 404);
}

export const PATCH: APIRoute = async ({ request, params }) => {
  // --- auth: before anything else touches the body ---
  if (!authorized(presentedKey(request))) return unauthorized();

  const id = params.id;
  if (!id) return notFound();

  const parsed = await readJsonBody(request);
  if (!parsed.ok) return apiResponse({ error: 'invalid_json' }, 400);

  const prisma = getPrisma();
  if (!prisma) return apiResponse({ error: 'db_unavailable' }, 503);

  // --- load the row. An unknown id is a 404, not a 500. ---
  let existing;
  try {
    existing = await prisma.listing.findUnique({ where: { id } });
  } catch (error) {
    console.error('[api/listings/:id] lookup failed:', dbErrorSummary(error));
    return apiResponse({ error: 'db_unavailable' }, 503);
  }
  if (!existing) return notFound();

  // --- the one writable status transition -------------------------------
  // Handled before the general patch path because it is the ONLY way status is
  // ever set, and the body must be exactly this shape. Anything else carrying a
  // `status` key falls through to validateListingPatch, which rejects it as an
  // immutable field with a specific code.
  if (typeof parsed.value === 'object' && parsed.value !== null && 'status' in parsed.value) {
    const body = parsed.value as Record<string, unknown>;
    const keys = Object.keys(body);
    if (keys.length === 1 && keys[0] === 'status' && body.status === 'expired') {
      if (existing.status === 'expired') {
        // Already expired: idempotent, so report the row rather than erroring.
        // A verifier re-checking a listing it already retired should not fail.
        return apiResponse({ ...existing }, 200);
      }
      try {
        const updated = await prisma.listing.update({
          where: { id },
          data: { status: 'expired' },
        });
        return apiResponse(updated, 200);
      } catch (error) {
        console.error('[api/listings/:id] expire failed:', dbErrorSummary(error));
        return apiResponse({ error: 'db_unavailable' }, 503);
      }
    }
    // Any other status value, or extra fields alongside it.
    return apiResponse({ error: 'bad_status' }, 400);
  }

  // --- general field patch ----------------------------------------------
  const result = validateListingPatch(parsed.value);
  if (!result.ok) {
    return apiResponse(
      { error: result.failure.code, ...(result.failure.fields ? { fields: result.failure.fields } : {}) },
      400,
    );
  }
  const patch = result.value;

  // The merged view of the row after this patch, so the evergreen/deadline
  // invariant is checked against what WILL be stored, not what was sent.
  const nextEvergreen = patch.evergreen ?? existing.evergreen;
  const nextDeadline =
    patch.deadline !== undefined
      ? patch.deadline === null
        ? null
        : new Date(patch.deadline)
      : existing.deadline;

  if (nextEvergreen) {
    if (nextDeadline !== null) return apiResponse({ error: 'bad_deadline' }, 400);
  } else {
    if (nextDeadline === null) return apiResponse({ error: 'bad_deadline' }, 400);
    if (Number.isNaN(nextDeadline.getTime())) return apiResponse({ error: 'bad_deadline' }, 400);
  }

  // The title changing re-derives the slug. makeSlug suffixes the row id, so the
  // result stays unique without a collision probe.
  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) {
    data.title = patch.title;
    data.slug = makeSlug(patch.title, existing.id);
  }
  if (patch.org !== undefined) data.org = patch.org;
  if (patch.summary !== undefined) data.summary = patch.summary;
  if (patch.eligibility !== undefined) data.eligibility = patch.eligibility;
  if (patch.link !== undefined) data.link = patch.link;
  if (patch.category !== undefined) {
    const snake = toSnake(patch.category);
    if (!snake) return apiResponse({ error: 'bad_category' }, 400);
    data.category = snake;
  }
  if (patch.region !== undefined) data.region = patch.region;
  if (patch.evergreen !== undefined) data.evergreen = patch.evergreen;
  if (patch.deadline !== undefined) {
    data.deadline = patch.deadline === null ? null : new Date(patch.deadline);
  }

  if (Object.keys(data).length === 0) return apiResponse({ error: 'empty_patch' }, 400);

  try {
    const updated = await prisma.listing.update({ where: { id }, data });
    return apiResponse(updated, 200);
  } catch (error) {
    // P2002 on link: the new link is already held by a live listing. The partial
    // unique index in the schema is what decides that, so the database's
    // verdict stands.
    if ((error as { code?: string }).code === 'P2002') {
      return apiResponse({ error: 'duplicate' }, 409);
    }
    console.error('[api/listings/:id] update failed:', dbErrorSummary(error));
    return apiResponse({ error: 'db_unavailable' }, 503);
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  if (!authorized(presentedKey(request))) return unauthorized();

  const id = params.id;
  if (!id) return notFound();

  const prisma = getPrisma();
  if (!prisma) return apiResponse({ error: 'db_unavailable' }, 503);

  // Confirm the row exists first so an unknown id is a 404 rather than a 204
  // that claims to have deleted something. Prisma's delete would otherwise
  // throw P2025, which reads as a server error for a client mistake.
  let existing;
  try {
    existing = await prisma.listing.findUnique({ where: { id }, select: { id: true } });
  } catch (error) {
    console.error('[api/listings/:id] lookup failed:', dbErrorSummary(error));
    return apiResponse({ error: 'db_unavailable' }, 503);
  }
  if (!existing) return notFound();

  try {
    await prisma.listing.delete({ where: { id } });
  } catch (error) {
    console.error('[api/listings/:id] delete failed:', dbErrorSummary(error));
    return apiResponse({ error: 'db_unavailable' }, 503);
  }

  return new Response(null, {
    status: 204,
    headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  });
};

// Only PATCH and DELETE are accepted here. Every other method is a 405 with the
// Allow header, so a client that POSTs to the wrong URL is told where to go.
const methodNotAllowed = (allow: string): APIRoute => () =>
  apiResponse({ error: 'method_not_allowed' }, 405, { Allow: allow });

export const GET = methodNotAllowed('PATCH, DELETE');
export const PUT = methodNotAllowed('PATCH, DELETE');
export const POST = methodNotAllowed('POST /api/listings');
export const HEAD = methodNotAllowed('PATCH, DELETE');
export const OPTIONS = methodNotAllowed('PATCH, DELETE');

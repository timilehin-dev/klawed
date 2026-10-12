/**
 * Shared Content API plumbing — auth, response shape, error summarising.
 *
 * Extracted from the POST route so PATCH and DELETE reuse the SAME key
 * comparison rather than a second implementation of it. One auth path is the
 * whole point: a second one is a second thing to get wrong, and the failure mode
 * is an unauthenticated write.
 *
 * The two rules that govern every response from the Content API:
 *   1. The API key never appears in a body or a log line. Only error codes and
 *      counts are ever logged.
 *   2. Every response carries `cache-control: no-store` and
 *      `x-content-type-options: nosniff`.
 */

import crypto from 'node:crypto';
import { apiKey, hasApiKey } from './env';

/** The three headers every response from the Content API carries. */
export function apiResponse(
  body: unknown,
  status: number,
  extraHeaders?: Record<string, string>,
): Response {
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
export function authorized(headerValue: string | null | undefined): boolean {
  const expected = apiKey();
  if (!hasApiKey() || !expected) return false;
  if (typeof headerValue !== 'string' || headerValue.length === 0) return false;
  const a = crypto.createHash('sha256').update(expected, 'utf8').digest();
  const b = crypto.createHash('sha256').update(headerValue, 'utf8').digest();
  return crypto.timingSafeEqual(a, b);
}

/** Accept `x-api-key: *** (TRD §4) and `Authorization: Bearer *** (flow.md §2). */
export function presentedKey(request: Request): string | null {
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
export async function readJsonBody(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false }> {
  try {
    const text = await request.text();
    if (text.trim().length === 0) return { ok: false };
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

/**
 * A one-line, safe description of a database error for the server log.
 *
 * Deliberately narrow: the Prisma error code and the first line of the message.
 * Never the connection string, never the request body, never the API key. TRD §9
 * wants a diagnosable outage without turning Vercel's logs into a leak.
 */
export function dbErrorSummary(error: unknown): string {
  if (error instanceof Error) {
    // Prisma's validation errors carry `name` but no `code`, and their first
    // line is the whole diagnosis ("Argument `slug` is missing."). A missing
    // message would log a blank line, which is worse than no log at all.
    const code = (error as { code?: string }).code;
    const first = error.message
      .split('\n')
      .filter((l) => l.trim().length > 0)[0]
      ?.slice(0, 200);
    if (!first) return code ?? error.name ?? 'unknown error';
    return code ? `${code}: ${first}` : first;
  }
  return 'unknown error';
}

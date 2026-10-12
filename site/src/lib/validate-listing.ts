/**
 * Listing validation — the Content API contract (TRD §4).
 *
 * The API is "a dumb, fast, reliable pipe": it enforces SHAPE, not truth. Link
 * resolution and deadline reality are the verifier's job upstream. Everything
 * here is pure and synchronous so it is exhaustively unit-testable without a
 * database.
 *
 * Failure shape: { code, fields? } where code is one of the TRD §4 error codes.
 */

import { isCategoryKebab, isRegion } from './category-map';

/** The accepted body shape, minus createdAt (server-owned, optional override). */
export interface ListingInput {
  title: string;
  org: string;
  category: string;
  deadline: string | null;
  evergreen: boolean;
  eligibility: string;
  link: string;
  region: string;
  summary: string;
  /** Optional: the pipeline's own timestamp. Server defaults to now. */
  createdAt?: string;
}

export interface ValidationFailure {
  code:
    | 'invalid_json'
    | 'missing_fields'
    | 'bad_category'
    | 'bad_region'
    | 'bad_link'
    | 'bad_deadline';
  /** Only set for missing_fields — the offending field names. */
  fields?: string[];
}

export type ValidationResult =
  | { ok: true; value: ListingInput }
  | { ok: false; failure: ValidationFailure };

/** Patch-specific failure codes, on top of the create-path vocabulary. */
export interface PatchFailure {
  code:
    | 'invalid_json'
    | 'missing_fields'
    | 'bad_category'
    | 'bad_region'
    | 'bad_link'
    | 'bad_deadline'
    // PATCH adds: a field the client may never set, a field that does not
    // exist, a type error on an editable field, and a body that changes nothing.
    | 'immutable_fields'
    | 'unknown_fields'
    | 'bad_field'
    | 'empty_patch';
  /** The offending field names, where the code names them. */
  fields?: string[];
}

export type PatchResult =
  | { ok: true; value: Partial<ListingInput> }
  | { ok: false; failure: PatchFailure };

const REQUIRED_STRINGS = ['title', 'org', 'eligibility', 'link', 'summary'] as const;

/**
 * A URL is accepted only when it is https and carries a REAL host.
 *
 * `hostname.length > 0` is not enough, and this is not theoretical: the WHATWG
 * parser treats `https:///path` as having hostname `"path"` — the first segment
 * of the triple-slash form becomes the host. So a link with no host at all
 * passed this check and was stored live, which breaks the PRD's one hard rule
 * (§7.1: "a listing without a working direct link is dropped, never guessed").
 *
 * A real host therefore needs a dot or an IPv6/IPv4 literal. `localhost` and
 * single-label hosts are rejected deliberately: an application URL for this
 * board always lives on a registrable domain, and the verifier re-resolves the
 * link upstream anyway — this endpoint's job is to refuse shapes that cannot
 * possibly be a direct application page.
 */
function validLink(raw: unknown): raw is string {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 2048) return false;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;

  const host = url.hostname;
  if (host.length === 0) return false;
  // IPv6 literal — [::1] parses with the brackets retained.
  if (host.startsWith('[')) return true;
  // IPv4 literal — four dotted octets.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  // A registrable host has at least one dot and a real TLD-ish label after it.
  return /^[^.]+\..+$/.test(host) && !host.endsWith('.');
}

/**
 * Validate a parsed body. Pure — no I/O, no clock except the injected `now`,
 * so tests are deterministic.
 */
export function validateListing(body: unknown, now: Date = new Date()): ValidationResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, failure: { code: 'missing_fields' } };
  }
  const b = body as Record<string, unknown>;

  // --- required non-empty strings ---
  const missing: string[] = [];
  for (const field of REQUIRED_STRINGS) {
    const v = b[field];
    if (typeof v !== 'string' || v.trim().length === 0) missing.push(field);
  }

  // --- evergreen must be a boolean ---
  if (typeof b.evergreen !== 'boolean') missing.push('evergreen');

  // --- category ---
  if (!isCategoryKebab(b.category)) {
    return { ok: false, failure: { code: 'bad_category' } };
  }

  // --- region ---
  if (!isRegion(b.region)) {
    return { ok: false, failure: { code: 'bad_region' } };
  }

  // --- link ---
  if (typeof b.link === 'string' && b.link.trim().length > 0 && !validLink(b.link)) {
    return { ok: false, failure: { code: 'bad_link' } };
  }

  // --- deadline, both directions (TRD §3/§4) ---
  const deadlineFailure = validateDeadline(b, now);
  if (deadlineFailure) return { ok: false, failure: deadlineFailure };

  // Missing strings are reported after the enums/url so a body with several
  // problems still yields the most specific code first (TRD §4 order).
  if (missing.length > 0) {
    return { ok: false, failure: { code: 'missing_fields', fields: missing } };
  }

  const value: ListingInput = {
    title: (b.title as string).trim(),
    org: (b.org as string).trim(),
    category: b.category as string,
    deadline:
      typeof b.deadline === 'string' && b.deadline.trim().length > 0
        ? (b.deadline as string)
        : null,
    evergreen: b.evergreen as boolean,
    eligibility: (b.eligibility as string).trim(),
    link: (b.link as string).trim(),
    region: b.region as string,
    summary: (b.summary as string).trim(),
  };
  if (typeof b.createdAt === 'string' && b.createdAt.trim().length > 0) {
    value.createdAt = (b.createdAt as string).trim();
  }
  return { ok: true, value };
}

/**
 * Validate a PARTIAL body for PATCH — only the fields present are checked.
 *
 * Same rules as `validateListing` per field (same failure codes, same `bad_*`
 * vocabulary), but absence is legal: an editor rewriting one summary sends
 * `{ "summary": "..." }` and nothing else.
 *
 * Two things this deliberately refuses, both about not letting a client set
 * state it should not:
 *   - An empty body is not a patch. `{}` would 200 without changing anything,
 *     which reads like a silent failure to the caller.
 *   - `id`, `slug`, `createdAt` and `status` are rejected outright here. Status
 *     has exactly one legal transition and it goes through a dedicated shape in
 *     the route (live -> expired, body exactly `{ "status": "expired" }`), so
 *     accepting it in a general patch would open draft/live to the API.
 *
 * The evergreen/deadline invariant cannot be checked from the body alone — a
 * patch that flips `evergreen` without restating `deadline` may still be valid
 * or invalid depending on what is stored. The route checks it against the row.
 */
export function validateListingPatch(body: unknown): PatchResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, failure: { code: 'invalid_json' } };
  }
  const b = body as Record<string, unknown>;

  const FORBIDDEN = ['id', 'slug', 'createdAt', 'status'];
  const forbiddenPresent = FORBIDDEN.filter((k) => k in b);
  if (forbiddenPresent.length > 0) {
    return { ok: false, failure: { code: 'immutable_fields', fields: forbiddenPresent } };
  }

  const patch: Partial<ListingInput> = {};
  const keys = Object.keys(b);
  if (keys.length === 0) {
    return { ok: false, failure: { code: 'empty_patch' } };
  }

  // Only these four fields are editable; anything else is an unknown key.
  const UNKNOWN = 'unknown_fields';
  const unknown = keys.filter(
    (k) => !['title', 'org', 'summary', 'eligibility', 'link', 'category', 'region', 'deadline', 'evergreen'].includes(k),
  );
  if (unknown.length > 0) {
    return { ok: false, failure: { code: UNKNOWN, fields: unknown } };
  }

  // Trimmed string fields: a non-string is a type error, not an empty one.
  const STRING_FIELDS: Array<keyof ListingInput> = ['title', 'org', 'summary', 'eligibility'];
  for (const field of STRING_FIELDS) {
    if (!(field in b)) continue;
    const raw = b[field];
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      return { ok: false, failure: { code: 'bad_field', fields: [field] } };
    }
    patch[field] = raw.trim() as never;
  }

  if ('category' in b) {
    if (typeof b.category !== 'string' || !isCategoryKebab(b.category)) {
      return { ok: false, failure: { code: 'bad_category' } };
    }
    patch.category = b.category;
  }

  if ('region' in b) {
    if (typeof b.region !== 'string' || !isRegion(b.region)) {
      return { ok: false, failure: { code: 'bad_region' } };
    }
    patch.region = b.region;
  }

  if ('link' in b) {
    if (typeof b.link !== 'string' || !validLink(b.link.trim())) {
      return { ok: false, failure: { code: 'bad_link' } };
    }
    patch.link = b.link.trim();
  }

  if ('deadline' in b) {
    // null is legal here — clearing a deadline is the second half of flipping a
    // listing to evergreen, and the row-level check below enforces the pairing.
    const raw = b.deadline;
    if (raw === null) {
      patch.deadline = null;
    } else if (typeof raw === 'string' && raw.trim().length > 0 && !Number.isNaN(new Date(raw).getTime())) {
      patch.deadline = raw;
    } else {
      return { ok: false, failure: { code: 'bad_deadline' } };
    }
  }

  if ('evergreen' in b) {
    if (typeof b.evergreen !== 'boolean') {
      return { ok: false, failure: { code: 'bad_field', fields: ['evergreen'] } };
    }
    patch.evergreen = b.evergreen;
  }

  return { ok: true, value: patch };
}

/**
 * The deadline rule, enforced both ways:
 *   evergreen=false ⇒ deadline present, parseable, and in the future
 *   evergreen=true  ⇒ deadline must be null
 */
function validateDeadline(
  b: Record<string, unknown>,
  now: Date,
): ValidationFailure | null {
  const raw = b.deadline;

  if (b.evergreen === true) {
    if (raw !== null && raw !== undefined) {
      return { code: 'bad_deadline' };
    }
    return null;
  }

  // evergreen === false
  if (raw === null || raw === undefined) {
    return { code: 'bad_deadline' };
  }
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return { code: 'bad_deadline' };
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return { code: 'bad_deadline' };
  }
  if (parsed.getTime() <= now.getTime()) {
    return { code: 'bad_deadline' };
  }
  return null;
}

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

const REQUIRED_STRINGS = ['title', 'org', 'eligibility', 'link', 'summary'] as const;

/** A URL is accepted only when it is https and parses with a real host. */
function validLink(raw: unknown): raw is string {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 2048) return false;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  return url.protocol === 'https:' && url.hostname.length > 0;
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

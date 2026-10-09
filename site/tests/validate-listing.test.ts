/**
 * validate-listing tests — every row of the TRD §4 validation contract.
 *
 * Run: node --test tests/   (see tests/README.md)
 *
 * `now` is injected into every call so the past/future deadline assertions are
 * deterministic — the suite never depends on the wall clock.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { registerTsResolver } from './ts-resolver.mjs';
registerTsResolver();

const { validateListing } = await import('../src/lib/validate-listing.ts');

/** The fixed clock the suite reasons against: Friday 9 October 2026, noon UTC. */
const NOW = new Date('2026-10-09T12:00:00.000Z');
const DAY = 86_400_000;

/** A deadline comfortably in the future relative to NOW. */
const FUTURE = new Date(NOW.getTime() + 30 * DAY).toISOString();
const PAST = '2020-01-01T00:00:00.000Z';

/** A fully valid non-evergreen body. Every test mutates one thing from here. */
function validBody(): Record<string, unknown> {
  return {
    title: 'Backend Engineer, Payments',
    org: 'Example Bank',
    category: 'jobs',
    deadline: FUTURE,
    evergreen: false,
    eligibility: 'Open to final-year students and recent graduates',
    link: 'https://example.com/apply',
    region: 'nigeria',
    summary: 'Build the payments core of a new bank.',
  };
}

/** Assert the body fails with exactly this TRD §4 code (and fields, if any). */
function expectFailure(body: unknown, code: string, fields?: string[]) {
  const result = validateListing(body, NOW);
  assert.equal(result.ok, false, `expected ${code} for ${JSON.stringify(body)}`);
  if (result.ok) return;
  assert.equal(result.failure.code, code);
  if (fields) assert.deepEqual(result.failure.fields, fields);
}

/** Assert the body passes and return the validated value. */
function expectValid(body: unknown) {
  const result = validateListing(body, NOW);
  assert.equal(result.ok, true, `expected valid, got ${JSON.stringify(result)}`);
  if (!result.ok) throw new Error('unreachable');
  return result.value;
}

// ---------------------------------------------------------------------------
// the happy path
// ---------------------------------------------------------------------------

test('a complete valid body passes', () => {
  const value = expectValid(validBody());
  assert.equal(value.title, 'Backend Engineer, Payments');
  assert.equal(value.org, 'Example Bank');
  assert.equal(value.category, 'jobs');
  assert.equal(value.deadline, FUTURE);
  assert.equal(value.evergreen, false);
  assert.equal(value.link, 'https://example.com/apply');
  assert.equal(value.region, 'nigeria');
  assert.equal(value.createdAt, undefined);
});

test('every one of the ten categories passes', () => {
  const kebabs = [
    'jobs',
    'remote',
    'hackathons',
    'grants',
    'accelerators',
    'visas',
    'scholarships',
    'internships',
    'ai-credits',
    'student-deals',
  ];
  for (const category of kebabs) {
    expectValid({ ...validBody(), category });
  }
});

test('every one of the three regions passes', () => {
  for (const region of ['nigeria', 'africa', 'global']) {
    expectValid({ ...validBody(), region });
  }
});

test('strings are trimmed, unknown body fields are ignored', () => {
  const value = expectValid({
    ...validBody(),
    title: '  Padded Title  ',
    summary: '  Padded summary.  ',
    // hostile / unknown fields: not part of the contract, must not appear
    id: 'attacker-chosen-id',
    status: 'expired',
    slug: 'attacker-slug',
    createdAt: '2020-01-01T00:00:00Z',
  });
  assert.equal(value.title, 'Padded Title');
  assert.equal(value.summary, 'Padded summary.');
  assert.equal('id' in value, false);
  assert.equal('status' in value, false);
  assert.equal('slug' in value, false);
});

// ---------------------------------------------------------------------------
// missing_fields
// ---------------------------------------------------------------------------

test('each required string, when missing, reports missing_fields with its name', () => {
  const cases: [string, string][] = [
    ['title', ''],
    ['org', ''],
    ['eligibility', ''],
    ['link', ''],
    ['summary', ''],
  ];
  for (const [field, blank] of cases) {
    expectFailure({ ...validBody(), [field]: blank }, 'missing_fields', [field]);
    const without = validBody();
    delete without[field];
    expectFailure(without, 'missing_fields', [field]);
  }
});

test('whitespace-only strings count as missing', () => {
  expectFailure({ ...validBody(), title: '   ' }, 'missing_fields', ['title']);
  expectFailure({ ...validBody(), org: '\t\n' }, 'missing_fields', ['org']);
  expectFailure({ ...validBody(), summary: ' ' }, 'missing_fields', ['summary']);
});

test('a non-string required field counts as missing', () => {
  expectFailure({ ...validBody(), title: 42 }, 'missing_fields', ['title']);
  expectFailure({ ...validBody(), summary: null }, 'missing_fields', ['summary']);
  expectFailure({ ...validBody(), link: ['https://example.com'] }, 'missing_fields', ['link']);
});

test('evergreen must be a boolean', () => {
  expectFailure({ ...validBody(), evergreen: 'true' }, 'missing_fields', ['evergreen']);
  expectFailure({ ...validBody(), evergreen: 1 }, 'missing_fields', ['evergreen']);
  expectFailure({ ...validBody(), evergreen: null }, 'missing_fields', ['evergreen']);
  const without = validBody();
  delete without.evergreen;
  expectFailure(without, 'missing_fields', ['evergreen']);
});

test('several missing fields are all reported', () => {
  const body = { ...validBody(), title: '', org: '', summary: '' };
  expectFailure(body, 'missing_fields', ['title', 'org', 'summary']);
});

// ---------------------------------------------------------------------------
// bad_category
// ---------------------------------------------------------------------------

test('an unknown category is bad_category', () => {
  expectFailure({ ...validBody(), category: 'fellowships' }, 'bad_category');
  expectFailure({ ...validBody(), category: '' }, 'bad_category');
  expectFailure({ ...validBody(), category: undefined }, 'bad_category');
});

test('the snake_case form is REJECTED — the API speaks kebab', () => {
  expectFailure({ ...validBody(), category: 'ai_credits' }, 'bad_category');
  expectFailure({ ...validBody(), category: 'student_deals' }, 'bad_category');
});

test('case and padding variants are bad_category', () => {
  expectFailure({ ...validBody(), category: 'Jobs' }, 'bad_category');
  expectFailure({ ...validBody(), category: 'AI-CREDITS' }, 'bad_category');
  expectFailure({ ...validBody(), category: ' ai-credits' }, 'bad_category');
  expectFailure({ ...validBody(), category: 'jobs ' }, 'bad_category');
  expectFailure({ ...validBody(), category: 'ai credits' }, 'bad_category');
});

test('a non-string category is bad_category', () => {
  expectFailure({ ...validBody(), category: 7 }, 'bad_category');
  expectFailure({ ...validBody(), category: ['jobs'] }, 'bad_category');
});

// ---------------------------------------------------------------------------
// bad_region
// ---------------------------------------------------------------------------

test('an unknown region is bad_region', () => {
  expectFailure({ ...validBody(), region: 'europe' }, 'bad_region');
  expectFailure({ ...validBody(), region: '' }, 'bad_region');
  expectFailure({ ...validBody(), region: undefined }, 'bad_region');
  expectFailure({ ...validBody(), region: 'naija' }, 'bad_region');
});

test('case and padding variants are bad_region', () => {
  expectFailure({ ...validBody(), region: 'Nigeria' }, 'bad_region');
  expectFailure({ ...validBody(), region: 'NIGERIA' }, 'bad_region');
  expectFailure({ ...validBody(), region: ' global' }, 'bad_region');
});

test('a non-string region is bad_region', () => {
  expectFailure({ ...validBody(), region: 1 }, 'bad_region');
  expectFailure({ ...validBody(), region: { name: 'nigeria' } }, 'bad_region');
});

// ---------------------------------------------------------------------------
// bad_link
// ---------------------------------------------------------------------------

test('a non-https link is bad_link', () => {
  expectFailure({ ...validBody(), link: 'http://example.com/apply' }, 'bad_link');
  expectFailure({ ...validBody(), link: 'ftp://example.com/file' }, 'bad_link');
  expectFailure({ ...validBody(), link: 'javascript:alert(1)' }, 'bad_link');
  expectFailure({ ...validBody(), link: 'data:text/html,hi' }, 'bad_link');
});

test('a link with no host is bad_link', () => {
  expectFailure({ ...validBody(), link: 'https://' }, 'bad_link');
  expectFailure({ ...validBody(), link: 'https://?q=1' }, 'bad_link');
  expectFailure({ ...validBody(), link: 'https://:8080/apply' }, 'bad_link');
  expectFailure({ ...validBody(), link: 'https://exa mple.com' }, 'bad_link');
});

test('a link longer than 2048 characters is bad_link', () => {
  const prefix = 'https://example.com/'; // 20 chars
  const tooLong = prefix + 'a'.repeat(2029);
  assert.equal(tooLong.length, 2049);
  expectFailure({ ...validBody(), link: tooLong }, 'bad_link');

  const atLimit = prefix + 'a'.repeat(2028);
  assert.equal(atLimit.length, 2048);
  expectValid({ ...validBody(), link: atLimit });
});

test('a valid https link with a real host passes', () => {
  expectValid({ ...validBody(), link: 'https://example.com/a/b/c?x=1#frag' });
  expectValid({ ...validBody(), link: 'https://sub.domain.example.co.uk:8443/apply' });
});

// The validator only reports bad_link for a string that is present but not a
// valid https URL. A non-string link is a missing field, per the §4 table
// ("All required fields present and non-empty" comes first), so it surfaces as
// missing_fields with the link named.
test('a non-string link is reported as a missing field', () => {
  expectFailure({ ...validBody(), link: 12345 }, 'missing_fields', ['link']);
});

// ---------------------------------------------------------------------------
// bad_deadline — both directions (TRD §4)
// ---------------------------------------------------------------------------

test('evergreen=false with no deadline is bad_deadline', () => {
  expectFailure({ ...validBody(), deadline: null }, 'bad_deadline');
  const without = validBody();
  delete without.deadline;
  expectFailure(without, 'bad_deadline');
  expectFailure({ ...validBody(), deadline: '' }, 'bad_deadline');
  expectFailure({ ...validBody(), deadline: '   ' }, 'bad_deadline');
});

test('evergreen=false with a past deadline is bad_deadline', () => {
  expectFailure({ ...validBody(), deadline: PAST }, 'bad_deadline');
  expectFailure(
    { ...validBody(), deadline: new Date(NOW.getTime() - 1000).toISOString() },
    'bad_deadline',
  );
});

test('evergreen=false with the deadline exactly now is bad_deadline', () => {
  expectFailure({ ...validBody(), deadline: NOW.toISOString() }, 'bad_deadline');
});

test('evergreen=false with a malformed date is bad_deadline', () => {
  expectFailure({ ...validBody(), deadline: 'next tuesday-ish' }, 'bad_deadline');
  expectFailure({ ...validBody(), deadline: '2026-13-45' }, 'bad_deadline');
  expectFailure({ ...validBody(), deadline: 'tomorrow' }, 'bad_deadline');
  expectFailure({ ...validBody(), deadline: {} }, 'bad_deadline');
  expectFailure({ ...validBody(), deadline: 42 }, 'bad_deadline');
});

test('evergreen=false with a future deadline passes', () => {
  expectValid({ ...validBody(), deadline: new Date(NOW.getTime() + 1000).toISOString() });
  expectValid({ ...validBody(), deadline: '2030-06-30T23:59:59Z' });
});

test('evergreen=true with a non-null deadline is bad_deadline', () => {
  expectFailure({ ...validBody(), evergreen: true, deadline: FUTURE }, 'bad_deadline');
  expectFailure({ ...validBody(), evergreen: true, deadline: PAST }, 'bad_deadline');
  expectFailure({ ...validBody(), evergreen: true, deadline: '' }, 'bad_deadline');
  expectFailure({ ...validBody(), evergreen: true, deadline: 'anything' }, 'bad_deadline');
});

test('evergreen=true with null or omitted deadline is valid', () => {
  const withNull = expectValid({ ...validBody(), evergreen: true, deadline: null });
  assert.equal(withNull.deadline, null);
  assert.equal(withNull.evergreen, true);

  const without = validBody();
  delete without.deadline;
  const omitted = expectValid({ ...without, evergreen: true });
  assert.equal(omitted.deadline, null);
});

// ---------------------------------------------------------------------------
// createdAt — the optional client timestamp
// ---------------------------------------------------------------------------

test('a valid createdAt is passed through, trimmed', () => {
  const value = expectValid({ ...validBody(), createdAt: ' 2026-10-01T08:30:00Z ' });
  assert.equal(value.createdAt, '2026-10-01T08:30:00Z');
});

test('an absent or empty createdAt is left undefined for the server to default', () => {
  assert.equal(expectValid(validBody()).createdAt, undefined);
  assert.equal(expectValid({ ...validBody(), createdAt: '' }).createdAt, undefined);
  assert.equal(expectValid({ ...validBody(), createdAt: '   ' }).createdAt, undefined);
});

// ---------------------------------------------------------------------------
// non-object bodies
// ---------------------------------------------------------------------------

test('null, arrays and primitives fail with missing_fields', () => {
  expectFailure(null, 'missing_fields');
  expectFailure(undefined, 'missing_fields');
  expectFailure([], 'missing_fields');
  expectFailure('a string body', 'missing_fields');
  expectFailure(42, 'missing_fields');
  expectFailure(true, 'missing_fields');
});

test('a host-less link is rejected (bad_link), not accepted', () => {
  // The WHATWG parser gives https:///path a hostname of "path", so a naive
  // `hostname.length > 0` check accepted a link with no host at all — breaking
  // PRD §7.1 (no working direct link, no listing). Found by a live audit.
  const future = new Date(Date.now() + 45 * 86_400_000).toISOString();
  const base = {
    title: 'T', org: 'O', category: 'jobs', deadline: future, evergreen: false,
    eligibility: 'e', region: 'nigeria', summary: 's',
  };
  const now = new Date();

  const rejected = (link) => {
    const r = validateListing({ ...base, link }, now);
    return !r.ok && r.failure.code === 'bad_link';
  };

  assert.ok(rejected('https:///path'), 'host-less triple slash must be bad_link');
  assert.ok(rejected('https://localhost/x'), 'a single-label host is not an application URL');
  assert.ok(rejected('https://example.com.'), 'a trailing-dot host is not a real host');

  // Still accepted: a registrable host, a deep subdomain, and IP literals.
  for (const good of [
    'https://example.com/apply',
    'https://sub.example.co.uk/a?b=c#d',
    'https://[::1]/x',
    'https://127.0.0.1/x',
  ]) {
    const r = validateListing({ ...base, link: good }, now);
    assert.ok(r.ok, `expected ${good} to pass, got ${r.ok ? 'ok' : r.failure.code}`);
  }
});

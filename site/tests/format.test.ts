/**
 * format tests — the date, deadline and plural helpers (WAVE2 brief).
 *
 * Run: node --test tests/   (see tests/README.md)
 *
 * Every value below was measured against the real module before it was
 * asserted — the expected numbers are what the code produces today, not
 * guesses. `now` is always injected, so nothing here depends on the clock.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { registerTsResolver } from './ts-resolver.mjs';
registerTsResolver();

const {
  isoWeek,
  deadlineState,
  daysLeft,
  isNew,
  isExpired,
  plural,
  formatDayMonth,
  dayKey,
  formatDow,
  formatWeekday,
  formatLongDate,
  formatWatTime,
  formatDatelineDate,
  formatClosesDate,
  formatClosedDate,
} = await import('../src/lib/format.ts');

const HOUR = 3_600_000;
const DAY = 86_400_000;

/** Friday 9 October 2026, 12:00 UTC (13:00 WAT). */
const NOW = new Date('2026-10-09T12:00:00.000Z');

/** A fixed future/past instant, offset in whole hours from NOW. */
const at = (hours: number) => new Date(NOW.getTime() + hours * HOUR);

// ---------------------------------------------------------------------------
// isoWeek — the masthead issue number
// ---------------------------------------------------------------------------

test('isoWeek: 9 October 2026 is week 41 (measured)', () => {
  // Friday, mid-week-41. Verified against the module: isoWeek(...) === 41.
  assert.equal(isoWeek(new Date('2026-10-09T12:00:00Z')), 41);
  assert.equal(isoWeek(new Date('2026-10-05T12:00:00Z')), 41); // Monday of week 41
  assert.equal(isoWeek(new Date('2026-10-11T12:00:00Z')), 41); // Sunday of week 41
});

test('isoWeek: week 42 starts the Monday after', () => {
  assert.equal(isoWeek(new Date('2026-10-12T00:00:00Z')), 42);
  assert.equal(isoWeek(new Date('2026-10-18T23:59:59Z')), 42);
});

test('isoWeek: a WAT-local late Sunday still counts the ISO week of its own UTC date', () => {
  // 23:59 UTC Sunday 11 Oct is already Monday morning in WAT, but isoWeek is
  // defined on the UTC calendar day, so it stays 41 — that is the behaviour
  // the board's "Week 41" issue number relies on.
  assert.equal(isoWeek(new Date('2026-10-11T23:59:59Z')), 41);
});

test('isoWeek: year boundaries follow the ISO rule (week 1 holds the first Thursday)', () => {
  assert.equal(isoWeek(new Date('2026-01-01T12:00:00Z')), 1); // Thursday -> week 1
  assert.equal(isoWeek(new Date('2025-12-29T12:00:00Z')), 1); // Monday of ISO week 1 of 2026
  assert.equal(isoWeek(new Date('2026-12-31T12:00:00Z')), 53); // 2026 has 53 ISO weeks
  assert.equal(isoWeek(new Date('2027-01-01T12:00:00Z')), 53); // Friday, still week 53
});

// ---------------------------------------------------------------------------
// deadlineState — the five badge states
// ---------------------------------------------------------------------------

test('deadlineState: evergreen is rolling regardless of any deadline', () => {
  assert.equal(deadlineState(null, true, NOW), 'rolling');
  assert.equal(deadlineState(at(24), true, NOW), 'rolling');
  assert.equal(deadlineState(at(-24), true, NOW), 'rolling');
});

test('deadlineState: a null deadline on a non-evergreen listing is rolling', () => {
  assert.equal(deadlineState(null, false, NOW), 'rolling');
});

test('deadlineState: a past deadline is closed', () => {
  assert.equal(deadlineState(at(-1), false, NOW), 'closed');
  assert.equal(deadlineState(at(-24), false, NOW), 'closed');
  assert.equal(deadlineState(NOW, false, NOW), 'closed'); // exactly now
});

test('deadlineState: within the next 24 hours is today', () => {
  assert.equal(deadlineState(at(1), false, NOW), 'today');
  assert.equal(deadlineState(at(12), false, NOW), 'today');
  assert.equal(deadlineState(at(24), false, NOW), 'today'); // exactly 24h
  assert.equal(deadlineState(at(25), false, NOW), 'closing'); // just over 24h
});

test('deadlineState: 2 to 7 days out is closing', () => {
  assert.equal(deadlineState(at(25), false, NOW), 'closing');
  assert.equal(deadlineState(at(72), false, NOW), 'closing'); // 3 days
  assert.equal(deadlineState(at(24 * 7), false, NOW), 'closing'); // exactly 7 days
});

test('deadlineState: more than 7 days out is safe', () => {
  assert.equal(deadlineState(at(24 * 7 + 1), false, NOW), 'safe');
  assert.equal(deadlineState(at(24 * 30), false, NOW), 'safe');
});

// ---------------------------------------------------------------------------
// daysLeft — whole days remaining, rounded up
// ---------------------------------------------------------------------------

test('daysLeft rounds up to whole days', () => {
  assert.equal(daysLeft(at(1), NOW), 1); // one hour left -> 1 day
  assert.equal(daysLeft(at(25), NOW), 2); // 25h -> 2 days
  assert.equal(daysLeft(at(24 * 3), NOW), 3); // exactly 3 days
});

test('daysLeft never goes below zero', () => {
  assert.equal(daysLeft(at(-1), NOW), 0);
  assert.equal(daysLeft(at(-24 * 10), NOW), 0);
});

// ---------------------------------------------------------------------------
// isNew — the "New" pill, 72h boundary
// ---------------------------------------------------------------------------

test('isNew: createdAt within 72h is new, at 73h it is not', () => {
  assert.equal(isNew(at(-71), NOW), true);
  assert.equal(isNew(at(-72), NOW), true); // exactly 72h — still new
  assert.equal(isNew(at(-72.0003), NOW), false); // 72h + 1s
  assert.equal(isNew(at(-73), NOW), false);
});

test('isNew: a createdAt in the future also reads as new (within the 72h window)', () => {
  // isNew is a window check, not a past-only check: now - createdAt <= 72h is
  // true for a future timestamp too. No listing is ever filed in the future,
  // so this documents the boundary rather than prescribing it.
  assert.equal(isNew(at(1), NOW), true);
});

// ---------------------------------------------------------------------------
// isExpired — the render-time archive filter
// ---------------------------------------------------------------------------

test('isExpired: evergreen listings never expire', () => {
  assert.equal(isExpired(at(-24 * 30), true, NOW), false);
  assert.equal(isExpired(null, true, NOW), false);
});

test('isExpired: a null deadline never expires', () => {
  assert.equal(isExpired(null, false, NOW), false);
});

test('isExpired: a past deadline expires, a future one does not', () => {
  assert.equal(isExpired(at(-1), false, NOW), true);
  assert.equal(isExpired(at(1), false, NOW), false);
});

test('isExpired: a deadline exactly now is not yet expired (strictly past only)', () => {
  assert.equal(isExpired(NOW, false, NOW), false);
});

// ---------------------------------------------------------------------------
// plural — "1 opportunity" / "97 opportunities"
// ---------------------------------------------------------------------------

test('plural: one takes the singular, everything else the plural', () => {
  assert.equal(plural(1, 'opportunity', 'opportunities'), 'opportunity');
  assert.equal(plural(2, 'opportunity', 'opportunities'), 'opportunities');
  assert.equal(plural(0, 'opportunity', 'opportunities'), 'opportunities');
  assert.equal(plural(97, 'opportunity', 'opportunities'), 'opportunities');
});

// ---------------------------------------------------------------------------
// the display formatters — WAT, always
// ---------------------------------------------------------------------------

test('formatDayMonth renders the board date stamp', () => {
  assert.equal(formatDayMonth(new Date('2026-10-09T12:00:00Z')), '9 Oct');
  assert.equal(formatDayMonth(new Date('2026-01-01T12:00:00Z')), '1 Jan');
});

test('formatDow and formatWeekday render the day name', () => {
  assert.equal(formatDow(new Date('2026-10-09T12:00:00Z')), 'Fri');
  assert.equal(formatWeekday(new Date('2026-10-09T12:00:00Z')), 'Friday');
});

test('formatLongDate renders the masthead date', () => {
  assert.equal(formatLongDate(new Date('2026-10-09T12:00:00Z')), '9 October 2026');
});

test('formatWatTime renders WAT (UTC+1), not the host zone', () => {
  // 12:00 UTC is 13:00 in Lagos — the board never shows the host's time.
  assert.equal(formatWatTime(new Date('2026-10-09T12:00:00Z')), '13:00');
  assert.equal(formatWatTime(new Date('2026-10-09T23:30:00Z')), '00:30'); // crosses midnight
});

test('formatDatelineDate combines the day, date and year', () => {
  assert.equal(formatDatelineDate(new Date('2026-10-09T12:00:00Z')), 'Fri 9 Oct 2026');
});

test('formatClosesDate and formatClosedDate render the badges', () => {
  assert.equal(formatClosesDate(new Date('2026-11-12T12:00:00Z')), 'Closes 12 Nov');
  assert.equal(formatClosedDate(new Date('2026-11-01T12:00:00Z')), 'Closed 1 Nov');
});

test('dayKey buckets by the Lagos day, never by the UTC day', () => {
  // 23:30 UTC is 00:30 the NEXT day in Lagos. Grouping on the UTC date would
  // file this under the wrong day header than the one it renders under.
  const lateUtc = new Date('2026-10-09T23:30:00Z');
  assert.equal(lateUtc.toISOString().slice(0, 10), '2026-10-09'); // the UTC day
  assert.equal(dayKey(lateUtc), '2026-10-10'); // the day it actually renders as
  assert.equal(formatDayMonth(lateUtc), '10 Oct'); // the header it appears under
});

test('dayKey separates the same day-month in different years', () => {
  // "9 Oct" alone would collapse a year of filings into one day header.
  const y2025 = new Date('2025-10-09T10:00:00Z');
  const y2026 = new Date('2026-10-09T10:00:00Z');
  assert.equal(formatDayMonth(y2025), formatDayMonth(y2026)); // same label
  assert.notEqual(dayKey(y2025), dayKey(y2026)); // different buckets
  assert.equal(dayKey(y2025), '2025-10-09');
  assert.equal(dayKey(y2026), '2026-10-09');
});

test('dayKey sorts chronologically as strings', () => {
  const keys = ['2026-10-09', '2025-12-31', '2026-01-02'].map(
    (s) => dayKey(new Date(`${s}T12:00:00Z`)),
  );
  assert.deepEqual([...keys].sort(), ['2025-12-31', '2026-01-02', '2026-10-09']);
});

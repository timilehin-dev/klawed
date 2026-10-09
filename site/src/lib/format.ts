/**
 * Date, deadline and copy formatting. Variant C is a dated dispatch, so these
 * helpers carry real weight: filing stamps, day headers, deadline badges,
 * "New" pills, the issue number and the dateline clock.
 *
 * The board runs on Africa/Lagos time (WAT, UTC+1, no DST) regardless of where
 * the server sits (flow.md §4), so every display date is formatted through the
 * WAT timezone rather than the host's local zone.
 */

/** The board's timezone (flow.md: "All times Africa/Lagos (WAT, UTC+1)"). */
export const TZ = 'Africa/Lagos';

/** "9 Oct" — the day-header and filing-stamp date. */
export function formatDayMonth(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: TZ });
}

/** "Thursday" — used sparingly; the chip uses the 3-letter form. */
export function formatWeekday(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: TZ });
}

/** "Thu" — the uppercase day-of-week in day headers. */
export function formatDow(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: TZ });
}

/** "9 October 2026" — the masthead date. */
export function formatLongDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  });
}

/**
 * Make an org-supplied string safe for an HTML attribute.
 *
 * Astro escapes `&`, `"` and `'` inside attribute values, but NOT `<` or `>`.
 * Inside an attribute a `>` closes the tag early, so a listing titled
 * `<script>alert(1)</script>` becomes a REAL script element in the rendered
 * `content="..."` — a stored XSS reachable by anyone who can POST a listing.
 *
 * Element bodies are safe (Astro escapes those correctly, verified against a
 * live probe row), but attribute contexts need this. It is applied to the meta
 * tags, which are the only place a raw org string lands in an attribute.
 *
 * Escapes the four characters that matter and caps length, because a title is
 * also a headline, not a paragraph.
 */
export function escapeAttr(value: string, maxLength = 160): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .slice(0, maxLength);
}

/**
 * A stable grouping key for a filing day, in the board's timezone.
 *
 * Use this — never `toISOString().slice(0, 10)` — to bucket listings under day
 * headers or to decide whether something was "filed today". toISOString is UTC,
 * so a listing filed at 23:30 UTC would be filed under 00:30 the NEXT day in
 * Lagos yet bucket under the previous date. Every key here is WAT, matching what
 * formatDayMonth actually renders.
 *
 * The year is included so two listings filed "9 Oct" a year apart do not
 * collapse into one day header.
 */
export function dayKey(d: Date): string {
  // en-CA renders YYYY-MM-DD, which sorts lexicographically as well as by date.
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: TZ,
  }).format(d);
}

/** "07:10" — the dateline and compile clock, always WAT. */
export function formatWatTime(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
}

/** "Thu 9 Oct 2026" — the dateline's date element. */
export function formatDatelineDate(d: Date): string {
  return `${formatDow(d)} ${formatDayMonth(d)} ${d.toLocaleDateString('en-GB', { year: 'numeric', timeZone: TZ })}`;
}

/** "09:00" — an entry's filing time, in WAT. */
export function formatFilingTime(d: Date): string {
  return formatWatTime(d);
}

/**
 * ISO week number, used as the masthead issue number ("Week 41"). ISO weeks
 * start Monday; week 1 is the week containing the year's first Thursday.
 *
 * Computed on the LAGOS calendar, not the UTC one. The dateline beside this
 * number renders in WAT, so the two must agree: at 23:30 UTC on a Sunday the
 * board is already showing Monday in Lagos, and a UTC-derived week number would
 * print the previous week next to the next day's date.
 *
 * Verified against known ISO boundaries: 2026-01-01 → 1, 2024-02-29 → 9,
 * 2021-01-01 → 53, 2026-12-31 → 53.
 */
export function isoWeek(d: Date): number {
  // Resolve the instant to its Lagos calendar date first, then do the ISO week
  // arithmetic on those Y/M/D parts. Intl gives the wall-clock date in the zone,
  // which is what "this week" means to a reader in Lagos.
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: TZ,
  }).formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const date = new Date(Date.UTC(get('year'), get('month') - 1, get('day')));

  const dayNum = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/**
 * The four deadline states of design-language.md §5.3:
 *   rolling     — evergreen
 *   closing     — ≤ 7 days out (urgency colour)
 *   today       — closing within the current day
 *   safe        — a dated deadline further than 7 days out
 *   closed      — past deadline (archive only, never rendered live)
 */
export type DeadlineState = 'rolling' | 'closed' | 'today' | 'closing' | 'safe';

export function deadlineState(deadline: Date | null, evergreen: boolean, now: Date): DeadlineState {
  if (evergreen) return 'rolling';
  if (!deadline) return 'rolling';
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return 'closed';
  if (ms <= 86_400_000) return 'today'; // within 24h → "Closes today"
  if (ms <= 7 * 86_400_000) return 'closing'; // ≤ 7 days → urgency
  return 'safe';
}

/** Whole days remaining, rounded up. Used for "3 days left". */
export function daysLeft(deadline: Date, now: Date): number {
  const ms = deadline.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** "Closes 12 Nov" — the safe badge label. */
export function formatClosesDate(deadline: Date): string {
  return `Closes ${formatDayMonth(deadline)}`;
}

/** "Closed 1 Nov" — the archive label. */
export function formatClosedDate(deadline: Date): string {
  return `Closed ${formatDayMonth(deadline)}`;
}

/** True when createdAt is within 72h of now — the "New" pill (PRD §3). */
export function isNew(createdAt: Date, now: Date): boolean {
  return now.getTime() - createdAt.getTime() <= 72 * 3_600_000;
}

/** True when a live listing's deadline has passed (render-time expiry). */
export function isExpired(deadline: Date | null, evergreen: boolean, now: Date): boolean {
  if (evergreen) return false;
  if (!deadline) return false;
  return deadline.getTime() < now.getTime();
}

/** Pluralised, British spelling — "1 opportunity", "97 opportunities". */
export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

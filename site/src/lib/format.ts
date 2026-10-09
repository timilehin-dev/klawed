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
 */
export function isoWeek(d: Date): number {
  // Work on a UTC-normalised copy of the date so the timezone cannot shift the
  // week boundary.
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
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

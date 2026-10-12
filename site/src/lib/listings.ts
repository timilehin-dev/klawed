/**
 * The read path. Every listing the board renders comes through here — server
 * side, through Prisma, rendered to HTML (TRD §6). No client-side fetch for the
 * board.
 *
 * Ordering is Nigeria-first (PRD §7.9): nigeria → africa → global, then
 * createdAt desc within a region.
 *
 * Failure posture (TRD §9): if the database is unreachable, nothing throws into
 * a 500. The caller gets `unreachable: true` and renders the humanised
 * "board is being refreshed" state. A visitor never sees a stack trace.
 */

import type { Prisma } from '@prisma/client';
import { getPrisma } from './prisma';
import { isExpired, formatFilingTime } from './format';
import { CATEGORIES, REGIONS, toSnake, toKebab, isRegion } from './category-map';

/** The display shape every component consumes. */
export interface ListingView {
  id: string;
  slug: string;
  title: string;
  org: string;
  category: string;
  deadline: Date | null;
  evergreen: boolean;
  eligibility: string;
  link: string;
  region: string;
  /** 'live' | 'expired' | 'draft'. Drives the live/archive partition. */
  status: string;
  summary: string;
  createdAt: Date;
}

export interface Board {
  /** Live, non-expired listings, Nigeria-first, newest first within region. */
  live: ListingView[];
  /** Listings closing within 7 days, same ordering. */
  closingSoon: ListingView[];
  /** Past-deadline listings, kept for the archive (never deleted). */
  archive: ListingView[];
  /** Live count per public category slug. */
  counts: Record<string, number>;
  /** Total live count. */
  total: number;
  /** True when the DB could not be reached — render the refresh state. */
  unreachable: boolean;
}

/** Region sort weight: nigeria first, then africa, then global. */
function regionRank(region: string): number {
  const i = REGIONS.indexOf(region);
  return i === -1 ? REGIONS.length : i;
}

/** The board's canonical ordering (PRD §7.9). */
export function compareListings(a: ListingView, b: ListingView): number {
  const byRegion = regionRank(a.region) - regionRank(b.region);
  if (byRegion !== 0) return byRegion;
  return b.createdAt.getTime() - a.createdAt.getTime();
}

/**
 * A row as the read paths select it.
 *
 * Typed loosely on purpose: the three queries (board, category, region) each
 * run the same `SELECT`, and Prisma infers their payload as a distinct nominal
 * type per call site — which it then refuses to unify at `rows.map(toView)`.
 * Asserting a single shape from `SELECT` keeps one mapper for all three.
 */
type SelectedRow = Prisma.ListingGetPayload<{ select: typeof SELECT }>;

function toView(row: SelectedRow): ListingView {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    org: row.org,
    category: row.category as string,
    deadline: row.deadline,
    evergreen: row.evergreen,
    eligibility: row.eligibility,
    link: row.link,
    region: row.region as string,
    status: row.status,
    summary: row.summary,
    createdAt: row.createdAt,
  };
}

const SELECT = {
  id: true,
  slug: true,
  title: true,
  org: true,
  category: true,
  deadline: true,
  evergreen: true,
  eligibility: true,
  link: true,
  region: true,
  status: true,
  summary: true,
  createdAt: true,
} satisfies Prisma.ListingSelect;

/** Rows that appear anywhere on the board: live, plus already-expired ones
 *  (which render in the archive). `draft` is excluded — nothing surfaces a draft. */
const VISIBLE_WHERE: Prisma.ListingWhereInput = { status: { in: ['live', 'expired'] } };

/**
 * Split loaded rows into the live surfaces and the archive.
 *
 * Two independent things put a listing in the archive, and both matter:
 *   - `status = 'expired'` — set deliberately through the Content API when a
 *     Verifier or an Editor pulls a listing (deadline passed, role filled, wrong
 *     listing). It leaves the board at once, without waiting for the deadline.
 *   - the deadline has passed — the render-time rule that has always applied.
 *
 * A listing never leaves the archive by being hidden: both are non-destructive
 * (TRD §3), which is why this partition rather than a second query with
 * `status: 'live'`. Querying live-only would drop API-expired rows from the
 * archive entirely, since they are no longer 'live'.
 */
function partition(rows: Array<ReturnType<typeof toView>>, now: Date): { live: ListingView[]; archive: ListingView[] } {
  const live: ListingView[] = [];
  const archive: ListingView[] = [];
  for (const v of rows) {
    if (v.status === 'expired' || isExpired(v.deadline, v.evergreen, now)) archive.push(v);
    else live.push(v);
  }
  live.sort(compareListings);
  archive.sort((a, b) => (b.deadline?.getTime() ?? 0) - (a.deadline?.getTime() ?? 0));
  return { live, archive };
}

const emptyBoard = (unreachable: boolean): Board => ({
  live: [],
  closingSoon: [],
  archive: [],
  counts: Object.fromEntries(CATEGORIES.map((c) => [c.kebab, 0])),
  total: 0,
  unreachable,
});

/**
 * Load the whole board. `now` is injectable for tests and so the page renders a
 * single consistent instant.
 */
export async function loadBoard(now: Date): Promise<Board> {
  const prisma = getPrisma();
  if (!prisma) return emptyBoard(true);

  let rows;
  try {
    rows = await prisma.listing.findMany({ where: VISIBLE_WHERE, select: SELECT });
  } catch {
    // DB unreachable at render — TRD §9 graceful state.
    return emptyBoard(true);
  }

  const views = rows.map(toView);

  // Render-time expiry plus API-driven expiry: a past-deadline or deliberately
  // expired listing leaves the live surfaces and lands in the archive. It is
  // never hard-deleted (TRD §3).
  const { live, archive } = partition(views, now);

  const closingSoon = live.filter((v) => {
    if (!v.deadline || v.evergreen) return false;
    const ms = v.deadline.getTime() - now.getTime();
    return ms > 0 && ms <= 7 * 86_400_000;
  });

  const counts: Record<string, number> = Object.fromEntries(
    CATEGORIES.map((c) => [c.kebab, 0]),
  );
  for (const v of live) {
    const kebab = toKebab(v.category);
    if (kebab in counts) counts[kebab] += 1;
  }

  return { live, closingSoon, archive, counts, total: live.length, unreachable: false };
}

/** Board-wide counts for the global chrome: every category, the total, and the
 *  closing-soon figure. One shape so a page can never supply a partial set. */
export interface BoardCounts {
  /** Live count per public category slug. Every key present, zero-filled. */
  byCategory: Record<string, number>;
  /** Total live listings across all categories. */
  total: number;
  /** Live listings closing within seven days, board-wide. */
  closingSoon: number;
}

/**
 * Board-wide counts for the global chrome.
 *
 * The chip bar is exactly that — global. design-language §5.2 says each chip
 * "shows its live count", and the "All" and "closing soon" chips sit in the same
 * bar, so they must describe the whole board too, not the page you happen to be
 * on. Sourcing them from a page's filtered board is what made /jobs read
 * "All 2" and "closing soon 0" while the homepage read "All 59" and "3".
 *
 * One query, selecting only the columns the expiry and category rules need.
 * Returns an all-zero map (never a partial one) when the DB is unreachable, so
 * the bar renders a consistent shape instead of a mix of numbers and zeros.
 */
export async function loadCounts(now: Date): Promise<BoardCounts> {
  const byCategory: Record<string, number> = Object.fromEntries(
    CATEGORIES.map((c) => [c.kebab, 0]),
  );
  const empty: BoardCounts = { byCategory, total: 0, closingSoon: 0 };

  const prisma = getPrisma();
  if (!prisma) return empty;

  let rows;
  try {
    rows = await prisma.listing.findMany({
      where: { status: 'live' },
      select: { category: true, deadline: true, evergreen: true },
    });
  } catch {
    return empty;
  }

  let total = 0;
  let closingSoon = 0;
  for (const row of rows) {
    // Same render-time expiry rule as the board itself, so a chip never counts a
    // listing the feed is not showing.
    if (isExpired(row.deadline, row.evergreen, now)) continue;

    const kebab = toKebab(row.category);
    if (kebab in byCategory) byCategory[kebab] += 1;
    total += 1;

    if (row.deadline && !row.evergreen) {
      const ms = row.deadline.getTime() - now.getTime();
      if (ms > 0 && ms <= 7 * 86_400_000) closingSoon += 1;
    }
  }

  return { byCategory, total, closingSoon };
}

/**
 * Listings for one category page. `category` is the public kebab slug.
 */
export async function loadCategory(category: string, now: Date): Promise<Board> {
  const snake = toSnake(category);
  if (!snake) return emptyBoard(false);

  const prisma = getPrisma();
  if (!prisma) return emptyBoard(true);

  let rows;
  try {
    rows = await prisma.listing.findMany({
      where: { ...VISIBLE_WHERE, category: snake as never },
      select: SELECT,
    });
  } catch {
    return emptyBoard(true);
  }

  const views = rows.map(toView);
  const { live, archive } = partition(views, now);

  const closingSoon = live.filter((v) => {
    if (!v.deadline || v.evergreen) return false;
    const ms = v.deadline.getTime() - now.getTime();
    return ms > 0 && ms <= 7 * 86_400_000;
  });

  const counts: Record<string, number> = {};
  counts[category] = live.length;

  return { live, closingSoon, archive, counts, total: live.length, unreachable: false };
}

/**
 * Listings for one region — the region filter in the top bar (design-language
 * §6.1). The board's ordering thesis is Nigeria-first, so those links must
 * resolve to a real view rather than sitting in the chrome as decoration.
 *
 * `region` is the lowercase slug: 'nigeria' | 'africa' | 'global'.
 */
export async function loadRegion(region: string, now: Date): Promise<Board> {
  if (!isRegion(region)) return emptyBoard(false);

  const prisma = getPrisma();
  if (!prisma) return emptyBoard(true);

  let rows;
  try {
    rows = await prisma.listing.findMany({
      where: { ...VISIBLE_WHERE, region: region as never },
      select: SELECT,
    });
  } catch {
    return emptyBoard(true);
  }

  const views = rows.map(toView);
  const { live, archive } = partition(views, now);
  // Already single-region, but keep the canonical comparator so the ordering
  // rule lives in one place.
  live.sort(compareListings);
  archive.sort((a, b) => (b.deadline?.getTime() ?? 0) - (a.deadline?.getTime() ?? 0));

  const closingSoon = live.filter((v) => {
    if (!v.deadline || v.evergreen) return false;
    const ms = v.deadline.getTime() - now.getTime();
    return ms > 0 && ms <= 7 * 86_400_000;
  });

  return { live, closingSoon, archive, counts: {}, total: live.length, unreachable: false };
}
/** One listing by slug, for the detail page. */
export async function loadBySlug(slug: string, now: Date): Promise<ListingView | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  try {
    const row = await prisma.listing.findUnique({ where: { slug }, select: SELECT });
    if (!row) return null;
    const view = toView(row);
    // Two independent reasons a listing is not a live surface: the deadline
    // passed, or the Verifier expired it through the API. Either way the detail
    // page 404s into the archive rather than serving a stale Apply button.
    if (view.status === 'expired' || isExpired(view.deadline, view.evergreen, now)) return null;
    return view;
  } catch {
    return null;
  }
}

/**
 * The "In this week's issue" sidebar — a spread across categories so the front
 * page shows the range of the board, not five jobs. Picks the newest listing
 * per category, in category order, until `limit` is reached.
 */
export function frontPage(board: Board, limit: number): ListingView[] {
  const seen = new Set<string>();
  const picks: ListingView[] = [];
  for (const listing of board.live) {
    const key = toKebab(listing.category);
    if (seen.has(key)) continue;
    seen.add(key);
    picks.push(listing);
    if (picks.length >= limit) break;
  }
  return picks;
}

/** One item in the wire ticker. */
export interface TickerItem {
  /** Filing time in WAT, e.g. "14:32". */
  time: string;
  /** Organisation name. */
  org: string;
  /** Category kebab. */
  category: string;
  /** Whole days left, or null for rolling. */
  daysLeft: number | null;
}

/**
 * The most recent live listings, formatted for the wire ticker. Newest first,
 * capped at `limit`. Returns an empty array when the board is empty — the
 * ticker renders its calm static line in that case.
 */
export function getTickerItems(board: Board, now: Date, limit = 8): TickerItem[] {
  return board.live
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit)
    .map((l) => ({
      time: formatFilingTime(l.createdAt),
      org: l.org,
      category: toKebab(l.category),
      daysLeft:
        l.deadline && !l.evergreen
          ? Math.max(0, Math.ceil((l.deadline.getTime() - now.getTime()) / 86_400_000))
          : null,
    }));
}

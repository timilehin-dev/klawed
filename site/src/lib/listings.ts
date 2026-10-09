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
import { isExpired } from './format';
import { CATEGORIES, REGIONS, toSnake, toKebab } from './category-map';

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

function toView(row: Prisma.ListingGetPayload<Record<string, never>>): ListingView {
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
  summary: true,
  createdAt: true,
} satisfies Prisma.ListingSelect;

/** Live rows only — the render-time expiry filter, not a destructive delete. */
const LIVE_WHERE: Prisma.ListingWhereInput = { status: 'live' };

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
    rows = await prisma.listing.findMany({ where: LIVE_WHERE, select: SELECT });
  } catch {
    // DB unreachable at render — TRD §9 graceful state.
    return emptyBoard(true);
  }

  const views = rows.map(toView);

  // Render-time expiry: a past-deadline, non-evergreen listing leaves the live
  // surfaces and lands in the archive. It is never hard-deleted (TRD §3).
  const live: ListingView[] = [];
  const archive: ListingView[] = [];
  for (const v of views) {
    if (isExpired(v.deadline, v.evergreen, now)) archive.push(v);
    else live.push(v);
  }
  live.sort(compareListings);
  archive.sort((a, b) => (b.deadline?.getTime() ?? 0) - (a.deadline?.getTime() ?? 0));

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
      where: { ...LIVE_WHERE, category: snake as never },
      select: SELECT,
    });
  } catch {
    return emptyBoard(true);
  }

  const views = rows.map(toView);
  const live: ListingView[] = [];
  const archive: ListingView[] = [];
  for (const v of views) {
    if (isExpired(v.deadline, v.evergreen, now)) archive.push(v);
    else live.push(v);
  }
  live.sort(compareListings);
  archive.sort((a, b) => (b.deadline?.getTime() ?? 0) - (a.deadline?.getTime() ?? 0));

  const closingSoon = live.filter((v) => {
    if (!v.deadline || v.evergreen) return false;
    const ms = v.deadline.getTime() - now.getTime();
    return ms > 0 && ms <= 7 * 86_400_000;
  });

  const counts: Record<string, number> = {};
  counts[category] = live.length;

  return { live, closingSoon, archive, counts, total: live.length, unreachable: false };
}

/** One listing by slug, for the detail page. */
export async function loadBySlug(slug: string, now: Date): Promise<ListingView | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  try {
    const row = await prisma.listing.findUnique({ where: { slug }, select: SELECT });
    if (!row) return null;
    const view = toView(row);
    // A past-deadline listing is not a live surface; its detail page 404s into
    // the archive rather than serving a stale Apply button.
    if (isExpired(view.deadline, view.evergreen, now)) return null;
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

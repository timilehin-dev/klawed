/**
 * RSS feed — the newest live listings, real DB rows only.
 *
 * Server-rendered on demand (`export const prerender = false`) so the feed
 * never carries a stale or invented entry: the archive (past-deadline) is
 * excluded, and every item's title, link, description and pubDate come from a
 * row read through loadBoard().
 */
import type { APIRoute } from 'astro';
import { loadBoard } from '../lib/listings';
import { siteUrl } from '../lib/env';
import { toKebab } from '../lib/category-map';

export const prerender = false;

/** Escape XML text nodes. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const LIMIT = 30;

export const GET: APIRoute = async () => {
  const now = new Date();
  const board = await loadBoard(now);

  const items = board.live.slice(0, LIMIT);
  const origin = siteUrl();

  const entries = items
    .map((l) => {
      const url = new URL(`/listings/${l.slug}`, origin).href;
      const deadline = l.deadline
        ? ` <p><strong>Deadline:</strong> ${esc(
            new Date(l.deadline).toISOString().slice(0, 10),
          )}</p>`
        : ' <p><strong>Rolling</strong> — no fixed closing date.</p>';
      return [
        '    <item>',
        `      <title>${esc(l.title)}</title>`,
        `      <link>${esc(url)}</link>`,
        `      <guid isPermaLink="true">${esc(url)}</guid>`,
        `      <description>${esc(l.summary)}${deadline}</description>`,
        `      <pubDate>${new Date(l.createdAt).toUTCString()}</pubDate>`,
        `      <category>${esc(toKebab(l.category))}</category>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>klawhub — opportunities, klawed first</title>
    <link>${esc(origin)}/</link>
    <description>A dated dispatch of real openings for builders — jobs, grants, hackathons, visas and the free tools worth having. Nigeria first, then Africa, then global.</description>
    <language>en</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
${entries}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=300',
    },
  });
};

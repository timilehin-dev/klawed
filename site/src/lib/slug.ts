/**
 * Slug generation. TRD §6: "Slug is a slugified title + short id suffix, stored
 * at ingest." The id suffix keeps slugs unique even when two orgs file the same
 * title, which a title-only slug would collide on.
 */

/** Lowercase, alphanumerics and single hyphens, trimmed. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    // Strip accents so "Café" and "Cafe" don't diverge.
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * A stable, collision-resistant slug from a title and the row id.
 * Format: "<slugified-title>-<shortid>" (e.g. "backend-engineer-payments-clk7f9a2").
 */
export function makeSlug(title: string, id: string): string {
  const base = slugify(title) || 'listing';
  const suffix = id.slice(-7);
  return `${base}-${suffix}`;
}

/** Exposed for tests. */
export { slugify };

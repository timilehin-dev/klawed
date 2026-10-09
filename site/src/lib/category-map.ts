/**
 * The one and only category registry — kebab (public) ↔ snake (database).
 *
 * TRD §3 / plan.md Task 2: "Write the kebab↔snake enum mapping helper once, in
 * one module." Every other module imports from here. Nothing re-derives the
 * mapping, and nothing hardcodes a category list.
 *
 * Adding a listing type is a data change: add one row to CATEGORIES. The API
 * validation, the chip bar, the category routes, the footer nav and the sitemap
 * all read this array, so a new category appears everywhere with no further
 * code. See README-Extensibility.md.
 */

/** A category as the public API, URLs and UI speak it. */
export interface CategoryDef {
  /** The public slug, used in URLs, the API body and the UI. */
  readonly kebab: string;
  /** The Prisma enum value, stored in the database. */
  readonly snake: string;
  /** Human label for the chip bar and headings. */
  readonly label: string;
}

/** The ten categories, in navigation order (PRD §4). */
export const CATEGORIES: readonly CategoryDef[] = Object.freeze([
  { kebab: 'jobs', snake: 'jobs', label: 'jobs' },
  { kebab: 'remote', snake: 'remote', label: 'remote' },
  { kebab: 'hackathons', snake: 'hackathons', label: 'hackathons' },
  { kebab: 'grants', snake: 'grants', label: 'grants' },
  { kebab: 'accelerators', snake: 'accelerators', label: 'accelerators' },
  { kebab: 'visas', snake: 'visas', label: 'visas' },
  { kebab: 'scholarships', snake: 'scholarships', label: 'scholarships' },
  { kebab: 'internships', snake: 'internships', label: 'internships' },
  { kebab: 'ai-credits', snake: 'ai_credits', label: 'ai-credits' },
  { kebab: 'student-deals', snake: 'student_deals', label: 'student-deals' },
]);

/** Regions, in Nigeria-first sort order (PRD §7.9). */
export const REGIONS: readonly string[] = Object.freeze(['nigeria', 'africa', 'global']);

const BY_KEBAB = new Map(CATEGORIES.map((c) => [c.kebab, c]));
const BY_SNAKE = new Map(CATEGORIES.map((c) => [c.snake, c]));

/** Is this a known public category slug? */
export function isCategoryKebab(value: unknown): value is string {
  return typeof value === 'string' && BY_KEBAB.has(value);
}

/** Is this a known database enum value? */
export function isCategorySnake(value: unknown): value is string {
  return typeof value === 'string' && BY_SNAKE.has(value);
}

/** Public slug → database enum value. Returns null if unknown. */
export function toSnake(kebab: string): string | null {
  return BY_KEBAB.get(kebab)?.snake ?? null;
}

/** Database enum value → public slug. Falls back to the input when unknown. */
export function toKebab(snake: string): string {
  return BY_SNAKE.get(snake)?.kebab ?? snake;
}

/** True for a known region. */
export function isRegion(value: unknown): value is string {
  return typeof value === 'string' && REGIONS.includes(value);
}

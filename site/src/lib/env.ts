/**
 * Environment access. One place reads process.env for secrets so nothing else
 * can accidentally log or leak them (TRD §5).
 */

/** The Content API key. Empty string when unset — never a default value. */
export function apiKey(): string {
  return (process.env.KLAWHUB_API_KEY ?? '').trim();
}

/** Whether a key is configured at all. */
export function hasApiKey(): boolean {
  return apiKey().length > 0;
}

/** Pooled DB URL for the running app. */
export function prismaUrl(): string | undefined {
  return process.env.POSTGRES_PRISMA_URL;
}

/** Whether the database is configured (build/dev without it must not crash). */
export function hasDatabase(): boolean {
  return typeof prismaUrl() === 'string' && prismaUrl()!.length > 0;
}

/** Public site origin for canonical URLs. */
export function siteUrl(): string {
  return process.env.KLAWHUB_SITE_URL || 'https://klawhub.xyz';
}

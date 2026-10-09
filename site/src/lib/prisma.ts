/**
 * Prisma client singleton. In dev, Astro hot-reloads modules, so a module-level
 * `new PrismaClient()` would leak connections on every reload. This caches on
 * globalThis. When the database is not configured, every accessor returns null
 * and the pages render the "board is being refreshed" state (TRD §9) rather
 * than throwing.
 */

import { PrismaClient } from '@prisma/client';
import { hasDatabase } from './env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** The shared client, or null when no database is configured. */
export function getPrisma(): PrismaClient | null {
  if (!hasDatabase()) return null;
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

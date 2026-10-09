// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

/**
 * klawed (klawhub.xyz) — Astro server build.
 *
 * `output: 'server'` is required by TRD.md §6: listings are read server-side
 * through Prisma and rendered to HTML (no client-side fetch for the board), and
 * POST /api/listings is a live write endpoint. TRD §9 also needs a graceful
 * "board is being refreshed" state when the DB is unreachable — only possible
 * with on-demand rendering. (plan.md Task 1 says "static output"; TRD wins over
 * the plan per plan.md's own preamble, and neither the API nor the DB read path
 * can exist in a fully static build.)
 *
 * Tailwind v4 is loaded through the Vite plugin; the design tokens from
 * design-language.md live in src/styles/tokens.css.
 */
const siteUrl = process.env.KLAWHUB_SITE_URL || 'https://klawhub.xyz';

export default defineConfig({
  site: siteUrl,
  output: 'server',
  adapter: vercel(),
  trailingSlash: 'ignore',
  vite: {
    plugins: [tailwindcss()],
  },
  server: { port: 4321, host: true },
});

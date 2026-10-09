/**
 * Compile-check every Wave-2 component with the real Astro compiler.
 * Throwaway verification script — delete before commit.
 */
import { transform } from '@astrojs/compiler';
import { readFile } from 'node:fs/promises';

const files = [
  'src/components/icons/Clock.astro',
  'src/components/icons/ArrowRight.astro',
  'src/components/icons/ExternalLink.astro',
  'src/components/RegionTag.astro',
  'src/components/DeadlineBadge.astro',
  'src/components/NewPill.astro',
  'src/components/EntryRow.astro',
  'src/components/ListingCard.astro',
  'src/components/ClosingSoon.astro',
  'src/components/Sidebar.astro',
  'src/components/DayHeader.astro',
  'src/components/EmptyState.astro',
  'src/components/RefreshState.astro',
  'src/components/NewsletterSignup.astro',
  'src/components/ArchiveStrip.astro',
];

let failed = 0;
for (const f of files) {
  const source = await readFile(f, 'utf8');
  try {
    const out = await transform(source, { filename: f, sourcemap: false });
    console.log(`COMPILED     ${f}  (${out.code.length} bytes emitted)`);
  } catch (e) {
    failed++;
    console.log(`COMPILE-FAIL ${f}\n   ${String(e.message).split('\n').slice(0, 6).join('\n   ')}`);
  }
}
console.log(`\n${files.length - failed}/${files.length} compiled.`);
process.exit(failed ? 1 : 0);

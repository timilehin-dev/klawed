// Read the chip bar's live counts out of a rendered page.
// Usage: node scripts/chip-counts.mjs <file.html>
// Prints one line per chip: "label -> count", then a PASS/FAIL summary.
import fs from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('usage: node chip-counts.mjs <file.html>');
  process.exit(2);
}

const html = fs.readFileSync(file, 'utf8');

// Each chip renders as  <a class="chip..." href="/jobs" ...> label <span class="count...">N</span></a>
// Dev-mode builds interleave data-astro-* attributes, so match the anchor
// loosely and pull its inner text rather than assuming attribute order.
const chips = [];
const anchorRe = /<a\s+class="chip[^"]*"\s+href="([^"]*)"([\s\S]*?)<\/a>/g;
let m;
while ((m = anchorRe.exec(html)) !== null) {
  const href = m[1];
  const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const countMatch = /(\d+)\s*$/.exec(text);
  const label = countMatch ? text.slice(0, countMatch.index).trim() : text;
  chips.push({ href, label, count: countMatch ? Number(countMatch[1]) : null });
}

for (const c of chips) {
  const where = c.href === '/' ? '/' : c.href;
  console.log(`  ${where.padEnd(18)} ${String(c.label).padEnd(16)} ${c.count}`);
}
console.log(`  (${chips.length} chips parsed)`);

// Expected: the board-wide truth. Override with EXPECT=json for a strict check.
if (process.env.EXPECT) {
  const expected = JSON.parse(process.env.EXPECT);
  const actual = Object.fromEntries(chips.map((c) => [c.href === '/' ? 'all' : c.href.replace(/^\//, ''), c.count]));
  const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  let bad = 0;
  for (const k of keys) {
    if (expected[k] !== actual[k]) {
      console.log(`  MISMATCH ${k}: expected ${expected[k]}, got ${actual[k]}`);
      bad++;
    }
  }
  console.log(bad === 0 ? '  COUNTS MATCH EXPECTED' : `  ${bad} MISMATCH(ES)`);
  process.exit(bad === 0 ? 0 : 1);
}

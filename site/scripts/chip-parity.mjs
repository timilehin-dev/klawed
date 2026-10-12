// Compare the chip bar across pages. Every page must show the SAME board-wide
// counts — the bar is global chrome (design-language §5.2).
// Usage: node scripts/chip-parity.mjs <file.html> [more.html ...]
// Prints one row per page: "page  All=N  jobs=N  remote=N ... closing=N"
import fs from 'node:fs';

const CATEGORY_ORDER = [
  'jobs', 'remote', 'hackathons', 'grants', 'accelerators', 'visas',
  'scholarships', 'internships', 'ai-credits', 'student-deals',
];

function parse(file) {
  const html = fs.readFileSync(file, 'utf8');
  const out = {};

  // Each chip: <a class="chip..." href="/jobs" ...attrs...> label <span class="count...">N</span></a>
  // Attributes may include data-astro-* with slashes, so capture to </a> and
  // strip tags to get the inner text.
  const anchorRe = /<a\s+class="chip[^"]*"\s+href="([^"]*)"((?:[\s\S]*?))<\/a>/g;
  let m;
  while ((m = anchorRe.exec(html)) !== null) {
    const href = m[1];
    const inner = (m[2] ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const n = /(\d+)\s*$/.exec(inner);
    if (!n) continue;
    const key = href === '/' ? 'All' : href === '/closing-soon' ? 'closing' : href.replace(/^\//, '');
    out[key] = Number(n[1]);
  }
  return out;
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node chip-parity.mjs <file.html> ...');
  process.exit(2);
}

const rows = files.map((f) => ({ name: f.split(/[\\/]/).pop(), counts: parse(f) }));

const cols = ['All', ...CATEGORY_ORDER, 'closing'];
const header = ['page'.padEnd(22), ...cols.map((c) => c.slice(0, 13).padStart(14))].join('');
console.log(header);
console.log('-'.repeat(header.length));

for (const r of rows) {
  const cells = cols.map((c) => String(r.counts[c] ?? '-').padStart(14));
  console.log([r.name.padEnd(22), ...cells].join(''));
}

// Parity: every page must agree on every column.
const bad = [];
for (const c of cols) {
  const values = rows.map((r) => r.counts[c]);
  const first = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== first) {
      bad.push(`${c}: ${rows[0].name}=${first} vs ${rows[i].name}=${values[i]}`);
    }
  }
}

console.log('-'.repeat(header.length));
if (bad.length === 0) {
  console.log(`PARITY OK — all ${rows.length} pages show identical board-wide counts`);
} else {
  console.log(`PARITY FAILED (${bad.length}):`);
  bad.forEach((b) => console.log('  ' + b));
  process.exit(1);
}

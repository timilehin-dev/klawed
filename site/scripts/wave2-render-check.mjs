/**
 * Wave-2 component verification, via Astro's Container API.
 *
 * Renders every component with data produced by the committed lib functions
 * and asserts on the real emitted HTML: the four deadline states, the three
 * region tiers, the "New" pill's 72h window, and that ClosingSoon / Sidebar /
 * ArchiveStrip emit NOTHING when their list is empty.
 *
 * Run: node --experimental-strip-types scripts/wave2-render-check.mjs
 */
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { deadlineState, daysLeft, formatClosesDate, formatClosedDate, isNew, isExpired, plural,
        formatDayMonth, formatDow, formatFilingTime } = await import('../src/lib/format.ts');
const { toKebab, CATEGORIES, REGIONS } = await import('../src/lib/category-map.ts');

const now = new Date('2026-10-09T06:10:00Z'); // 07:10 WAT
const DAY = 86_400_000;
const inDays = (n) => new Date(now.getTime() + n * DAY);
const hoursAgo = (h) => new Date(now.getTime() - h * 3_600_000);

// Typed ListingView fixtures. Their text is only echoed back by the components
// under test, which invent nothing of their own.
const L = (over) => ({
  id: 'id', slug: 'some-listing', title: 'A listing title', org: 'An org',
  category: 'jobs', deadline: inDays(30), evergreen: false, eligibility: 'Who can apply',
  link: 'https://example.test/x', region: 'nigeria', summary: 'A one-line summary.',
  createdAt: hoursAgo(3), ...over,
});

// ---- lib interface assertions ---------------------------------------------
const lib = [
  ['deadlineState safe', deadlineState(inDays(30), false, now) === 'safe'],
  ['deadlineState closing', deadlineState(inDays(3), false, now) === 'closing'],
  ['deadlineState today', deadlineState(new Date(now.getTime() + 3_600_000), false, now) === 'today'],
  ['deadlineState rolling', deadlineState(null, true, now) === 'rolling'],
  ['deadlineState closed', deadlineState(inDays(-1), false, now) === 'closed'],
  ['daysLeft 3', daysLeft(inDays(3), now) === 3],
  ['daysLeft 1', daysLeft(inDays(1), now) === 1],
  ['formatClosesDate shape', /^Closes \d+ \w+$/.test(formatClosesDate(new Date('2026-11-12T10:00:00Z')))],
  ['formatClosedDate shape', /^Closed \d+ \w+$/.test(formatClosedDate(inDays(-2)))],
  ['isNew within 72h', isNew(hoursAgo(1), now) === true],
  ['isNew beyond 72h', isNew(hoursAgo(80), now) === false],
  ['isExpired past deadline', isExpired(inDays(-1), false, now) === true],
  ['isExpired evergreen never', isExpired(null, true, now) === false],
  ['toKebab snake->kebab', toKebab('ai_credits') === 'ai-credits'],
  ['toKebab passthrough', toKebab('jobs') === 'jobs'],
  ['CATEGORIES has ten', CATEGORIES.length === 10],
  ['REGIONS order', REGIONS.join(',') === 'nigeria,africa,global'],
  ['formatFilingTime HH:MM', /^\d\d:\d\d$/.test(formatFilingTime(now))],
  ['plural', plural(1, 'x', 'y') === 'x' && plural(2, 'x', 'y') === 'y'],
  ['formatDayMonth', typeof formatDayMonth(now) === 'string'],
  ['formatDow', typeof formatDow(now) === 'string'],
];

let libFail = 0;
console.log('── lib interface assertions ──');
for (const [name, ok] of lib) { if (!ok) libFail++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`); }

// ---- render + assert ------------------------------------------------------
// The container needs Astro's own Vite plugin to resolve ".astro" imports, so
// build a Vite server the same way Astro's dev server does.
const { createServer } = await import('vite');
const { default: astroVitePlugin } = await import(
  pathToFileURL(join(process.cwd(), 'node_modules/astro/dist/vite-plugin-astro/index.js')).href
);
const { default: astroContainer } = await import(
  pathToFileURL(join(process.cwd(), 'node_modules/astro/dist/container/vite-plugin-container.js')).href
);
const u = (p) => new URL(pathToFileURL(join(process.cwd(), p)).href);
const server = await createServer({
  root: process.cwd(),
  configFile: false,
  logLevel: 'error',
  plugins: [astroContainer(), astroVitePlugin({
    settings: {
      config: {
        root: u('.'),
        srcDir: u('src'),
        publicDir: u('public'),
        outDir: u('dist'),
        cacheDir: u('node_modules/.astro'),
        buildOptions: { site: 'http://localhost' },
        experimental: { preserveScriptOrder: false, directRenderScript: false },
        trailingSlash: 'ignore',
      },
      integrations: [], markdown: {}, vite: {}, logger: console,
      command: 'serve', mode: 'development',
    },
  })],
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: 'custom',
});
const container = await AstroContainer.create();
const load = async (file) => {
  const mod = await server.ssrLoadModule(`/src/components/${file}`);
  return mod.default;
};
const html = async (file, props) => {
  const Component = await load(file);
  return container.renderToString(Component, { props });
};

// Each case: [name, component file, props, assertions on the emitted HTML].
const cases = [
  ['RegionTag nigeria', 'RegionTag.astro', { region: 'nigeria' },
    [(h) => h.includes('region-nigeria'), 'nigeria tier class',
     (h) => h.includes('>Nigeria<'), 'capitalised label']],
  ['RegionTag africa', 'RegionTag.astro', { region: 'africa' },
    [(h) => h.includes('region-africa'), 'africa tier class']],
  ['RegionTag global', 'RegionTag.astro', { region: 'global' },
    [(h) => h.includes('region-global'), 'global tier class']],
  ['RegionTag unknown falls back to global', 'RegionTag.astro', { region: 'mars' },
    [(h) => h.includes('region-global'), 'unknown region -> global tier']],
  ['RegionTag onDark', 'RegionTag.astro', { region: 'africa', onDark: true },
    [(h) => h.includes('is-on-dark'), 'on-dark variant']],

  ['Badge safe', 'DeadlineBadge.astro', { deadline: inDays(30), evergreen: false, now },
    [(h) => h.includes('badge-safe'), 'safe class',
     (h) => /Closes \d+ \w+/.test(h), '"Closes <date>" copy',
     (h) => !h.includes('<svg'), 'no clock glyph when not counting down']],
  ['Badge closing', 'DeadlineBadge.astro', { deadline: inDays(3), evergreen: false, now },
    [(h) => h.includes('badge-closing'), 'closing class',
     (h) => h.includes('3 days left'), '"3 days left" copy',
     (h) => h.includes('<svg'), 'clock glyph present']],
  ['Badge closing singular', 'DeadlineBadge.astro', { deadline: inDays(1), evergreen: false, now },
    [(h) => h.includes('1 day left'), '"1 day left" singular']],
  ['Badge today', 'DeadlineBadge.astro', { deadline: new Date(now.getTime() + 3_600_000), evergreen: false, now },
    [(h) => h.includes('badge-today'), 'today class',
     (h) => h.includes('Closes today'), '"Closes today" copy']],
  ['Badge rolling (evergreen)', 'DeadlineBadge.astro', { deadline: null, evergreen: true, now },
    [(h) => h.includes('badge-rolling'), 'rolling class',
     (h) => h.includes('Rolling'), '"Rolling" copy']],
  ['Badge rolling (null deadline)', 'DeadlineBadge.astro', { deadline: null, evergreen: false, now },
    [(h) => h.includes('Rolling'), 'null deadline -> Rolling']],

  ['EntryRow', 'EntryRow.astro', { listing: L(), now },
    [(h) => h.includes('href="/listings/some-listing"'), 'links to detail page',
     (h) => h.includes('<h3'), 'title is an h3',
     (h) => h.includes('A listing title'), 'real title echoed',
     (h) => h.includes('An org'), 'real org echoed',
     (h) => h.includes('jobs'), 'kebab category echoed',
     (h) => /filed \d\d:\d\d/.test(h), 'filing time in meta',
     (h) => h.includes('line-clamp:2'), '2-line clamp',
     (h) => h.includes('Apply'), 'Apply affordance',
     (h) => h.includes('<svg'), 'arrow glyph']],
  ['EntryRow New pill', 'EntryRow.astro', { listing: L({ createdAt: hoursAgo(1) }), now },
    [(h) => h.includes('New'), '"New" pill within 72h']],
  ['EntryRow stale (no New pill)', 'EntryRow.astro', { listing: L({ createdAt: hoursAgo(80) }), now },
    [(h) => !/class="new/.test(h), 'no New pill beyond 72h']],
  ['EntryRow snake->kebab category', 'EntryRow.astro', { listing: L({ category: 'ai_credits' }), now },
    [(h) => h.includes('ai-credits'), 'ai_credits rendered as kebab']],

  ['ListingCard', 'ListingCard.astro', { listing: L(), now },
    [(h) => h.includes('href="/listings/some-listing"'), 'links to detail page',
     (h) => h.includes('jobs · nigeria'), 'category·region eyebrow',
     (h) => h.includes('Who can apply'), 'eligibility line',
     (h) => h.includes('Read'), 'Read affordance']],

  ['DayHeader', 'DayHeader.astro', { date: new Date('2026-10-09T09:00:00Z'), region: 'nigeria' },
    [(h) => /\d+ Oct/.test(h), '"9 Oct" date',
     (h) => /Thu/.test(h), 'day-of-week',
     (h) => h.includes('region-nigeria'), 'region tag']],

  ['ClosingSoon populated', 'ClosingSoon.astro', { listings: [L(), L({ id: 'b', region: 'africa' })], now },
    [(h) => h.includes('Closing soon'), 'two-tone heading clause 1',
     (h) => h.includes('under seven days'), 'heading clause 2',
     (h) => h.includes('2 open'), 'real count in the note line',
     (h) => h.includes('is-on-dark'), 'on-dark region tags',
     (h) => h.includes('--on-dark-meta'), 'on-dark token defined in scope',
     (h) => (h.match(/class="citem/g) ?? []).length === 2, 'one item per listing']],
  ['ClosingSoon empty renders nothing', 'ClosingSoon.astro', { listings: [], now },
    [(h) => h.trim() === '', 'emits nothing at all']],

  ['Sidebar populated', 'Sidebar.astro', { listings: [L({ category: 'grants', region: 'global' })] },
    [(h) => h.includes("In this week's issue"), 'heading',
     (h) => h.includes('grants'), 'category in meta',
     (h) => h.includes('filed'), 'filed date in meta',
     (h) => h.includes('href="/listings/some-listing"'), 'links to detail page']],
  ['Sidebar empty renders nothing', 'Sidebar.astro', { listings: [] },
    [(h) => h.trim() === '', 'emits nothing at all']],

  ['ArchiveStrip populated', 'ArchiveStrip.astro', { listings: [L({ deadline: inDays(-2) })], now },
    [(h) => h.includes('Filed and closed'), 'heading',
     (h) => /Closed \d+ \w+/.test(h), 'strikethrough closed date',
     (h) => h.includes('line-through'), 'line-through styling']],
  ['ArchiveStrip empty renders nothing', 'ArchiveStrip.astro', { listings: [], now },
    [(h) => h.trim() === '', 'emits nothing at all']],
  ['ArchiveStrip filters evergreen rows', 'ArchiveStrip.astro', { listings: [L({ deadline: null, evergreen: true })], now },
    [(h) => h.trim() === '', 'evergreen rows are never archived']],

  ['EmptyState defaults', 'EmptyState.astro', {},
    [(h) => h.includes('Nothing filed yet'), 'default title',
     (h) => !/\d+ (open|listings)/.test(h), 'no invented counts']],
  ['RefreshState defaults', 'RefreshState.astro', {},
    [(h) => h.includes('being refreshed'), 'humanised title',
     (h) => !/Error|stack|at /.test(h), 'no stack trace or raw error']],
  ['NewsletterSignup', 'NewsletterSignup.astro', {},
    [(h) => h.includes('<label'), 'a real <label> exists',
     (h) => h.includes('type="email"'), 'email input',
     (h) => h.includes('type="submit"'), 'submit button',
     (h) => h.includes('07:00 WAT'), 'honest cadence copy']],

  ['Clock', 'icons/Clock.astro', {},
    [(h) => h.includes('stroke="currentColor"'), 'currentColor',
     (h) => h.includes('aria-hidden="true"'), 'aria-hidden',
     (h) => h.includes('width="14"'), 'default 14px']],
  ['Clock size prop', 'icons/Clock.astro', { size: 16 },
    [(h) => h.includes('width="16"'), 'honours the size prop']],
  ['ArrowRight', 'icons/ArrowRight.astro', {},
    [(h) => h.includes('stroke="currentColor"'), 'currentColor']],
  ['ExternalLink', 'icons/ExternalLink.astro', {},
    [(h) => h.includes('stroke="currentColor"'), 'currentColor']],
];

console.log('\n── component render assertions ──');
let fail = 0;
let checks = 0;
let failedChecks = 0;
for (const [name, file, props, assertions] of cases) {
  try {
    const out = await html(file, props);
    const bad = [];
    for (const [test, label] of assertions) {
      checks++;
      if (!test(out)) { bad.push(label); failedChecks++; }
    }
    if (bad.length) { fail++; console.log(`FAIL ${name}: ${bad.join('; ')}`); }
    else console.log(`ok   ${name}`);
  } catch (e) {
    fail++;
    console.log(`FAIL ${name}: threw — ${String(e.message).split('\n')[0]}`);
  }
}

console.log(`\n${cases.length - fail}/${cases.length} components ok; ${checks - failedChecks}/${checks} HTML checks passed; ${lib.length - libFail}/${lib.length} lib assertions passed.`);
await server.close();
process.exit(fail || libFail ? 1 : 0);

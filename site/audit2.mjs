import './loadenv.mjs';
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

const BASE = 'http://localhost:4321/api/listings';
const prisma = new PrismaClient();
const key = process.env.KLAWHUB_API_KEY.trim();
const created = [];

async function post(body, headers = { 'content-type': 'application/json', 'x-api-key': key }) {
  try {
    const res = await fetch(BASE, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body), redirect: 'manual' });
    const t = await res.text();
    return { status: res.status, text: t.length > 500 ? t.slice(0, 500) + `…[${t.length}]` : t };
  } catch (e) { return { status: -1, text: 'FETCH ERROR: ' + e.message }; }
}
const base = {
  title: 'AUDIT PROBE', org: 'AuditBot', category: 'jobs', deadline: '2030-01-01T00:00:00.000Z',
  evergreen: false, eligibility: 'Anyone.', link: 'https://example.com/audit', region: 'global', summary: 'probe',
};
const rowFor = async (link) => prisma.listing.findFirst({ where: { link } });
function log(n, d) { console.log(`\n### ${n}\n${typeof d === 'string' ? d : JSON.stringify(d)}`); }

async function main() {
  // 6g. CRLF in title (single field, small)
  log('6g CRLF in title', await post({ ...base, link: 'https://example.com/audit-crlf-1', title: 'Line one\r\nX-Injected-Header: yes\r\n\r\nLine two' }));
  const g = await rowFor('https://example.com/audit-crlf-1'); if (g) created.push(g.id);
  log('6g row', g);
  // how does it render in the slug/title on the detail page?
  if (g) {
    const p = await fetch(`http://localhost:4321/listings/${g.slug}`).then(r => r.text()).catch(e => 'ERR ' + e.message);
    log('6g page renders newline?', { slug: g.slug, hasRawNewline: p.includes('X-Injected-Header: yes'), escaped: p.includes('X-Injected-Header') });
  }

  // 6h unicode
  log('6h unicode/RLO/zero-width', await post({ ...base, link: 'https://example.com/audit-uni-1', title: 'Paystack\u200b\u202esecured.exe', org: '\u041erg', summary: '\u00dcn\u00efc\u00f6d\u00e9' }));
  const u = await rowFor('https://example.com/audit-uni-1'); if (u) created.push(u.id);
  log('6h row', u);

  // 6i __proto__
  log('6i __proto__ body', await post('{"title":"AUDIT PROBE proto","org":"A","category":"jobs","deadline":"2030-01-01T00:00:00Z","evergreen":false,"eligibility":"x","link":"https://example.com/audit-proto-1","region":"global","summary":"x","__proto__":{"polluted":"yes"}}'));
  log('6i Object.prototype.polluted?', { polluted: ({}).polluted });
  const p1 = await rowFor('https://example.com/audit-proto-1'); if (p1) created.push(p1.id);

  // 6j body types
  for (const [n, b] of [['array', '[]'], ['string', '"hello"'], ['number', '42'], ['null', 'null'], ['bool', 'true'], ['emptyobj', '{}']]) {
    log(`6j body=${n}`, await post(b));
  }

  // 6k malformed/empty
  log('6k malformed JSON', await post('{"title": '));
  log('6k2 empty body', await post(''));

  fs.writeFileSync('C:/Users/HP/AppData/Local/hermes/profiles/builder/cache/scratch/audit-created.json', JSON.stringify(created));
  log('running total', { created: created.length, count: await prisma.listing.count() });
  await prisma.$disconnect();
}
main().catch(async (e) => { console.error('HARNESS ERROR', e); try { await prisma.$disconnect(); } catch {} process.exit(1); });

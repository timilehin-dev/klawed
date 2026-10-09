// Security audit harness for the klawhub Content API. Report-only; deletes what it creates.
import './loadenv.mjs';
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

const BASE = 'http://localhost:4321/api/listings';
const prisma = new PrismaClient();
const key = process.env.KLAWHUB_API_KEY.trim();
const results = [];
const created = [];   // rows we create, to delete at the end

function rec(name, detail) {
  results.push({ name, detail });
  console.log(`\n### ${name}\n${typeof detail === 'string' ? detail : JSON.stringify(detail, null, 1)}`);
}

async function post(body, opts = {}) {
  const headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
  let res;
  try {
    res = await fetch(BASE, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body), redirect: 'manual' });
  } catch (e) {
    return { status: -1, text: 'FETCH ERROR: ' + e.message };
  }
  const text = await res.text();
  return { status: res.status, text: text.length > 800 ? text.slice(0, 800) + `…[${text.length} chars]` : text };
}

const base = {
  title: 'AUDIT PROBE',
  org: 'AuditBot',
  category: 'jobs',
  deadline: '2030-01-01T00:00:00.000Z',
  evergreen: false,
  eligibility: 'Anyone at all.',
  link: 'https://example.com/audit',
  region: 'global',
  summary: 'Security audit probe row. Deleted after the run.',
};

async function rowFor(link) {
  return prisma.listing.findFirst({ where: { link } });
}

async function main() {
  const count0 = await prisma.listing.count();
  console.log(`=== Listing count at start: ${count0} ===\nkey present: ${key.length > 0}, length: ${key.length}`);

  // =========== 5. MASS ASSIGNMENT ===========
  const massLink = 'https://example.com/audit-massassign-1';
  const massBody = {
    ...base, link: massLink, title: 'AUDIT PROBE massassign',
    id: 'attacker-controlled-id-000',
    slug: 'attacker-controlled-slug',
    status: 'draft',
    createdAt: '1999-01-01T00:00:00.000Z',
    updatedAt: '1999-01-01T00:00:00.000Z',
    nested: { a: { b: { c: { $ne: null } } } },
    __proto__x: 'polluted',
  };
  rec('5. mass-assignment POST', await post(massBody, { headers: { 'x-api-key': key } }));
  const massRow = await rowFor(massLink); if (massRow) created.push(massRow.id);
  rec('5. mass-assignment stored row', massRow);

  // 5b. status:expired + forced id
  const expLink = 'https://example.com/audit-expired-1';
  const expBody = { ...base, link: expLink, title: 'AUDIT PROBE expired', status: 'expired', id: 'zzz-forced-id-zzz' };
  rec('5b. status:expired + forced id', await post(expBody, { headers: { 'x-api-key': key } }));
  const expRow = await rowFor(expLink); if (expRow) created.push(expRow.id);
  rec('5b. stored row', expRow);

  // 5c. createdAt backdate to 1999
  const oldLink = 'https://example.com/audit-1999-1';
  const oldBody = { ...base, link: oldLink, title: 'AUDIT PROBE 1999', createdAt: '1999-01-01T00:00:00.000Z' };
  rec('5c. createdAt backdate 1999', await post(oldBody, { headers: { 'x-api-key': key } }));
  const oldRow = await rowFor(oldLink); if (oldRow) created.push(oldRow.id);
  rec('5c. stored row (note createdAt)', oldRow);

  // 5d. snake-form category
  rec('5d. category "ai_credits" (snake form, should be bad_category)', await post({ ...base, link: 'https://example.com/audit-snake-1', category: 'ai_credits' }, { headers: { 'x-api-key': key } }));

  // =========== 6. INJECTION ===========
  rec('6a. title as {"contains":"x"}', await post({ ...base, link: 'https://example.com/audit-inj-1', title: { contains: 'x' } }, { headers: { 'x-api-key': key } }));
  rec('6b. org as {"$ne":null}', await post({ ...base, link: 'https://example.com/audit-inj-1', org: { $ne: null } }, { headers: { 'x-api-key': key } }));
  rec('6c. link as {contains:"x"}', await post({ ...base, link: { contains: 'x' } }, { headers: { 'x-api-key': key } }));

  // 6d. XSS payload stored and rendered
  const xssLink = 'https://example.com/audit-xss-1';
  const xssTitle = '<script>alert("klaw-xss-7f3a")</script>';
  const xssSummary = '<img src=x onerror="window.__KLW_XSS=1"> Paystack </b>bold</b> & "quoted" \'single\' 100% <svg/onload=1>';
  rec('6d. XSS payload POST', await post({ ...base, link: xssLink, title: xssTitle, summary: xssSummary, eligibility: '<iframe src="https://evil.example/x"></iframe>' }, { headers: { 'x-api-key': key } }));
  const xssRow = await rowFor(xssLink); if (xssRow) created.push(xssRow.id);
  rec('6d. XSS stored row', xssRow);
  if (xssRow) {
    const page = await fetch(`http://localhost:4321/listings/${xssRow.slug}`).then(r => r.text()).catch(e => 'ERR ' + e.message);
    rec('6d. detail page XSS check', {
      slug: xssRow.slug,
      pageLen: page.length,
      hasRawScriptTag: page.includes('<script>alert("klaw-xss-7f3a")</script>'),
      hasRawImgOnerror: page.includes('onerror="window.__KLW_XSS=1"'),
      hasRawIframe: page.includes('<iframe src="https://evil.example/x"></iframe>'),
      hasEscapedScriptText: page.includes('&lt;script&gt;alert'),
    });
  }

  // 6e. SQL metacharacters
  const sqlLink = 'https://example.com/audit-sql-1';
  rec('6e. SQL metacharacters in strings', await post({ ...base, link: sqlLink, title: "Robert'); DROP TABLE \"Listing\"; --", summary: "'; DELETE FROM \"Listing\" WHERE 1=1; --", eligibility: '1=1 -- UNION SELECT' }, { headers: { 'x-api-key': key } }));
  const sqlRow = await rowFor(sqlLink); if (sqlRow) created.push(sqlRow.id);
  rec('6e. table intact + row', { count: await prisma.listing.count(), row: sqlRow });

  // 6f. 100k-char strings
  const big = 'A'.repeat(100000);
  rec('6f. 100k-char org/summary/eligibility', await post({ ...base, link: 'https://example.com/audit-big-1', title: big.slice(0, 100), org: big, summary: big, eligibility: big }, { headers: { 'x-api-key': key } }));
  const bigRow = await rowFor('https://example.com/audit-big-1'); if (bigRow) created.push(bigRow.id);
  rec('6f. stored big row lengths', bigRow ? { orgLen: bigRow.org.length, summaryLen: bigRow.summary.length, eligibilityLen: bigRow.eligibility.length } : null);

  // 6g. newline / CRLF in title
  rec('6g. CRLF injection in title', await post({ ...base, link: 'https://example.com/audit-crlf-1', title: 'Line one\r\nX-Injected-Header: yes\r\n\r\nLine two' }, { headers: { 'x-api-key': key } }));
  const crlfRow = await rowFor('https://example.com/audit-crlf-1'); if (crlfRow) created.push(crlfRow.id);
  rec('6g. crlf stored row', crlfRow);

  // 6h. unicode / RTL override / zero-width
  const uniLink = 'https://example.com/audit-uni-1';
  rec('6h. unicode/RLO/zero-width', await post({ ...base, link: uniLink, title: 'Paystack\u200b\u202esecured.exe', org: '\u041erg', summary: '\u00dcn\u00efc\u00f6d\u00e9 \u2728 \ud83d\ude80' }, { headers: { 'x-api-key': key } }));
  const uniRow = await rowFor(uniLink); if (uniRow) created.push(uniRow.id);
  rec('6h. unicode stored row', uniRow);

  // 6i. prototype pollution attempt
  rec('6i. JSON with __proto__ key', await post(JSON.parse('{"title":"AUDIT PROBE proto","org":"A","category":"jobs","deadline":"2030-01-01T00:00:00Z","evergreen":false,"eligibility":"x","link":"https://example.com/audit-proto-1","region":"global","summary":"x","__proto__":{"polluted":"yes"}}'), { headers: { 'x-api-key': key } }));
  rec('6i. Object.prototype.polluted?', { polluted: ({}).polluted });
  const protoRow = await rowFor('https://example.com/audit-proto-1'); if (protoRow) created.push(protoRow.id);

  // 6j. body types
  for (const [name, body] of [['array', '[]'], ['string', '"hello"'], ['number', '42'], ['null', 'null'], ['bool', 'true'], ['empty obj', '{}']]) {
    rec(`6j. body = ${name}`, await post(body, { headers: { 'x-api-key': key } }));
  }

  // 6k. malformed / empty
  rec('6k. malformed JSON', await post('{"title": ', { headers: { 'x-api-key': key } }));
  rec('6k2. empty body', await post('', { headers: { 'x-api-key': key } }));

  fs.writeFileSync('C:/Users/HP/AppData/Local/hermes/profiles/builder/cache/scratch/audit-created.json', JSON.stringify(created));
  console.log(`\n=== rows created so far: ${created.length}; count now: ${await prisma.listing.count()} (started ${count0}) ===`);
  await prisma.$disconnect();
}
main().catch(async (e) => { console.error('HARNESS ERROR', e); try { await prisma.$disconnect(); } catch {} process.exit(1); });

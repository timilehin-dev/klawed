#!/usr/bin/env node
/* Klawed Poster — publishes approved listings to the live Content API.
   Reads quarantine/approved/approved_<date>.md, POSTs each item, reports real results.
   Idempotent-ish: a 409 (already exists) counts as success. */
import fs from 'node:fs';
import path from 'node:path';

const APPROVED = process.argv[2] || 'C:/Users/HP/klaw/quarantine/approved/approved_2026-10-10.md';
const FAILED_OUT = APPROVED.replace(/\.md$/, '') + '.failed.md';

// load .env
const env = {};
for (const line of fs.readFileSync('C:/Users/HP/klaw/.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2];
}
const KEY = (env.KLAWHUB_API_KEY || '').trim();
const SITE = (env.KLAWHUB_SITE_URL || 'https://klawed.vercel.app').replace(/\/+$/, '');
if (!KEY) { console.error('FATAL: KLAWHUB_API_KEY not set'); process.exit(1); }

// parse the approved markdown into items
function parse(text) {
  const items = [];
  const blocks = text.split(/^### /m).slice(1);
  for (const b of blocks) {
    const o = {};
    const lines = b.split(/\r?\n/);
    o.title = lines[0].trim();
    for (const ln of lines.slice(1)) {
      const m = ln.match(/^-\s*([a-zA-Z]+):\s*(.*)$/);
      if (m) o[m[1].toLowerCase()] = m[2].trim();
    }
    items.push(o);
  }
  return items;
}

const raw = fs.readFileSync(APPROVED, 'utf8');
const items = parse(raw);
console.log(`Parsed ${items.length} items from ${path.basename(APPROVED)}`);

function toBody(o) {
  const evergreen = /^true$/i.test(o.evergreen || 'false');
  // API validates kebab-case categories (ai-credits, student-deals). The approved file
  // may carry snake_case (ai_credits) from Scout — normalise underscores to hyphens.
  const cat = (o.category || '').trim().replace(/_/g, '-');
  const deadline = (!evergreen && o.deadline && o.deadline !== 'none') ? o.deadline : null;
  return {
    title: o.title,
    org: o.org,
    category: cat,
    deadline,
    evergreen,
    eligibility: o.eligibility,
    link: o.link,
    region: (o.region || 'global').trim(),
    summary: o.summary,
  };
}

(async () => {
  let ok = 0, dup = 0, fail = 0;
  const failures = [];
  for (let i = 0; i < items.length; i++) {
    const body = toBody(items[i]);
    // minimal client-side sanity so we don't waste a round-trip on obvious junk
    const missing = ['title','org','eligibility','link','summary','category','region'].filter(k => !body[k]);
    if (missing.length) {
      console.log(`[${i+1}/${items.length}] SKIP ${body.title} — missing: ${missing.join(',')}`);
      fail++; failures.push({ item: body.title, status: 'skipped', body: JSON.stringify(body) }); continue;
    }
    let res, txt;
    try {
      res = await fetch(`${SITE}/api/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
        body: JSON.stringify(body),
      });
      txt = await res.text();
    } catch (e) {
      console.log(`[${i+1}/${items.length}] ERR  ${body.title} — ${e.message}`);
      fail++; failures.push({ item: body.title, status: 'network-error', body: e.message }); continue;
    }
    const tag = res.status;
    if (res.status === 201) { ok++; console.log(`[${i+1}/${items.length}] 201 ${body.title}`); }
    else if (res.status === 409) { dup++; console.log(`[${i+1}/${items.length}] 409 (already exists) ${body.title}`); }
    else { fail++; console.log(`[${i+1}/${items.length}] ${tag} ${body.title} — ${txt.slice(0,120)}`); failures.push({ item: body.title, status: tag, body: txt.slice(0,300) }); }
  }
  console.log(`\n=== DONE === posted(201): ${ok} | duplicates(409): ${dup} | failed: ${fail} | total: ${items.length}`);
  if (failures.length) {
    const out = failures.map(f => `- ${f.item} [${f.status}]\n  ${f.body}`).join('\n');
    fs.writeFileSync(FAILED_OUT, `# Poster failures — ${new Date().toISOString()}\n\n${out}\n`);
    console.log(`Failures written to ${FAILED_OUT}`);
  }
  process.exit(failures.length ? 2 : 0);
})();

// Comprehensive secret sweep across EVERY blob in the repo's entire history.
// Reports candidate secrets by shape and entropy, masking all values so the
// output is safe to paste into a chat.
const { execSync } = require('node:child_process');
const fs = require('node:fs');

function sh(cmd) {
  try { return execSync(cmd, { cwd: 'C:/Users/HP/klaw', maxBuffer: 1 << 27, encoding: 'utf8' }); }
  catch { return ''; }
}

// Every blob, and the paths that reference it.
const objects = sh('git rev-list --all --objects').split('\n');
const byBlob = new Map();
for (const line of objects) {
  const sp = line.indexOf(' ');
  if (sp < 0) continue;
  const sha = line.slice(0, sp).trim();
  const path = line.slice(sp + 1).trim();
  if (!/^[0-9a-f]{40,64}$/.test(sha)) continue;
  if (!byBlob.has(sha)) byBlob.set(sha, new Set());
  if (path) byBlob.get(sha).add(path);
}

console.log('blobs to inspect:', byBlob.size);

// Known-benign: lockfile integrity digests and package names.
function isBenign(value, path) {
  if (/package-lock\.json$/.test(path)) {
    if (/^sha(1|256|512)-/.test(value)) return true;      // npm integrity
    if (/^[a-z0-9][a-z0-9._/-]*$/.test(value)) return true; // package name
  }
  return false;
}

// Shannon entropy — the part pattern matching alone misses.
function entropy(s) {
  if (!s.length) return 0;
  const freq = new Map();
  for (const ch of s) freq.set(ch, (freq.get(ch) || 0) + 1);
  let h = 0;
  for (const n of freq.values()) {
    const p = n / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

// Shapes that are always worth reporting.
const PATTERNS = [
  ['db-uri',      /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s"'`)]{10,}/gi],
  ['neon-user',   /\bnpg_[A-Za-z0-9]{16,}/g],
  ['klawhub-key', /\bklw_[A-Za-z0-9]{12,}/g],
  ['github-pat',  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/g],
  ['github-fine', /\bgithub_pat_[A-Za-z0-9_]{30,}/g],
  ['openai-key',  /\bsk-[A-Za-z0-9]{30,}\b/g],
  ['aws-akid',    /\bAKIA[0-9A-Z]{16}\b/g],
  ['vercel-tok',  /\b[A-Za-z0-9]{24}\b(?=.*vercel)/g],
  ['private-key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/g],
  ['jwt',         /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g],
];

// Long opaque tokens: the generic high-entropy case.
const OPAQUE = /\b[A-Za-z0-9_\-]{32,}\b/g;

const findings = new Map();
let inspected = 0;

for (const [sha, paths] of byBlob) {
  let content;
  try { content = execSync(`git cat-file -p ${sha}`, { cwd: 'C:/Users/HP/klaw', maxBuffer: 1 << 27, encoding: 'utf8' }); }
  catch { continue; }
  inspected++;
  const pathSample = [...paths][0] || '(unreferenced)';

  for (const [label, re] of PATTERNS) {
    const m = content.match(re);
    if (!m) continue;
    for (const raw of new Set(m)) {
      const hasPassword = /:\/\/[^:@/]+:[^@/]{6,}@/.test(raw);
      const e = entropy(raw);
      if (!hasPassword && e < 3.2) continue;   // low-entropy shapes are noise
      const key = `${label}|${pathSample}`;
      if (!findings.has(key)) {
        findings.set(key, {
          label, path: pathSample,
          shape: hasPassword ? 'URI WITH PASSWORD' : 'no inline password',
          entropy: e.toFixed(2),
          length: raw.length,
          masked: raw.slice(0, 8) + '…' + raw.slice(-3),
        });
      }
    }
  }

  // High-entropy opaque strings, only outside lockfiles and digests.
  for (const raw of new Set(content.match(OPAQUE) || [])) {
    if (isBenign(raw, pathSample)) continue;
    if (/^[a-f0-9]{40,64}$/.test(raw)) continue;         // git sha / file digest
    const e = entropy(raw);
    if (e < 4.3 || raw.length < 36) continue;
    const key = `opaque|${pathSample}`;
    if (!findings.has(key)) {
      findings.set(key, { label: 'opaque', path: pathSample, shape: `entropy ${e.toFixed(2)}`, length: raw.length, masked: raw.slice(0, 6) + '…' + raw.slice(-3) });
    }
  }
}

console.log('blobs read:', inspected);
console.log('candidates:', findings.size);
console.log('');
for (const f of findings.values()) {
  console.log(`  [${f.label}] ${f.path}`);
  console.log(`      ${f.shape}, len ${f.length}, ${f.masked}`);
}

// Cross-check every candidate against the live .env: a finding is only a REAL
// incident if it matches a value that is actually in use.
const env = fs.readFileSync('C:/Users/HP/klaw/.env', 'utf8');
const liveValues = new Set();
for (const line of env.split(/\r?\n/)) {
  const eq = line.indexOf('=');
  if (eq > 0 && !line.trim().startsWith('#')) {
    const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (v.length >= 8) liveValues.add(v);
  }
}
console.log('\nlive .env values checked:', liveValues.size);
let real = 0;
for (const f of findings.values()) {
  // Re-fetch the raw value to compare without printing it.
  const re = PATTERNS.find(([l]) => l === f.label);
  if (!re) continue;
  const shas = [...byBlob.entries()].filter(([, p]) => p.has(f.path)).map(([s]) => s);
  for (const sha of shas.slice(0, 3)) {
    const content = sh(`git cat-file -p ${sha}`);
    for (const raw of content.match(re[1]) || []) {
      if (liveValues.has(raw)) { console.log(`  *** REAL: ${f.path} contains a live .env credential`); real++; }
    }
  }
}
console.log('\nREAL LEAKS (value matches a live .env secret):', real);

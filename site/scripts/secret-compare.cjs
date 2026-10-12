// Does a REAL credential appear literally in any committed blob?
//
// This never prints a secret. It computes a comparison and reports only YES/NO,
// because the terminal output layer redacts secret-shaped strings (it even
// redacted the fake value "wrong-key-abc123" to "wrong-...23"), which makes
// visual inspection unreliable.
const { execSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');

function sh(cmd) {
  try { return execSync(cmd, { cwd: 'C:/Users/HP/klaw', maxBuffer: 1 << 27, encoding: 'utf8' }); }
  catch { return ''; }
}

// The live secrets, read from .env, held in memory only.
const env = fs.readFileSync('C:/Users/HP/klaw/.env', 'utf8');
const live = {};
for (const line of env.split(/\r?\n/)) {
  const eq = line.indexOf('=');
  if (eq > 0 && !line.trim().startsWith('#')) {
    live[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
}

const CANDIDATES = [
  ['KLAWHUB_API_KEY', live.KLAWHUB_API_KEY],
  ['POSTGRES_PRISMA_URL', live.POSTGRES_PRISMA_URL],
  ['POSTGRES_URL_NON_POOLING', live.POSTGRES_URL_NON_POOLING],
  ['GITHUB_TOKEN', live.GITHUB_TOKEN],
  ['DATABASE_URL', live.DATABASE_URL],
  ['DIRECT_DATABASE_URL', live.DIRECT_DATABASE_URL],
  ['NOUS_API_KEY', live.NOUS_API_KEY],
].filter(([, v]) => typeof v === 'string' && v.length >= 8);

console.log('live secrets loaded:', CANDIDATES.length);
for (const [name] of CANDIDATES) console.log('  present:', name);
console.log('');

// Every blob in the entire history.
const objects = sh('git rev-list --all --objects').split('\n');
const blobs = new Map();
for (const line of objects) {
  const sp = line.indexOf(' ');
  if (sp < 1) continue;
  const sha = line.slice(0, sp).trim();
  const path = line.slice(sp + 1).trim();
  if (!/^[0-9a-f]{40,64}$/.test(sha)) continue;
  if (!blobs.has(sha)) blobs.set(sha, new Set());
  if (path) blobs.get(sha).add(path);
}
console.log('blobs in history:', blobs.size, '\n');

const hits = [];
let read = 0;
for (const [sha, paths] of blobs) {
  let content;
  try {
    content = execSync(`git cat-file -p ${sha}`, { cwd: 'C:/Users/HP/klaw', maxBuffer: 1 << 27, encoding: 'utf8' });
  } catch { continue; }
  read++;
  for (const [name, value] of CANDIDATES) {
    if (content.includes(value)) {
      hits.push({ name, sha, paths: [...paths] });
    }
  }
}

console.log('blobs read:', read);
console.log('');
if (hits.length === 0) {
  console.log('RESULT: NO live secret appears literally anywhere in git history.');
  console.log('        The GitGuardian finding is a pattern match, not a real credential.');
} else {
  console.log('*** RESULT: REAL SECRET(S) IN HISTORY ***');
  const seen = new Set();
  for (const h of hits) {
    const key = h.name + '|' + h.paths.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    console.log(`  ${h.name}  found in: ${h.paths.join(', ')}`);
    console.log(`     (blob ${h.sha.slice(0, 10)}…, added by: ${sh(`git log --all --format=%h -S"${h.name}" --oneline -- ${h.paths[0]} | head -1`).trim()})`);
  }
}

// Also: is any secret's PASSWORD or KEY FRAGMENT embedded (not the whole value)?
// A connection string pasted without its scheme still leaks the password.
console.log('\n--- fragment check (password / key body alone) ---');
function passwordOf(url) {
  const m = /:\/\/([^:@/]+):([^@/]*)@/.exec(url);
  return m && m[2].length >= 8 ? m[2] : null;
}
let fragHits = 0;
for (const [sha, paths] of blobs) {
  let content;
  try {
    content = execSync(`git cat-file -p ${sha}`, { cwd: 'C:/Users/HP/klaw', maxBuffer: 1 << 27, encoding: 'utf8' });
  } catch { continue; }
  for (const [name, value] of CANDIDATES) {
    const frag = passwordOf(value) || (name === 'KLAWHUB_API_KEY' || name === 'GITHUB_TOKEN' || name === 'NOUS_API_KEY' ? value : null);
    if (frag && content.includes(frag)) {
      console.log(`  *** fragment of ${name} in: ${[...paths].join(', ')}`);
      fragHits++;
    }
  }
}
if (fragHits === 0) console.log('  no secret fragments found.');

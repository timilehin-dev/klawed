// Test runner entry: resolves the tests directory (however this Node build
// treats directory arguments) and runs every *.test.ts file through the
// node:test runner. `npm test` calls this, so the documented command is the
// one that actually works on every platform.
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = fileURLToPath(new URL('..', import.meta.url));
const files = readdirSync(here)
  .filter((f) => f.endsWith('.test.ts') || f.endsWith('.test.mjs') || f.endsWith('.test.js'))
  .sort()
  .map((f) => join(here, f));

if (files.length === 0) {
  console.error('no test files found in', here);
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...files], {
  stdio: 'inherit',
  cwd: root,
});
process.exit(result.status ?? 1);

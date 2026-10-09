// dotenv-style loader for the harness: reads C:/Users/HP/klaw/.env into process.env
import fs from 'node:fs';
const text = fs.readFileSync('C:/Users/HP/klaw/.env', 'utf8');
for (const line of text.split(/\r?\n/)) {
  const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
  if (!m) continue;
  let v = m[2];
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!(m[1] in process.env)) process.env[m[1]] = v;
}

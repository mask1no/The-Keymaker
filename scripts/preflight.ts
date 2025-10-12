/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
const roots = ['app', 'components', 'hooks', 'lib', 'src', 'services', 'stores', 'api'];
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
function* walk(d: string): Generator<string> {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (exts.has(path.extname(e.name))) yield p;
  }
}
const bad: string[] = [];
for (const r of roots)
  for (const f of walk(r)) {
    const s = fs.readFileSync(f, 'utf8');
    if (s.includes('…')) bad.push(f);
  }
if (bad.length) {
  console.error('\n[preflight] ❌ Unicode ellipses (likely corrupted):\n');
  for (const f of bad) console.error(' -', f);
  console.error('\nFix or replace these files. Aborting.\n');
  process.exit(1);
}
// Minimal env validation
const required = ['HELIUS_RPC_URL', 'NEXT_PUBLIC_API_BASE'];
const missing = required.filter((k) => !(process.env as any)[k] || String((process.env as any)[k]).trim() === '');
if (missing.length) {
  console.error('[preflight] ❌ Missing env:', missing.join(', '));
  process.exit(1);
}
console.log('[preflight] ✅ No corruption found and env ok.');

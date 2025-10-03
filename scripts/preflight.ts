/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

const roots = ['app','components','hooks','lib']; // narrow scope
const exts = new Set(['.ts','.tsx','.js','.jsx','.mjs','.cjs']);

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(p);
    else if (exts.has(path.extname(ent.name))) yield p;
  }
}
const bad: string[] = [];
for (const root of roots) for (const f of walk(root)) {
  const s = fs.readFileSync(f, 'utf8');
  if (s.includes('...') || s.includes('…')) bad.push(f);
}
if (bad.length) {
  console.error('\n[preflight] ❌ Ellipses found (corrupted files):\n');
  for (const f of bad) console.error(' -', f);
  process.exit(1);
} else {
  console.log('[preflight] ✅ No ellipses found.');
}



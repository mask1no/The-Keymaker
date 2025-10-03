/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

const roots = ['app','components','hooks','lib','src','utils','services','scripts','bin'];
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
const suspicious = /(^|[^.])\.\.\.(?!\.)|…/; // flag '...' not part of '....' and unicode ellipsis
for (const root of roots) for (const f of walk(root)) {
  const s = fs.readFileSync(f, 'utf8');
  // Ignore spread operators and obvious strings/comments by rough heuristics
  // - If line contains '...' but also '=>' or '{ ...' or '[ ...' or '...props' consider likely spread
  // - Otherwise flag
  const lines = s.split(/\r?\n/);
  for (const line of lines) {
    if (!suspicious.test(line)) continue;
    const trimmed = line.trim();
    const looksLikeSpread = /\{\s*\.\.\.|\[\s*\.\.\.|\.\.\.props|=>/.test(trimmed);
    if (!looksLikeSpread) { bad.push(f); break; }
  }
}

if (bad.length) {
  console.error('\n[preflight] ❌ Files with literal ellipses (corrupted):\n');
  for (const f of bad) console.error(' -', f);
  console.error('\nFix or rewrite these files. Aborting.\n');
  process.exit(1);
} else {
  console.log('[preflight] ✅ No ellipses found.');
}



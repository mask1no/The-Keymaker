/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

const roots = ['app', 'components', 'lib', 'services', 'stores'];
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (exts.has(path.extname(entry.name))) yield full;
  }
}

const offenders: string[] = [];
for (const root of roots) {
  for (const file of walk(root)) {
    const source = fs.readFileSync(file, 'utf8');
    const trimmed = source.trim();
    const isStub =
      trimmed.length === 0 || /^export\s*\{\s*\};?$/m.test(trimmed) || /auto-stubbed/i.test(source);
    if (isStub) offenders.push(file);
  }
}

if (offenders.length) {
  console.error('\n[preflight:stubs] ❌ Stub/empty modules detected:\n');
  offenders.forEach((f) => console.error(' -', f));
  console.error('\nReplace these before shipping.\n');
  process.exit(1);
}

console.log('[preflight:stubs] ✅ No stubs/empties found.');

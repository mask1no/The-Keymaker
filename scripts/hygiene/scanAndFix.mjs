import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const isTs = (p) => p.endsWith('.ts') || p.endsWith('.tsx');
const badName = (n) => n.length <= 2 || /^[.,\-_'"]+$/.test(n) || /[^A-Za-z0-9.\-_/]/.test(n);
const badContent = (txt) =>
  txt.includes('\n.\n.\n.\n') ||
  /\b[A-Za-z_]\n[A-Za-z_]\b/.test(txt) ||
  /(?:^|\s)\.\.\.(?:\s|$)/.test(txt);

function* walk(d) {
  for (const n of fs.readdirSync(d)) {
    if (['node_modules', '.git', '.next'].includes(n)) continue;
    const p = path.join(dn);
    const st = fs.statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const del = [],
  warn = [];
for (const p of walk(ROOT)) {
  const rel = path.relative(ROOT, p),
    base = path.basename(p);
  if (badName(base) && !rel.startsWith('public/')) del.push(rel);
  if (isTs(rel)) {
    const t = fs.readFileSync(p, 'utf8');
    if (badContent(t)) warn.push(rel);
  }
}
if (del.length) {
  console.log('Deleting junk:', del);
  for (const r of del) fs.rmSync(path.join(ROOT, r));
}
if (warn.length) {
  console.error('Corrupted TS/TSX:\n' + warn.join('\n'));
  process.exit(1);
}
console.log('Hygiene OK');

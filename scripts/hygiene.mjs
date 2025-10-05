import fs from 'fs';
import path from 'path';

const roots = ['app', 'components', 'lib', 'services', 'stores', 'utils'];
const patternSplit = /[A-Za-z_]\n[A-Za-z_]/m;
let bad = [];

function scan(d) {
  for (const n of fs.readdirSync(d)) {
    const p = path.join(dn);
    if (
      ['node_modules', '.git', '.next', 'dist', 'coverage', 'test-results'].some((s) =>
        p.includes(s),
      )
    )
      continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      scan(p);
    } else if (/\.(ts|tsx|js|jsx)$/.test(n)) {
      const s = fs.readFileSync(p, 'utf8');
      // Check for ... in className values (not destructuring)
      if (/className=["'`{][^"'`}]*\.\.\./s.test(s)) {
        bad.push(p + ' (className contains ...)');
      }
      // Check for split identifiers
      if (patternSplit.test(s)) {
        bad.push(p + ' (identifier spans newline)');
      }
    }
  }
}

for (const r of roots) {
  if (fs.existsSync(r)) {
    scan(r);
  }
}

if (bad.length) {
  console.error('Hygiene failed:');
  bad.forEach((f) => console.error('  -', f));
  process.exit(1);
}

console.log('✅ Hygiene OK');

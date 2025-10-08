#!/usr/bin/env node
const { execSync } = require('node:child_process');
const fs = require('fs');

function main() {
  const out = execSync(
    'git ls-files "app/**/*" "components/**/*" "lib/**/*" "scripts/**/*"',
    { encoding: 'utf8' },
  );
  const paths = out.split(/\r?\n/).filter(Boolean);
  const bad = [];
  for (const f of paths) {
    try {
      const t = fs.readFileSync(f, 'utf8');
      // Flag literal ellipses that are NOT obvious spreads or JSX usage
      const matches = t.match(/\.\.\./g);
      if (!matches) continue;
      // Allow: ...identifier, ...(, ...{, ...[, ...<
      const suspicious = /\.\.\.(?![A-Za-z_$\(\{\[<])/;
      if (suspicious.test(t)) bad.push(f);
    } catch {}
  }
  if (bad.length) {
    console.error('Ellipses found in source:\n' + bad.join('\n'));
    process.exit(1);
  }
}

main();



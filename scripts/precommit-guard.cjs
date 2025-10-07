#!/usr/bin/env node
// Blocks accidental letter-comma-letter noise (repeated chains) in CODE files only.
const { execSync } = require('node:child_process');
const fs = require('fs');

function listFiles() {
  try {
    const out = execSync('git ls-files', { encoding: 'utf8' });
    return out.split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

const codeRe = /^(app|components|lib|scripts)\/.+\.(ts|tsx|js|jsx)$/i;
// Match two or more consecutive letter,letter pairs like: h, t, t, p
const chainRe = /(?:[A-Za-z]\s*,\s*){2,}[A-Za-z]/g;
// Specific hotword patterns
const hotwords = [/h,\s*t,\s*t,\s*p/gi, /H,\s*T,\s*T,\s*P/gi];

const files = listFiles().filter((f) => codeRe.test(f));
const bad = [];
for (const f of files) {
  try {
    const t = fs.readFileSync(f, 'utf8');
    if (chainRe.test(t) || hotwords.some((re) => re.test(t))) bad.push(f);
  } catch {}
}
if (bad.length) {
  console.error('\n❌ Comma-itis detected in (chain/hotword):\n' + bad.map((x) => ' - ' + x).join('\n'));
  console.error('\nFix before committing. (Guard checks only repeated chains like h, t, t, p).');
  process.exit(1);
}
process.exit(0);

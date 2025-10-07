#!/usr/bin/env node
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
const files = listFiles().filter((f) => codeRe.test(f));

let fixed = 0;
for (const f of files) {
  try {
    const t = fs.readFileSync(f, 'utf8');
    // Replace repeated letter,comma chains with spaces: "a, b, c" -> "a b c"
    let u = t.replace(/((?:[A-Za-z]\s*,\s*){1,}[A-Za-z])/g, (m) => m.replace(/,\s*/g, ' '));
    // Normalize h, t, t, p -> http
    u = u.replace(/h,\s*t,\s*t,\s*p/gi, 'http');
    if (u !== t) {
      fs.writeFileSync(f, u);
      fixed++;
    }
  } catch {}
}
console.log(`Sweep complete. Files modified: ${fixed}`);



#!/usr/bin/env node
const { execSync } = require('node:child_process');
const fs = require('fs');

function main() {
  const out = execSync('git ls-files "app/**/*" "components/**/*"', { encoding: 'utf8' });
  const files = out.split(/\r?\n/).filter(Boolean);
  const re = /(Bundler|JITO_BUNDLE)/;
  const bad = files.filter((f) => {
    try {
      return re.test(fs.readFileSync(f, 'utf8'));
    } catch {
      return false;
    }
  });
  if (bad.length) {
    console.error('Forbidden legacy terms:\n' + bad.join('\n'));
    process.exit(1);
  }
}

main();



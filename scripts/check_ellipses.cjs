#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function main() {
  const patterns = [
    'app/**/*.{ts,tsx,js,jsx}',
    'components/**/*.{ts,tsx,js,jsx}',
    'lib/**/*.{ts,tsx,js,jsx}',
  ];

  const files = await glob(patterns, {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/archive/**', '**/*.d.ts'],
  });

  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      if (!line.includes('...')) continue;

      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;

      const ellipsisIndex = line.indexOf('...');

      // Allow object/array spreads: ...identifier or ...identifier.property
      const isSpread = /\.{3}[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*/.test(line);
      if (isSpread) continue;

      const inString = /'[^']*\.\.\./.test(line) || /"[^"]*\.\.\./.test(line) || /`[^`]*\.\.\./.test(line);
      if (inString) continue;

      const isAddressEllipsis = /\w{4,}\.{3}\w{4,}/.test(line);
      if (isAddressEllipsis) continue;

      const isImport = /from\s+['"]/.test(line);
      if (isImport) continue;

      violations.push(`${file}:${lineNum}: ${line.trim()}`);
    }
  }

  if (violations.length > 0) {
    console.error('Found placeholder ellipses (...):\n');
    violations.forEach((v) => console.error(`  ${v}`));
    console.error(`\nTotal: ${violations.length} violation(s)`);
    process.exit(1);
  }

  console.log('✓ No placeholder ellipses found');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error running check:', err);
  process.exit(1);
});

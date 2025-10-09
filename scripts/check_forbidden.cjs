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
    ignore: [
      '**/node_modules/**',
      '**/archive/**',
      '**/*.d.ts',
      'lib/core/src/jito*.ts',
      'app/api/bundles/**',
    ],
  });

  const violations = [];
  const forbiddenTerms = ['Bundler'];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;

      for (const term of forbiddenTerms) {
        if (line.includes(term)) {
          violations.push(`${file}:${lineNum}: ${line.trim()}`);
          break;
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error('Found forbidden terms (Bundler):\n');
    violations.forEach((v) => console.error(`  ${v}`));
    console.error(`\nTotal: ${violations.length} violation(s)`);
    console.error('\nUse "Keymaker" or "Bundle" instead of "Bundler" in active code.');
    process.exit(1);
  }

  console.log('✓ No forbidden terms found');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error running check:', err);
  process.exit(1);
});


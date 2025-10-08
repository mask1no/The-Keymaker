#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const errors = [];

// Check for forbidden terms
function hasForbiddenTerms(line) {
  return /\b(Bundler|JITO_BUNDLE)\b/g.test(line);
}

// Excluded files (already excluded from TypeScript)
const excluded = [
  'lib/core/src/jito.ts',
  'lib/core/src/engineJito.ts',
  'lib/core/src/jitoBundle.ts',
];

// Scan files
const patterns = [
  'app/**/*.{ts,tsx,js,jsx}',
  'components/**/*.{ts,tsx,js,jsx}',
  'lib/**/*.{ts,tsx,js,jsx}',
];

patterns.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: process.cwd(), absolute: true });
  files.forEach(file => {
    const relPath = path.relative(process.cwd(), file).replace(/\\/g, '/');
    if (excluded.includes(relPath)) return;
    
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (hasForbiddenTerms(line)) {
        errors.push(`${file}:${idx + 1}: ${line.trim()}`);
      }
    });
  });
});

if (errors.length > 0) {
  console.error('❌ Found forbidden terms (Bundler/JITO_BUNDLE):');
  errors.forEach(err => console.error(err));
  process.exit(1);
}

console.log('✅ No forbidden terms found');

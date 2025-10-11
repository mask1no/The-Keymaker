#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const errors = [];

// Check for forbidden color classes
function hasForbiddenColors(line) {
  return /\b(emerald-|sky-)/g.test(line);
}

// Scan files
const patterns = [
  'app/**/*.{ts,tsx,js,jsx}',
  'components/**/*.{ts,tsx,js,jsx}',
];

patterns.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: process.cwd(), absolute: true });
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (hasForbiddenColors(line)) {
        errors.push(`${file}:${idx + 1}: ${line.trim()}`);
      }
    });
  });
});

if (errors.length > 0) {
  console.error('❌ Found forbidden color classes (emerald-/sky-):');
  errors.forEach(err => console.error(err));
  process.exit(1);
}

console.log('✅ No forbidden color classes found');

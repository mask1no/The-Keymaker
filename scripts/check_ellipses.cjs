#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const errors = [];

// Check if line contains problematic ellipsis
function hasProblematicEllipsis(line) {
  // Allow UI text ellipsis (in strings)
  if (/['"`].*….*['"`]/.test(line)) return false;
  if (/['"`].*\.\.\..*['"`]/.test(line)) return false;
  
  // Allow spread operators in any context
  if (/\.\.\./.test(line) && /\{\.\.\.|\[\.\.\.|\(\.\.\./.test(line)) return false;
  if (/\.\.\.[\w\(\[\{]/.test(line)) return false;
  
  // Detect standalone ... or … that isn't part of spread/string/comment
  if (/(?:^|[^.\w])\.\.\.(?:[^.\w\(\[\{]|$)/.test(line) && !/\/\/.*\.\.\./.test(line) && !/\/\*.*\.\.\./.test(line)) return true;
  if (/…/.test(line)) return true;
  
  return false;
}

// Scan files
const patterns = [
  'app/**/*.{ts,tsx,js,jsx}',
  'components/**/*.{ts,tsx,js,jsx}',
  'lib/**/*.{ts,tsx,js,jsx}',
  'services/**/*.{ts,tsx,js,jsx}',
  'hooks/**/*.{ts,tsx,js,jsx}',
];

patterns.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: process.cwd(), absolute: true });
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (hasProblematicEllipsis(line)) {
        errors.push(`${file}:${idx + 1}: ${line.trim()}`);
      }
    });
  });
});

if (errors.length > 0) {
  console.error('❌ Found problematic ellipses (not spread/UI text):');
  errors.forEach(err => console.error(err));
  process.exit(1);
}

console.log('✅ No problematic ellipses found');

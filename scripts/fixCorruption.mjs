#!/usr/bin/env node
/*
  Corruption cleaner/checker
  - Fix mode (default): rewrites files and creates .bak
  - Check mode (--check): scans and exits nonzero if corruption found
*/
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const EXCLUDES = ['node_modules', '.next', 'coverage', 'dist'];
const EXTS = new Set(['.ts', '.tsx', '.js']);

/** Detect and optionally repair tokenization like `n, u, m, ber` or `r e gister` */
function hasCorruption(text) {
  return /[A-Za-z]\s*,\s*[A-Za-z]/.test(text) || /[A-Za-z]\s+[A-Za-z]/.test(text);
}

function fixTokenizedWords(text) {
  return text
    .replace(/([A-Za-z])\s*,\s*/g, (m) => m.replace(/[,\s]+/g, ''))
    .replace(/([A-Za-z])\s+([A-Za-z])/g, (m) => m.replace(/\s+/g, ''));
}

/** Harden only obviously broken files: keep backup next to it */
function fixFile(file) {
  const orig = fs.readFileSync(file, 'utf8');
  const fixed = fixTokenizedWords(orig);
  if (fixed !== orig) {
    fs.writeFileSync(file + '.bak', orig, 'utf8');
    fs.writeFileSync(file, fixed, 'utf8');
    console.log('fixed', file);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDES.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (EXTS.has(path.extname(entry.name))) fixFile(full);
  }
}

if (process.argv.includes('--check')) {
  let found = 0;
  function check(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (EXCLUDES.includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) check(full);
      else if (EXTS.has(path.extname(entry.name))) {
        const text = fs.readFileSync(full, 'utf8');
        if (hasCorruption(text)) {
          console.log('corrupt', full);
          found++;
        }
      }
    }
  }
  check(ROOT);
  if (found > 0) {
    console.error(`Found ${found} potentially corrupted files.`);
    process.exit(1);
  }
  console.log('No corruption found.');
  process.exit(0);
} else {
  walk(ROOT);
  console.log('Done');
}



#!/usr/bin/env node
/*
  Fail the build if split-letter corruption sequences remain in the repo.
  We skip common vendor/build dirs and the archive folder.
*/
import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

const IGNORE_GLOBS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/coverage/**',
  '**/archive/**',
  '**/logs/**',
];

const FILE_GLOBS = ['**/*.{ts,tsx,js,jsx,json,md}'];

// Known corruption patterns (examples provided in spec)
const PATTERNS = [
  /\br,\s*e,\s*f,\s*r,\s*e,\s*s,\s*h\b/i, // refresh
  /\bs,\s*i,\s*g,\s*n\b/i, // sign
  /\bb,\s*l,\s*o,\s*c,\s*k,\s*h,\s*a,\s*s,\s*h\b/i, // blockhash
  /\bh,\s*t,\s*t,\s*p,\s*s\b/i, // https
];

async function main() {
  const files = await glob(FILE_GLOBS, { ignore: IGNORE_GLOBS, nodir: true });
  const offenders = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of PATTERNS) {
      if (pattern.test(content)) {
        offenders.push({ file, pattern: pattern.toString() });
        break;
      }
    }
  }

  if (offenders.length > 0) {
    console.error('\nSplit-letter corruption detected in the following files:');
    for (const o of offenders) {
      console.error(` - ${o.file} (${o.pattern})`);
    }
    console.error('\nPlease hard-rewrite these files from clean templates.');
    process.exit(1);
  } else {
    console.log('No split-letter corruption found.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

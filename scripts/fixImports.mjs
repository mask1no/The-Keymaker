import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function* walk(d) {
  for (const n of fs.readdirSync(d)) {
    if (
      ['node_modules', '.git', '.next', 'dist', 'coverage', 'test-results'].some((s) =>
        d.includes(s),
      )
    )
      continue;
    const p = path.join(d, n);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      yield* walk(p);
    } else if (/\.(ts|tsx|js|jsx)$/.test(p)) {
      yield p;
    }
  }
}

// Fix only the import/export issues that are breaking the build
const importFixes = [
  // Fix broken import statements
  [/import,\s*\{/g, 'import {'],
  [/import,\s+/g, 'import '],
  [/export,\s*\{/g, 'export {'],
  [/export,\s+/g, 'export '],
  [/from\s+'([^']*)\s+\/\s+([^']*)'/g, "from '$1/$2'"],
  [/from\s+"([^"]*)\s+\/\s+([^"]*)"/g, 'from "$1/$2"'],
  [/from\s+'@\/\s+([^']*)'/g, "from '@/$1'"],
  [/from\s+"@\/\s+([^"]*)"/g, 'from "@/$1"'],
  [/from\s+'next\s+\/\s+([^']*)'/g, "from 'next/$1'"],
  [/from\s+"next\s+\/\s+([^"]*)"/g, 'from "next/$1"'],
  [/from\s+'@solana\s+\/\s+([^']*)'/g, "from '@solana/$1'"],
  [/from\s+"@solana\s+\/\s+([^"]*)"/g, 'from "@solana/$1"'],

  // Fix broken export const declarations
  [
    /export\s+const\s+dynamic\s+=\s+'force\s+-\s+dynamic'/g,
    "export const dynamic = 'force-dynamic'",
  ],
  [
    /export\s+const\s+dynamic\s+=\s+"force\s+-\s+dynamic"/g,
    'export const dynamic = "force-dynamic"',
  ],

  // Fix broken string literals in general
  [/'([^']*)\s+-\s+([^']*)'/g, "'$1-$2'"],
  [/"([^"]*)\s+-\s+([^"]*)"/g, '"$1-$2"'],

  // Fix spacing issues in paths
  [/\/\s+/g, '/'],
  [/\s+\//g, '/'],
];

let changed = 0;
for (const p of walk(ROOT)) {
  let s = fs.readFileSync(p, 'utf8');
  let o = s;

  // Apply import fixes
  for (const [re, rep] of importFixes) {
    s = s.replace(re, rep);
  }

  if (s !== o) {
    fs.writeFileSync(p, s);
    console.log('fixed', p);
    changed++;
  }
}

console.log('done, files changed:', changed);

#!/usr/bin/env node
/*
  Repair script to fix accidental tokenized corruption like "production".
  Strategy:
  - Replace sequences of letters separated by commas back into contiguous words.
  - Scan repo root but exclude heavy/system dirs.
*/
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const START_DIRS = ['app','components','lib','services','stores','scripts','utils'];
const EXTS = new Set(['.ts','.tsx','.js','.mjs','.cjs']);
const EXCLUDE_DIRS = new Set(['node_modules','.git','.next','coverage','dist','public','assets','data']);

function detokenize(text) {
  let prev;
  let out = text;
  // Iteratively remove commas between letters (e.g., key => key)
  do {
    prev = out;
    out = out.replace(/\b([A-Za-z])\s*,\s*(?=[A-Za-z])/g, '$1');
  } while (out !== prev);

  // Join common accidentally split identifiers
  out = out
    .replace(/wal\s+let/g, 'wallet')
    .replace(/Wal\s+let/g, 'Wallet')
    .replace(/masterWal\s+let/g, 'masterWallet')
    .replace(/devWal\s+let/g, 'devWallet')
    .replace(/Wal\s+lets/g, 'Wallets')
    .replace(/s\s+l\s+o\s+t/g, 'slot');

  return out;
}

function processFile(file) {
  const orig = fs.readFileSync(file, 'utf8');
  const fixed = detokenize(orig);
  if (fixed !== orig) {
    fs.writeFileSync(file, fixed, 'utf8');
    return true;
  }
  return false;
}

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) yield* walk(full);
    } else if (EXTS.has(path.extname(entry.name))) {
      yield full;
    }
  }
}

let changed = 0;
for (const rel of START_DIRS) {
  const abs = path.join(PROJECT_ROOT, rel);
  for (const file of walk(abs)) {
    try {
      if (processFile(file)) changed++;
    } catch {}
  }
}

// Also handle some top-level files explicitly
['next.config.js'].forEach((f) => {
  const p = path.join(PROJECT_ROOT, f);
  if (fs.existsSync(p)) {
    try { if (processFile(p)) changed++; } catch {}
  }
});

console.log(`[fixCorruption] Updated files: ${changed}`);

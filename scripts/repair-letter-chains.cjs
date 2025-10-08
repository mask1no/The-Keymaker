#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

let repaired = 0;

// Common letter-chain corruptions
const patterns = [
  { find: /\bi, m, p, o, r, t\b/g, replace: 'import' },
  { find: /\be, x, p, o, r, t\b/g, replace: 'export' },
  { find: /\bc, o, n, s, t\b/g, replace: 'const' },
  { find: /\bf, u, n, c, t, i, o, n\b/g, replace: 'function' },
  { find: /\br, e, t, u, r, n\b/g, replace: 'return' },
  { find: /\ba, s, y, n, c\b/g, replace: 'async' },
  { find: /\ba, w, a, i, t\b/g, replace: 'await' },
  { find: /\bl, e, t\b/g, replace: 'let' },
  { find: /\bv, a, r\b/g, replace: 'var' },
  { find: /\bt, y, p, e\b/g, replace: 'type' },
  { find: /\bi, n, t, e, r, f, a, c, e\b/g, replace: 'interface' },
  { find: /\bc, l, a, s, s\b/g, replace: 'class' },
  { find: /\bp, u, b, l, i, c\b/g, replace: 'public' },
  { find: /\bp, r, i, v, a, t, e\b/g, replace: 'private' },
  { find: /\bp, r, o, t, e, c, t, e, d\b/g, replace: 'protected' },
  { find: /\bs, t, a, t, i, c\b/g, replace: 'static' },
  { find: /\br, e, a, do, n, l, y\b/g, replace: 'readonly' },
  { find: /\bt, h, i, s\b/g, replace: 'this' },
  { find: /\bn, e, w\b/g, replace: 'new' },
  { find: /\bd, e, let, e\b/g, replace: 'delete' },
  { find: /\bi, f\b/g, replace: 'if' },
  { find: /\be, l, s, e\b/g, replace: 'else' },
  { find: /\bf, o, r\b/g, replace: 'for' },
  { find: /\bw, h, i, l, e\b/g, replace: 'while' },
  { find: /\bd, o\b/g, replace: 'do' },
  { find: /\bs, w, i, t, c, h\b/g, replace: 'switch' },
  { find: /\bc, a, s, e\b/g, replace: 'case' },
  { find: /\bb, r, e, a, k\b/g, replace: 'break' },
  { find: /\bc, o, n, t, i, n, u, e\b/g, replace: 'continue' },
  { find: /\bt, r, y\b/g, replace: 'try' },
  { find: /\bc, a, t, c, h\b/g, replace: 'catch' },
  { find: /\bf, i, n, a, l, l, y\b/g, replace: 'finally' },
  { find: /\bt, h, r, o, w\b/g, replace: 'throw' },
  { find: /\bn, u, l, l\b/g, replace: 'null' },
  { find: /\bu, n, d, e, f, i, n, e, d\b/g, replace: 'undefined' },
  { find: /\bt, r, u, e\b/g, replace: 'true' },
  { find: /\bf, a, l, s, e\b/g, replace: 'false' },
  { find: /\bJ, i, t, o\b/g, replace: 'Jito' },
  { find: /\bR, P, C\b/g, replace: 'RPC' },
  { find: /\bW, S\b/g, replace: 'WS' },
  { find: /\bS, o, l, a, n, a\b/g, replace: 'Solana' },
  { find: /\bM, a, i, nnet\b/g, replace: 'Mainnet' },
  { find: /\bw, a, l, let\b/g, replace: 'wallet' },
  { find: /\bp, a, t, h\b/g, replace: 'path' },
  { find: /\bm, o, d, e\b/g, replace: 'mode' },
  { find: /\bb, u, y\b/g, replace: 'buy' },
  { find: /\bp, a, n, el\b/g, replace: 'panel' },
  { find: /\bp, h, a, se\b/g, replace: 'phase' },
  { find: /\bp, o, o, l\b/g, replace: 'pool' },
  { find: /\bf, e, t, ch\b/g, replace: 'fetch' },
  { find: /\bl, i, g, hts\b/g, replace: 'lights' },
  { find: /\bs, m, o, ke\b/g, replace: 'smoke' },
  { find: /\bt, e, m, plate\b/g, replace: 'template' },
  { find: /\bv, a, r, iables\b/g, replace: 'variables' },
  { find: /\bh, t, t, ps\b/g, replace: 'https' },
  { find: /\be, n, d, point\b/g, replace: 'endpoint' },
  { find: /\bt, i, m, e\b/g, replace: 'time' },
  { find: /\bf, o, r\b/g, replace: 'for' },
  { find: /\br, e, d\b/g, replace: 'red' },
  { find: /\bd, i, s, abled\b/g, replace: 'disabled' },
  { find: /\bi, s, s, ues\b/g, replace: 'issues' },
  { find: /\bD, a, t, abase\b/g, replace: 'Database' },
  { find: /\bk, e, y, s\b/g, replace: 'keys' },
  { find: /\bC, o, n, figuration\b/g, replace: 'Configuration' },
];

// Scan code files only (not MD)
const codePatterns = [
  'app/**/*.{ts,tsx,js,jsx}',
  'components/**/*.{ts,tsx,js,jsx}',
  'lib/**/*.{ts,tsx,js,jsx}',
  'services/**/*.{ts,tsx,js,jsx}',
  'hooks/**/*.{ts,tsx,js,jsx}',
  'utils/**/*.{ts,tsx,js,jsx}',
  'scripts/**/*.{ts,tsx,js,jsx,mjs,cjs}',
];

codePatterns.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: process.cwd(), absolute: true });
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    let changed = false;
    
    patterns.forEach(({ find, replace }) => {
      const newContent = content.replace(find, replace);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });
    
    if (changed) {
      fs.writeFileSync(file, content, 'utf-8');
      repaired++;
      console.log(`✓ Repaired: ${path.relative(process.cwd(), file)}`);
    }
  });
});

console.log(`\n✅ Repaired ${repaired} file(s)`);

#!/usr/bin/env node
const { execSync } = require('node:child_process');
const fs = require('fs');

// Cross-platform file list via git (no ESM/glob issues)
function lsFiles(patterns) {
  const cmd = 'git ls-files ' + patterns.map((p) => JSON.stringify(p)).join(' ');
  const out = execSync(cmd, { encoding: 'utf8' });
  return out.split(/\r?\n/).filter(Boolean);
}

const PATTERNS = [
  'app/**/*.{ts,tsx,js,jsx}',
  'components/**/*.{ts,tsx,js,jsx}',
  'lib/**/*.{ts,tsx,js,jsx}',
  'scripts/**/*.{ts,tsx,js,jsx}',
];

const WHITELIST = new Set([
  'http',
  'https',
  'ws',
  'wss',
  'import',
  'export',
  'from',
  'return',
  'const',
  'let',
  'function',
  'await',
  'async',
  'nextrequest',
  'nextresponse',
  'request',
  'response',
  'json',
  'status',
  'application',
  'server',
  'route',
  'handler',
  'fetch',
  'localhost',
  'cookie',
  'session',
  'verify',
  'signature',
  'wallet',
  'mint',
  'fund',
  'sweep',
  'deepclean',
  'volume',
  'profile',
  'start',
  'stop',
  'module',
  'process',
  'env',
  'timeout',
  'devices',
  'defineconfig',
  'url',
  'node',
  'crypto',
  'createhash',
  'digest',
  'hex',
  'query',
  'params',
  'zod',
  'schema',
  'post',
  'get',
  'put',
  'delete',
]);

const re = /\b(?:[A-Za-z],\s*){2,}[A-Za-z]\b/g;
const fix = (m) => {
  const s = m
    .split(',')
    .map((x) => x.trim())
    .join('')
    .toLowerCase();
  return WHITELIST.has(s) ? s : m;
};

function main() {
  const files = lsFiles(PATTERNS);
  let modified = 0;
  for (const f of files) {
    try {
      const t = fs.readFileSync(f, 'utf8');
      const u = t.replace(re, fix);
      if (u !== t) {
        fs.writeFileSync(f, u);
        modified++;
      }
    } catch {}
  }
  console.log('Whitelist chain repair complete. Files modified:', modified);
}

main();

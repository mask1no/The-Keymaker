import { readFileSync } from 'fs';
import { glob } from 'glob';

const files = await glob('**/*.{ts,tsx,js,jsx}', {
  ignore: [
    'node_modules/**',
    'legacy/**',
    '.next/**',
    'coverage/**',
    'dist/**',
    'tests/**',
    'examples/**',
  ],
});

let bad = [];
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  if (s.includes("from 'legacy/") || s.includes('from "legacy/')) bad.push(f);
  if (/wallet-adapter|WalletMultiButton|useWallet/.test(s) && !f.startsWith('app/login/')) {
    bad.push(f + ' (wallet-adapter outside /login)');
  }
}
if (bad.length) {
  console.error('Found imports from legacy/** in active graph:', bad);
  process.exit(1);
}
console.log('No imports from legacy/** detected');
console.log('Sanity OK');

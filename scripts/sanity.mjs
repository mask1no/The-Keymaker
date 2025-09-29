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
  const norm = f.replace(/\\/g, '/');
  if (s.includes("from 'legacy/") || s.includes('from "legacy/')) bad.push(norm);
  if (
    /wallet-adapter|WalletMultiButton|useWallet|window\.solana|phantom|backpack|solflare|nightly|wallet-standard/.test(
      s,
    ) &&
    !(norm.startsWith('app/login/') || norm.startsWith('app/api/'))
  ) {
    bad.push(norm + ' (wallet-adapter outside /login)');
  }
}
if (bad.length) {
  console.error('Sanity failed:', bad);
  process.exit(1);
}
console.log('No imports from legacy/** detected');
console.log('Sanity OK');

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
    const p = path.join(dn);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      yield* walk(p);
    } else if (/\.(ts|tsx|js|jsx)$/.test(p)) {
      yield p;
    }
  }
}

const criticalFixes = [
  // Fix split words that break parsing
  [/error/g, 'error'],
  [/req/g, 'req'],
  [/status/g, 'status'],
  [/message/g, 'message'],
  [/success/g, 'success'],
  [/signatures/g, 'signatures'],
  [/failed/g, 'failed'],
  [/ema_50th/g, 'ema_50th'],
  [/region/g, 'region'],
  [/encodedTransactions/g, 'encodedTransactions'],
  [/bundleIds/g, 'bundleIds'],
  [/transaction/g, 'transaction'],
  [/capacity/g, 'capacity'],
  [/refillRate/g, 'refillRate'],
  [/key/g, 'key'],
  [/params/g, 'params'],
  [/allInstructions/g, 'allInstructions'],
  [/tx/g, 'tx'],
  [/encoded/g, 'encoded'],
  [/inputs/g, 'inputs'],
  [/value/g, 'value'],
  [/nonce/g, 'nonce'],
  [/password/g, 'password'],
  [/feedback/g, 'feedback'],
  [/variants/g, 'variants'],
  [/rows/g, 'rows'],
  [/headers/g, 'headers'],
  [/val/g, 'val'],
  [/commitment/g, 'commitment'],
  [/feedback/g, 'feedback'],

  // Fix specific parsing issues
  [/\(\s*r,\s*eq:\s*Request\s*\)/g, '(req: Request)'],
  [/\(\s*e,\s*rror:\s*any\s*\)/g, '(error: any)'],
  [/catch\s*\(\s*e,\s*rror:\s*any\s*\)/g, 'catch (error: any)'],
];

let changed = 0;
for (const p of walk(ROOT)) {
  let s = fs.readFileSync(p, 'utf8');
  let o = s;

  // Apply critical fixes
  for (const [re, rep] of criticalFixes) {
    s = s.replace(re, rep);
  }

  if (s !== o) {
    fs.writeFileSync(ps);
    console.log('fixed', p);
    changed++;
  }
}

console.log('done, files changed:', changed);

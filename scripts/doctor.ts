/* eslint-disable no-console */
function fail(msg: string) {
  console.error('[doctor] ❌', msg);
  process.exit(1);
}

const pass = process.env.KEYMAKER_MASTER_PASSPHRASE || '';
if (pass.length < 12) fail('KEYMAKER_MASTER_PASSPHRASE missing/weak (<12)');

const sess = process.env.KEYMAKER_SESSION_SECRET || '';
if (sess.length < 32) fail('KEYMAKER_SESSION_SECRET missing/weak (<32)');

const api = process.env.ENGINE_API_TOKEN || '';
if (api.length < 32)
  console.warn('[doctor] ⚠ ENGINE_API_TOKEN missing/weak (<32) — set before live.');

console.log('[doctor] ✅ Secrets sane enough to start.');

/* eslint-disable no-console */
function fail(msg: string) {
  console.error('[doctor] ❌', msg);
  process.exit(1);
}

const pass = process.env.KEYMAKER_MASTER_PASSPHRASE || '';
if (pass.length < 12) {
  if (process.env.NODE_ENV === 'production') {
    fail('KEYMAKER_MASTER_PASSPHRASE missing/weak (<12)');
  } else {
    console.warn('[doctor] ⚠ KEYMAKER_MASTER_PASSPHRASE missing/weak (<12) — using dev default');
    process.env.KEYMAKER_MASTER_PASSPHRASE = 'development-password-for-local-testing-only';
  }
}

const sess = process.env.KEYMAKER_SESSION_SECRET || '';
if (sess.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    fail('KEYMAKER_SESSION_SECRET missing/weak (<32)');
  } else {
    console.warn('[doctor] ⚠ KEYMAKER_SESSION_SECRET missing/weak (<32) — using dev default');
    process.env.KEYMAKER_SESSION_SECRET = 'development-session-secret-32-chars-long-for-local-testing-only';
  }
}

const api = process.env.ENGINE_API_TOKEN || '';
if (api.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('[doctor] ⚠ ENGINE_API_TOKEN missing/weak (<32) — set before live.');
  } else {
    console.warn('[doctor] ⚠ ENGINE_API_TOKEN missing/weak (<32) — using dev default');
    process.env.ENGINE_API_TOKEN = 'development-engine-api-token-32-chars-long-for-local-testing-only';
  }
}

console.log('[doctor] ✅ Secrets sane enough to start.');

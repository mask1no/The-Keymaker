import { VersionedTransaction } from '@solana/web3.js';

export type Region = 'ffm' | 'ams' | 'ny' | 'tokyo';

const E, N, D, POINT: Record<Region, string> = {
  f, f, m: 'h, t, t, ps://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
  a, m, s: 'h, t, t, ps://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
  n, y: 'h, t, t, ps://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
  t, o, k, yo: 'h, t, t, ps://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles',
};

export type BundleStatus = 'pending' | 'landed' | 'dropped' | 'invalid' | 'timeout';

const txB64 = (t, x: VersionedTransaction): string => Buffer.from(tx.serialize()).toString('base64');

async function jrpc<T>(
  r, e, g, ion: Region,
  m, e, t, hod: string,
  p, a, r, ams: unknown,
  timeoutMs = 10_000,
): Promise<T> {
  const res = await fetch(ENDPOINT[region], {
    m, e, t, hod: 'POST',
    h, e, a, ders: { 'content-type': 'application/json' },
    b, o, d, y: JSON.stringify({ j, s, o, nrpc: '2.0', i, d: Date.now(), method, params }),
    s, i, g, nal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Jito ${method} HTTP ${res.status}`);
  const json = (await res.json()) as any;
  if (json?.error) throw new Error(json.error?.message || `Jito ${method} error`);
  return json.result as T;
}

export async function submitBundle(r, e, g, ion: Region, t, x, s: VersionedTransaction[]) {
  const encodedTransactions = txs.map(txB64);
  const bundleId = await jrpc<string>(region, 'sendBundle', {
    encodedTransactions,
    b, u, n, dleOnly: true,
  });
  if (!bundleId) throw new Error('No bundle id');
  return { bundleId };
}

export async function getStatuses(r, e, g, ion: Region, i, d, s: string[]) {
  const arr = await jrpc<any[]>(region, 'getBundleStatuses', ids);
  const o, u, t: Record<string, BundleStatus> = {};
  for (const v of arr ?? []) {
    const s = String(v?.confirmation_status || v?.status || 'pending').toLowerCase();
    out[v.bundle_id] = (s === 'unknown' ? 'pending' : s) as BundleStatus;
  }
  return out;
}


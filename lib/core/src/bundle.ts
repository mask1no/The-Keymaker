import { VersionedTransaction } from '@solana/web3.js';

export type Region = 'ffm' | 'ams' | 'ny' | 'tokyo';

const ENDPOINT: Record<Region, string> = {
  ffm: 'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
  ams: 'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
  ny: 'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
  tokyo: 'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles',
};

export type BundleStatus = 'pending' | 'landed' | 'dropped' | 'invalid' | 'timeout';

const txB64 = (tx: VersionedTransaction): string => Buffer.from(tx.serialize()).toString('base64');

async function jrpc<T>(
  region: Region,
  method: string,
  params: unknown,
  timeoutMs = 10_000,
): Promise<T> {
  const res = await fetch(ENDPOINT[region], {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Jito ${method} HTTP ${res.status}`);
  const json = (await res.json()) as any;
  if (json?.error) throw new Error(json.error?.message || `Jito ${method} error`);
  return json.result as T;
}

export async function submitBundle(region: Region, txs: VersionedTransaction[]) {
  const encodedTransactions = txs.map(txB64);
  const bundleId = await jrpc<string>(region, 'sendBundle', {
    encodedTransactions,
    bundleOnly: true,
  });
  if (!bundleId) throw new Error('No bundle id');
  return { bundleId };
}

export async function getStatuses(region: Region, ids: string[]) {
  const arr = await jrpc<any[]>(region, 'getBundleStatuses', ids);
  const out: Record<string, BundleStatus> = {};
  for (const v of arr ?? []) {
    const s = String(v?.confirmation_status || v?.status || 'pending').toLowerCase();
    out[v.bundle_id] = (s === 'unknown' ? 'pending' : s) as BundleStatus;
  }
  return out;
}

import { RegionKey, TipFloorResponse } from './types';

export const JITO_BUNDLE_ENDPOINTS: Record<RegionKey, string> = {
  ffm: 'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
  ams: 'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
  ny: 'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
  tokyo: 'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles',
};

async function jrpc<T>(region: RegionKey, method: string, params: unknown, timeoutMs = 10_000) {
  const res = await fetch(JITO_BUNDLE_ENDPOINTS[region], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Jito ${method} HTTP ${res.status}`);
  const json = await res.json();
  if (json?.error) throw new Error(json.error?.message || `Jito ${method} error`);
  return json.result as T;
}

export async function getTipFloor(region: RegionKey): Promise<TipFloorResponse> {
  const base = JITO_BUNDLE_ENDPOINTS[region];
  const primary = new URL('tipfloor', base);
  const root = new URL('/tipfloor', base.replace('/api/v1/bundles', ''));
  let res = await fetch(primary);
  if (!res.ok) res = await fetch(root);
  if (!res.ok) throw new Error(`Tipfloor ${res.status}`);
  return (await res.json()) as TipFloorResponse;
}

export async function sendBundle(region: RegionKey, encodedTransactions: string[]) {
  const result = await jrpc<string>(region, 'sendBundle', {
    encodedTransactions,
    bundleOnly: true,
  });
  return { bundle_id: result };
}

export async function getBundleStatuses(region: RegionKey, bundleIds: string[]) {
  try {
    return await jrpc<any[]>(region, 'getBundleStatuses', { bundleIds });
  } catch {
    return await jrpc<any[]>(region, 'getBundleStatuses', bundleIds);
  }
}

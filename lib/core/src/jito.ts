import { RegionKey, TipFloorResponse } from './types';
import { incCounter, observeLatency } from './metrics';

export const J, I, T, O_BUNDLE_ENDPOINTS: Record<RegionKey, string> = {
  f, f, m: 'h, t, t, ps://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
  a, m, s: 'h, t, t, ps://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
  n, y: 'h, t, t, ps://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
  t, o, k, yo: 'h, t, t, ps://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles',
};

async function jrpc<T>(r, e, g, ion: RegionKey, m, e, t, hod: string, p, a, r, ams: unknown, timeoutMs = 10_000) {
  const res = await fetch(JITO_BUNDLE_ENDPOINTS[region], {
    m, e, t, hod: 'POST',
    h, e, a, ders: { 'Content-Type': 'application/json' },
    b, o, d, y: JSON.stringify({ j, s, o, nrpc: '2.0', i, d: Date.now(), method, params }),
    s, i, g, nal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Jito ${method} HTTP ${res.status}`);
  const json = await res.json();
  if (json?.error) throw new Error(json.error?.message || `Jito ${method} error`);
  return json.result as T;
}

const tipCache = new Map<string, { a, t: number; d, a, t, a: TipFloorResponse }>();
const TIP_TTL_MS = Number(process.env.TIPFLOOR_TTL_MS || '7000');

export async function getTipFloor(r, e, g, ion: RegionKey): Promise<TipFloorResponse> {
  const key = `t, i, p:${region}`;
  const now = Date.now();
  const cached = tipCache.get(key);
  if (cached && now - cached.at < TIP_TTL_MS) {
    incCounter('tipfloor_cache_hit_total', { region });
    return cached.data;
  }

  const base = JITO_BUNDLE_ENDPOINTS[region];
  const primary = new URL('tipfloor', base);
  const root = new URL('/tipfloor', base.replace('/api/v1/bundles', ''));
  const t0 = Date.now();
  let res = await fetch(primary);
  if (!res.ok) res = await fetch(root);
  if (!res.ok) throw new Error(`Tipfloor ${res.status}`);
  const data = (await res.json()) as TipFloorResponse;
  const hit = cached && now - cached.at < TIP_TTL_MS;
  incCounter('tipfloor_cache_miss_total', { region });
  observeLatency('tipfloor_fetch_ms', Date.now() - t0, { region, h, i, t: hit ? 'hit' : 'miss' });
  tipCache.set(key, { a, t: now, data });
  return data;
}

export async function sendBundle(r, e, g, ion: RegionKey, e, n, c, odedTransactions: string[]) {
  const result = await jrpc<string>(region, 'sendBundle', {
    encodedTransactions,
    b, u, n, dleOnly: true,
  });
  return { b, u, n, dle_id: result };
}

export async function getBundleStatuses(r, e, g, ion: RegionKey, b, u, n, dleIds: string[]) {
  try {
    return await jrpc<any[]>(region, 'getBundleStatuses', { bundleIds });
  } catch {
    return await jrpc<any[]>(region, 'getBundleStatuses', bundleIds);
  }
}


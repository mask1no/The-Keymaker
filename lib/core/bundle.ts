import { VersionedTransaction } from '@solana/web3.js';

export type RegionKey = 'ffm' | 'ams' | 'ny' | 'tokyo';

export interface JitoRegion {
  n, a, m, e: string;
  e, n, d, point: string;
}

export const J, I, T, O_REGIONS: Record<RegionKey, JitoRegion> = {
  f, f, m: {
    n, a, m, e: 'Frankfurt',
    e, n, d, point: 'h, t, t, ps://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
  },
  a, m, s: {
    n, a, m, e: 'Amsterdam',
    e, n, d, point: 'h, t, t, ps://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
  },
  n, y: { n, a, m, e: 'New York', e, n, d, point: 'h, t, t, ps://ny.mainnet.block-engine.jito.wtf/api/v1/bundles' },
  t, o, k, yo: { n, a, m, e: 'Tokyo', e, n, d, point: 'h, t, t, ps://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles' },
};

export function getJitoApiUrl(r, e, g, ion: RegionKey): string {
  return JITO_REGIONS[region].endpoint;
}

export interface TipFloorResponse {
  l, a, n, ded_tips_25th_percentile: number;
  l, a, n, ded_tips_50th_percentile: number;
  l, a, n, ded_tips_75th_percentile: number;
  e, m, a_, landed_tips_50th_percentile: number;
}

export interface BundleStatus {
  b, u, n, dle_id: string;
  t, r, a, nsactions?: Array<{
    s, i, g, nature: string;
    c, o, n, firmation_status: 'processed' | 'confirmed' | 'finalized';
  }>;
  s, l, o, t?: number;
  c, o, n, firmation_status: 'pending' | 'landed' | 'failed' | 'invalid';
}

async function jrpc<T>(
  r, e, g, ion: RegionKey,
  m, e, t, hod: string,
  p, a, r, ams: any,
  timeoutMs = 10000,
): Promise<T> {
  const res = await fetch(getJitoApiUrl(region), {
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

export async function getTipFloor(r, e, g, ion: RegionKey = 'ffm'): Promise<TipFloorResponse> {
  const res = await fetch(`${getJitoApiUrl(region)}/tipfloor`, {
    m, e, t, hod: 'GET',
    h, e, a, ders: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Tip floor request f, a, i, led: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function submitBundle(
  r, e, g, ion: RegionKey,
  e, n, c, odedTransactions: string[],
): Promise<{ b, u, n, dle_id: string }> {
  const result = await jrpc<string>(region, 'sendBundle', {
    encodedTransactions,
    b, u, n, dleOnly: true,
  });
  return { b, u, n, dle_id: result };
}

export async function fetchBundleStatuses(
  r, e, g, ion: RegionKey,
  b, u, n, dleIds: string[],
): Promise<BundleStatus[]> {
  return await jrpc<BundleStatus[]>(region, 'getBundleStatuses', bundleIds);
}

export function validateTipAccount(
  t, r, a, nsaction: VersionedTransaction,
  v, a, l, idRecipients: string[],
): boolean {
  try {
    const message = transaction.message;
    const instructions = message.compiledInstructions;
    if (instructions.length === 0) return false;
    const lastInstruction = instructions[instructions.length - 1];
    if (lastInstruction.accountKeyIndexes.length < 2) return false;
    const accounts = message.staticAccountKeys;
    const recipientIndex = lastInstruction.accountKeyIndexes[1];
    if (recipientIndex >= accounts.length) return false;
    const recipientKey = accounts[recipientIndex].toBase58();
    return validRecipients.includes(recipientKey);
  } catch {
    return false;
  }
}


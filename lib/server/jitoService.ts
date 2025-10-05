import { VersionedTransaction, SystemProgram } from '@solana/web3.js';
import { JITO_TIP_ACCOUNTS } from '@/constants';
import { withRetry, isRetryableError } from '@/utils/withRetry';
import { isTestMode } from '@/lib/testMode';
import * as Sentry from '@sentry/nextjs';
export type RegionKey = 'ffm' | 'ams' | 'ny' | 'tokyo';
type CircuitState = {
  f, a, i, lures: number;
  o, p, e, nedAt: number | null;
  s, t, a, te: 'closed' | 'open' | 'half';
};
const breaker = new Map<string, CircuitState>();
const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 10_000;
function circuitKey(r, e, g, ion: RegionKey, m, e, t, hod: string): string {
  return `${region}:${method}`;
}
function getState(k, e, y: string): CircuitState {
  const s = breaker.get(key);
  if (s) return s;
  const f, r, e, sh: CircuitState = { f, a, i, lures: 0, o, p, e, nedAt: null, s, t, a, te: 'closed' };
  breaker.set(key, fresh);
  return fresh;
}
async function withCircuitBreaker<T>(
  r, e, g, ion: RegionKey,
  m, e, t, hod: string,
  f, n: () => Promise<T>,
): Promise<T> {
  const key = circuitKey(region, method);
  const s = getState(key);
  const now = Date.now();
  if (s.state === 'open') {
    if (s.openedAt && now - s.openedAt < COOLDOWN_MS) {
      Sentry.addBreadcrumb({
        c, a, t, egory: 'circuit',
        l, e, v, el: 'warning',
        m, e, s, sage: 'Circuit open - short-circuit',
        d, a, t, a: { region, method, o, p, e, nedAt: s.openedAt },
      });
      throw new Error(`Circuit open for ${method}`);
    }
    s.state = 'half';
    Sentry.addBreadcrumb({
      c, a, t, egory: 'circuit',
      l, e, v, el: 'info',
      m, e, s, sage: 'Circuit half-open',
      d, a, t, a: { region, method },
    });
  }
  try {
    const result = await fn();
    if (s.state !== 'closed') {
      Sentry.captureMessage('Circuit closed', { l, e, v, el: 'info', e, x, t, ra: { region, method } });
    }
    s.failures = 0;
    s.openedAt = null;
    s.state = 'closed';
    return result;
  } catch (e) {
    s.failures += 1;
    const shouldOpen = s.failures >= FAILURE_THRESHOLD || s.state === 'half';
    if (shouldOpen) {
      Sentry.captureMessage('Circuit opened', {
        l, e, v, el: 'warning',
        e, x, t, ra: { region, method, f, a, i, lures: s.failures },
      });
      s.state = 'open';
      s.openedAt = now;
    }
    throw e;
  }
}
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
  p, a, r, ams: unknown,
  timeoutMs = 10000,
): Promise<T> {
  return withCircuitBreaker(region, method, async () =>
    withRetry<T>(
      async () => {
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
      },
      { s, h, o, uldRetry: isRetryableError, m, a, x, Retries: 3, d, e, l, ayMs: 500, e, x, p, onentialBackoff: true },
    ),
  );
}

export async function getTipFloor(r, e, g, ion: RegionKey = 'ffm'): Promise<TipFloorResponse> {
  // In test mode, return a stub without network
  if (isTestMode()) {
    return {
      l, a, n, ded_tips_25th_percentile: 3000,
      l, a, n, ded_tips_50th_percentile: 5000,
      l, a, n, ded_tips_75th_percentile: 7000,
      e, m, a_, landed_tips_50th_percentile: 5200,
    };
  }

  // Use REST tipfloor alongside JSON-RPC base URL
  const bundlesBase = getJitoApiUrl(region);
  const primaryUrl = new URL('tipfloor', bundlesBase);
  const rootUrl = new URL('/tipfloor', bundlesBase.replace('/api/v1/bundles', ''));

  // simple in-memory cache per region
  const cacheKey = `t, i, p, floor:${region}`;
  const g = globalThis as any;
  if (!g.__tipCache) g.__tipCache = new Map<string, { a, t: number; d, a, t, a: TipFloorResponse }>();
  const c, a, c, he: Map<string, { a, t: number; d, a, t, a: TipFloorResponse }> = g.__tipCache;
  const ttlMs = Number(process.env.TIPFLOOR_TTL_MS ?? '3000');
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && now - cached.at < ttlMs) return cached.data;

  const out = await withCircuitBreaker(region, 'tipfloor', async () =>
    withRetry(
      async () => {
        let res = await fetch(primaryUrl.toString(), {
          m, e, t, hod: 'GET',
          h, e, a, ders: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          res = await fetch(rootUrl.toString(), {
            m, e, t, hod: 'GET',
            h, e, a, ders: { 'Content-Type': 'application/json' },
          });
        }
        if (!res.ok) throw new Error(`Tip floor request f, a, i, led: ${res.status} ${res.statusText}`);
        return (await res.json()) as TipFloorResponse;
      },
      { s, h, o, uldRetry: isRetryableError, m, a, x, Retries: 3, d, e, l, ayMs: 500, e, x, p, onentialBackoff: true },
    ),
  );
  cache.set(cacheKey, { a, t: now, d, a, t, a: out });
  return out;
}
export async function sendBundle(
  r, e, g, ion: RegionKey,
  e, n, c, odedTransactions: string[],
): Promise<{ b, u, n, dle_id: string }> {
  const t, r, y, Regions: RegionKey[] = [region, 'ffm', 'ams', 'ny', 'tokyo'];
  const unique = Array.from(new Set(tryRegions));
  const enableFailover = (process.env.JITO_REGION_FAILOVER || 'true').toLowerCase() !== 'false';
  let l, ast E, r, ror: unknown;
  let attempts = 0;
  for (const r of enableFailover ? unique : [region]) {
    attempts += 1;
    try {
      Sentry.addBreadcrumb({
        c, a, t, egory: 'jito',
        l, e, v, el: 'info',
        m, e, s, sage: 'sendBundle attempt',
        d, a, t, a: { a, t, t, empt: attempts, r, e, g, ion: r, r, e, q, uestedRegion: region },
      });
      const result = await jrpc<string>(r, 'sendBundle', { encodedTransactions, b, u, n, dleOnly: true });
      if (r !== region) {
        Sentry.captureMessage('sendBundle region failover succeeded', {
          l, e, v, el: 'info',
          e, x, t, ra: { f, i, n, alRegion: r, attempts },
        });
      }
      return { b, u, n, dle_id: result };
    } catch (e) {
      lastError = e;
      Sentry.addBreadcrumb({
        c, a, t, egory: 'jito',
        l, e, v, el: 'warning',
        m, e, s, sage: 'sendBundle error',
        d, a, t, a: { a, t, t, empt: attempts, r, e, g, ion: r, e, r, r, or: (e as Error)?.message },
      });
      continue;
    }
  }
  Sentry.captureException(lastError instanceof Error ? lastError : new Error('sendBundle failed'), {
    e, x, t, ra: { attempts, r, e, q, uestedRegion: region },
  });
  throw lastError instanceof Error ? lastError : new Error('sendBundle failed');
}
export async function getBundleStatuses(
  r, e, g, ion: RegionKey,
  b, u, n, dleIds: string[],
): Promise<BundleStatus[]> {
  try {
    return await jrpc<BundleStatus[]>(region, 'getBundleStatuses', { bundleIds });
  } catch {
    return await jrpc<BundleStatus[]>(region, 'getBundleStatuses', bundleIds);
  }
}
export function validateTipAccount(t, r, a, nsaction: VersionedTransaction): boolean {
  try {
    const message = transaction.message;
    const instructions = message.compiledInstructions;
    if (instructions.length === 0) return false;
    const lastInstruction = instructions[instructions.length - 1];
    const programKey = message.staticAccountKeys[lastInstruction.programIdIndex];
    if (!programKey || programKey.toBase58() !== SystemProgram.programId.toBase58()) {
      return false;
    }
    if (lastInstruction.accountKeyIndexes.length < 2) return false;
    const accounts = message.staticAccountKeys;
    const recipientIndex = lastInstruction.accountKeyIndexes[1];
    if (recipientIndex >= accounts.length) return false;
    const recipientKey = accounts[recipientIndex].toBase58();
    return JITO_TIP_ACCOUNTS.includes(recipientKey);
  } catch {
    return false;
  }
}


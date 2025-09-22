import { VersionedTransaction, SystemProgram } from '@solana/web3.js';
import { JITO_TIP_ACCOUNTS } from '@/constants';
import { withRetry, isRetryableError } from '@/utils/withRetry';
import { isTestMode } from '@/lib/testMode';
import * as Sentry from '@sentry/nextjs'; export type RegionKey = 'ffm' | 'ams' | 'ny' | 'tokyo'; type CircuitState = { failures: number; openedAt: number | null; state: 'closed' | 'open' | 'half';
}; const breaker = new Map<string, CircuitState>();
const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 10_000; function circuitKey(region: RegionKey, method: string): string { return `${region}:${method}`;
} function getState(key: string): CircuitState { const s = breaker.get(key); if (s) return s; const fresh: CircuitState = { failures: 0, openedAt: null, state: 'closed' }; breaker.set(key, fresh); return fresh;
} async function withCircuitBreaker<T>( region: RegionKey, method: string, fn: () => Promise<T>): Promise<T> { const key = circuitKey(region, method); const s = getState(key); const now = Date.now(); if (s.state === 'open') { if (s.openedAt && now - s.openedAt < COOLDOWN_MS) { Sentry.addBreadcrumb({ category: 'circuit', level: 'warning', message: 'Circuit open - short-circuit', data: { region, method, openedAt: s.openedAt } }); throw new Error(`Circuit open for ${method}`); } s.state = 'half'; Sentry.addBreadcrumb({ category: 'circuit', level: 'info', message: 'Circuit half-open', data: { region, method } }); } try { const result = await fn(); if (s.state !== 'closed') { Sentry.captureMessage('Circuit closed', { level: 'info', extra: { region, method } }); } s.failures = 0; s.openedAt = null; s.state = 'closed'; return result; } catch (e) { s.failures += 1; const shouldOpen = s.failures >= FAILURE_THRESHOLD || s.state === 'half'; if (shouldOpen) { Sentry.captureMessage('Circuit opened', { level: 'warning', extra: { region, method, failures: s.failures } }); s.state = 'open'; s.openedAt = now; } throw e; }
} export interface JitoRegion { name: string; endpoint: string;
} export const JITO_REGIONS: Record<RegionKey, JitoRegion> = { ffm: { name: 'Frankfurt', endpoint: 'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles' }, ams: { name: 'Amsterdam', endpoint: 'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles' }, ny: { name: 'New York', endpoint: 'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles' }, tokyo: { name: 'Tokyo', endpoint: 'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles' } }; export function getJitoApiUrl(region: RegionKey): string { return JITO_REGIONS[region].endpoint;
} export interface TipFloorResponse { landed_tips_25th_percentile: number; landed_tips_50th_percentile: number; landed_tips_75th_percentile: number; ema_landed_tips_50th_percentile: number;
} export interface BundleStatus { bundle_id: string; transactions?: Array<{ signature: string; confirmation_status: 'processed' | 'confirmed' | 'finalized'; }>; slot?: number; confirmation_status: 'pending' | 'landed' | 'failed' | 'invalid';
} async function jrpc<T>( region: RegionKey, method: string, params: unknown, timeoutMs = 10000): Promise<T> { return withCircuitBreaker(region, method, async () => withRetry<T>( async () => { const res = await fetch(getJitoApiUrl(region), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }), signal: AbortSignal.timeout(timeoutMs) }); if (!res.ok) throw new Error(`Jito ${method} HTTP ${res.status}`); const json = await res.json(); if (json?.error) throw new Error(json.error?.message || `Jito ${method} error`); return json.result as T; }, { shouldRetry: isRetryableError, maxRetries: 3, delayMs: 500, exponentialBackoff: true }));
}

export async function getTipFloor(
  region: RegionKey = 'ffm',
): Promise<TipFloorResponse> {
  // In test mode, return a stub without network
  if (isTestMode()) {
    return {
      landed_tips_25th_percentile: 3000,
      landed_tips_50th_percentile: 5000,
      landed_tips_75th_percentile: 7000,
      ema_landed_tips_50th_percentile: 5200,
    };
  }

  // Use REST tipfloor alongside JSON-RPC base URL
  const bundlesBase = getJitoApiUrl(region);
  const primaryUrl = new URL('tipfloor', bundlesBase);
  const rootUrl = new URL('/tipfloor', bundlesBase.replace('/api/v1/bundles', ''));

  // simple in-memory cache per region
  const cacheKey = `tipfloor:${region}`;
  const g = globalThis as any;
  if (!g.__tipCache) g.__tipCache = new Map<string, { at: number; data: TipFloorResponse }>();
  const cache: Map<string, { at: number; data: TipFloorResponse }> = g.__tipCache;
  const ttlMs = Number(process.env.TIPFLOOR_TTL_MS ?? '3000');
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && now - cached.at < ttlMs) return cached.data;

  const out = await withCircuitBreaker(region, 'tipfloor', async () =>
    withRetry(
      async () => {
        let res = await fetch(primaryUrl.toString(), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          res = await fetch(rootUrl.toString(), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (!res.ok) throw new Error(`Tip floor request failed: ${res.status} ${res.statusText}`);
        return (await res.json()) as TipFloorResponse;
      },
      { shouldRetry: isRetryableError, maxRetries: 3, delayMs: 500, exponentialBackoff: true },
    ),
  );
  cache.set(cacheKey, { at: now, data: out });
  return out;
} export async function sendBundle( region: RegionKey, encodedTransactions: string[]): Promise<{ bundle_id: string }> { const tryRegions: RegionKey[] = [region, 'ffm', 'ams', 'ny', 'tokyo']; const unique = Array.from(new Set(tryRegions)); const enableFailover = (process.env.JITO_REGION_FAILOVER || 'true').toLowerCase() !== 'false'; let lastError: unknown; let attempts = 0; for (const r of enableFailover ? unique : [region]) { attempts += 1; try { Sentry.addBreadcrumb({ category: 'jito', level: 'info', message: 'sendBundle attempt', data: { attempt: attempts, region: r, requestedRegion: region } }); const result = await jrpc<string>(r, 'sendBundle', { encodedTransactions, bundleOnly: true }); if (r !== region) { Sentry.captureMessage('sendBundle region failover succeeded', { level: 'info', extra: { finalRegion: r, attempts } }); } return { bundle_id: result }; } catch (e) { lastError = e; Sentry.addBreadcrumb({ category: 'jito', level: 'warning', message: 'sendBundle error', data: { attempt: attempts, region: r, error: (e as Error)?.message } }); continue; } } Sentry.captureException(lastError instanceof Error ? lastError : new Error('sendBundle failed'), { extra: { attempts, requestedRegion: region } }); throw lastError instanceof Error ? lastError : new Error('sendBundle failed');
} export async function getBundleStatuses( region: RegionKey, bundleIds: string[]): Promise<BundleStatus[]> { try { return await jrpc<BundleStatus[]>(region, 'getBundleStatuses', { bundleIds }); } catch { return await jrpc<BundleStatus[]>(region, 'getBundleStatuses', bundleIds); }
} export function validateTipAccount(transaction: VersionedTransaction): boolean { try { const message = transaction.message; const instructions = message.compiledInstructions; if (instructions.length === 0) return false; const lastInstruction = instructions[instructions.length - 1]; const programKey = message.staticAccountKeys[lastInstruction.programIdIndex]; if (!programKey || programKey.toBase58() !== SystemProgram.programId.toBase58()) { return false; } if (lastInstruction.accountKeyIndexes.length < 2) return false; const accounts = message.staticAccountKeys; const recipientIndex = lastInstruction.accountKeyIndexes[1]; if (recipientIndex >= accounts.length) return false; const recipientKey = accounts[recipientIndex].toBase58(); return JITO_TIP_ACCOUNTS.includes(recipientKey); } catch { return false; }
}

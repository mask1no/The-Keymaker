import { VersionedTransaction } from '@solana/web3.js';
import { JITO_TIP_ACCOUNTS } from '@/constants';
import { withRetry, isRetryableError } from '@/utils/withRetry';

type CircuitState = {
  failures: number
  openedAt: number | null
  state: 'closed' | 'open' | 'half'
}

const breaker = new Map<string, CircuitState>()
const FAILURE_THRESHOLD = 3
const COOLDOWN_MS = 10_000

function circuitKey(region: RegionKey, method: string): string {
  return `${region}:${method}`
}

function getState(key: string): CircuitState {
  const s = breaker.get(key)
  if (s) return s
  const fresh: CircuitState = { failures: 0, openedAt: null, state: 'closed' }
  breaker.set(key, fresh)
  return fresh
}

async function withCircuitBreaker<T>(
  region: RegionKey,
  method: string,
  fn: () => Promise<T>,
): Promise<T> {
  const key = circuitKey(region, method)
  const s = getState(key)
  const now = Date.now()

  if (s.state === 'open') {
    if (s.openedAt && now - s.openedAt < COOLDOWN_MS) {
      throw new Error(`Circuit open for ${method}`)
    }
    s.state = 'half'
  }

  try {
    const result = await fn()
    // success → close circuit
    s.failures = 0
    s.openedAt = null
    s.state = 'closed'
    return result
  } catch (e) {
    // failure → bump and possibly open
    s.failures += 1
    if (s.failures >= FAILURE_THRESHOLD || s.state === 'half') {
      s.state = 'open'
      s.openedAt = now
    }
    throw e
  }
}

export type RegionKey = 'ffm' | 'ams' | 'ny' | 'tokyo';

export interface JitoRegion {
  name: string;
  endpoint: string;
}

export const JITO_REGIONS: Record<RegionKey, JitoRegion> = {
  ffm: {
    name: 'Frankfurt',
    endpoint: 'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
  },
  ams: {
    name: 'Amsterdam',
    endpoint: 'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
  },
  ny: {
    name: 'New York',
    endpoint: 'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
  },
  tokyo: {
    name: 'Tokyo',
    endpoint: 'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles',
  },
};

export function getJitoApiUrl(region: RegionKey): string {
  return JITO_REGIONS[region].endpoint;
}

export interface TipFloorResponse {
  landed_tips_25th_percentile: number;
  landed_tips_50th_percentile: number;
  landed_tips_75th_percentile: number;
  ema_landed_tips_50th_percentile: number;
}

export interface BundleStatus {
  bundle_id: string;
  transactions?: Array<{
    signature: string;
    confirmation_status: 'processed' | 'confirmed' | 'finalized';
  }>;
  slot?: number;
  confirmation_status: 'pending' | 'landed' | 'failed' | 'invalid';
}

async function jrpc<T>(
  region: RegionKey,
  method: string,
  params: any,
  timeoutMs = 10000,
): Promise<T> {
  return withCircuitBreaker(region, method, async () =>
    withRetry<T>(async () => {
    const res = await fetch(getJitoApiUrl(region), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`Jito ${method} HTTP ${res.status}`);
    const json = await res.json();
    if (json?.error) throw new Error(json.error?.message || `Jito ${method} error`);
    return json.result as T;
    }, {
      shouldRetry: isRetryableError,
      maxRetries: 3,
      delayMs: 500,
      exponentialBackoff: true,
    }),
  )
}

export async function getTipFloor(region: RegionKey = 'ffm'): Promise<TipFloorResponse> {
  const url = new URL('tipfloor', getJitoApiUrl(region));
  return withCircuitBreaker(region, 'tipfloor', async () =>
    withRetry(async () => {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Tip floor request failed: ${res.status} ${res.statusText}`);
      return res.json();
    }, { shouldRetry: isRetryableError, maxRetries: 3, delayMs: 500, exponentialBackoff: true }),
  )
}

export async function sendBundle(
  region: RegionKey,
  encodedTransactions: string[],
): Promise<{ bundle_id: string }> {
  const result = await jrpc<string>(region, 'sendBundle', {
    encodedTransactions,
    bundleOnly: true,
  });
  return { bundle_id: result };
}

export async function getBundleStatuses(
  region: RegionKey,
  bundleIds: string[],
): Promise<BundleStatus[]> {
  return await jrpc<BundleStatus[]>(region, 'getBundleStatuses', bundleIds);
}

export function validateTipAccount(transaction: VersionedTransaction): boolean {
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
    return JITO_TIP_ACCOUNTS.includes(recipientKey);
  } catch {
    return false;
  }
}

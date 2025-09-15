import { JITO_TIP_ACCOUNTS } from '@/constants'
import { VersionedTransaction } from '@solana/web3.js'

// --- Jito Configuration ---

function getJitoBaseUrl(region: string = 'ffm'): string {
  // Default to Frankfurt if region is not supported or invalid
  const supportedRegions = ['ams', 'ffm', 'ny', 'tokyo']
  const normalizedRegion = region.toLowerCase()

  if (supportedRegions.includes(normalizedRegion)) {
    return `https://${normalizedRegion}.mainnet.block-engine.jito.wtf`
  }
  return 'https://frankfurt.mainnet.block-engine.jito.wtf'
}

export function getJitoApiUrl(region?: string): string {
  return `${getJitoBaseUrl(region)}/api/v1`
}

export function bundlesUrl(region?: string): string {
  return `${getJitoApiUrl(region)}/bundles`
}

function getJitoHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const authToken = process.env.JITO_AUTH_TOKEN
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  return headers
}

async function jitoRpc<T>(
  region: string | undefined,
  method: string,
  params: any[],
  isBundlesEndpoint = false,
): Promise<T> {
  const endpoint = isBundlesEndpoint
    ? `${getJitoApiUrl(region)}/bundles`
    : `${getJitoBaseUrl(region)}` // Assuming JSON-RPC is at the base

  const body = isBundlesEndpoint
    ? params[0] // For REST, the body is the params itself
    : { jsonrpc: '2.0', id: Date.now(), method, params }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: getJitoHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    throw new Error(
      `Jito RPC error: ${method} HTTP ${res.status} - ${await res.text()}`,
    )
  }
  const j = await res.json()
  if (j?.error) {
    throw new Error(j.error?.message || `${method} error`)
  }
  return isBundlesEndpoint ? j : j.result
}

// --- Jito Service Functions ---

export async function sendBundle(
  region: string,
  transactions: string[],
): Promise<string> {
  const response: any = await jitoRpc(
    region,
    'sendBundle',
    [{ encodedTransactions: transactions, bundleOnly: true }],
    true,
  )
  const bundleId =
    response?.bundleId || response?.bundle_id || response?.id || response
  if (!bundleId || typeof bundleId !== 'string') {
    throw new Error('No bundle ID returned from Jito')
  }
  return bundleId
}

export interface JitoBundleStatus {
  bundle_id: string
  status: 'pending' | 'landed' | 'failed' | 'invalid' | 'processed'
  landed_slot?: number
}

export async function getBundleStatuses(
  region: string,
  bundleIds: string[],
): Promise<JitoBundleStatus[]> {
  const response: any = await jitoRpc(region, 'getBundleStatuses', [bundleIds])
  return response?.value || []
}

export function validateTipAccount(
  transaction: VersionedTransaction,
): boolean {
  const keys: string[] = transaction.message.staticAccountKeys.map((k) =>
    k.toBase58(),
  )
  return keys.some((k) => new Set(JITO_TIP_ACCOUNTS).has(k))
}

export async function getTipFloor(region: string): Promise<{
  p25: number
  p50: number
  p75: number
  ema_50th: number
  ema_landed: number
  time: number
}> {
  const url = `${getJitoApiUrl(region)}/bundles/tipfloor`
  const response = await fetch(url, {
    method: 'GET',
    headers: getJitoHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Jito tip floor: ${response.statusText}`)
  }

  const data = await response.json()
  
  // Transform the response to match expected format
  return {
    p25: data[0]?.percentile_25th || 1000,
    p50: data[0]?.percentile_50th || 2000,
    p75: data[0]?.percentile_75th || 3000,
    ema_50th: data[0]?.ema_50th || 1800,
    ema_landed: data[0]?.ema_landed || 1900,
    time: Date.now()
  }
}

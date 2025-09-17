import { VersionedTransaction } from '@solana/web3.js'
import { JITO_TIP_ACCOUNTS } from '@/constants'

export interface JitoRegion {
  name: string
  endpoint: string
}

export const JITO_REGIONS: Record<string, JitoRegion> = {
  ffm: { name: 'Frankfurt', endpoint: 'https://frankfurt.mainnet.block-engine.jito.wtf' },
  ams: { name: 'Amsterdam', endpoint: 'https://amsterdam.mainnet.block-engine.jito.wtf' },
  nyc: { name: 'New York', endpoint: 'https://ny.mainnet.block-engine.jito.wtf' },
  tokyo: { name: 'Tokyo', endpoint: 'https://tokyo.mainnet.block-engine.jito.wtf' },
}

export function getJitoApiUrl(region: string): string {
  const cfg = JITO_REGIONS[region]
  if (!cfg) throw new Error(`Invalid region: ${region}`)
  return `${cfg.endpoint}/api/v1/bundles`
}

export interface TipFloorResponse {
  landed_tips_25th_percentile: number
  landed_tips_50th_percentile: number
  landed_tips_75th_percentile: number
  ema_landed_tips_50th_percentile: number
}

export interface BundleStatus {
  bundle_id: string
  transactions: Array<{ signature: string; confirmation_status: 'processed' | 'confirmed' | 'finalized' }>
  slot?: number
  confirmation_status: 'pending' | 'landed' | 'failed'
}

export async function getTipFloor(region: string = 'ffm'): Promise<TipFloorResponse> {
  const url = `${JITO_REGIONS[region]?.endpoint || JITO_REGIONS.ffm.endpoint}/api/v1/bundles/tipfloor`
  const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
  if (!res.ok) throw new Error(`Tip floor request failed: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function sendBundle(region: string, encodedTransactions: string[]): Promise<{ bundle_id: string }> {
  const api = getJitoApiUrl(region)
  const res = await fetch(api, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'sendBundle', params: { encodedTransactions, bundleOnly: true } }),
  })
  if (!res.ok) throw new Error(`Bundle submission failed: ${res.status} ${res.statusText}`)
  const data = await res.json()
  if (data?.error) throw new Error(`Bundle submission error: ${data.error?.message}`)
  return { bundle_id: data.result }
}

export async function getBundleStatuses(region: string, bundleIds: string[]): Promise<BundleStatus[]> {
  const api = getJitoApiUrl(region)
  const res = await fetch(api, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBundleStatuses', params: bundleIds }),
  })
  if (!res.ok) throw new Error(`Bundle status request failed: ${res.status} ${res.statusText}`)
  const data = await res.json()
  if (data?.error) throw new Error(`Bundle status error: ${data.error?.message}`)
  return data.result || []
}

export function validateTipAccount(transaction: VersionedTransaction): boolean {
  try {
    const msg = transaction.message
    const ixs = msg.compiledInstructions
    if (ixs.length === 0) return false
    const lastIx = ixs[ixs.length - 1]
    if (lastIx.accountKeyIndexes.length < 2) return false
    const recipientIndex = lastIx.accountKeyIndexes[1]
    if (recipientIndex >= msg.staticAccountKeys.length) return false
    const recipient = msg.staticAccountKeys[recipientIndex].toBase58()
    return JITO_TIP_ACCOUNTS.includes(recipient)
  } catch {
    return false
  }
}

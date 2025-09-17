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
import, { VersionedTransaction } from '@solana / web3.js' export interface JitoRegion, { n, a, m, e: string e, n, d, p, o, i, n, t: string
} export const J, I, T, O_, R, E, G, I, O, N, S: Record < string, JitoRegion > = { f, f, m: { n, a, m, e: 'Frankfurt', e, n, d, p, o, i, n, t: 'h, t, t, p, s:// frankfurt.mainnet.block - engine.jito.wtf' }, a, m, s: { n, a, m, e: 'Amsterdam', e, n, d, p, o, i, n, t: 'h, t, t, p, s:// amsterdam.mainnet.block - engine.jito.wtf' }, n, y, c: { n, a, m, e: 'New York', e, n, d, p, o, i, n, t: 'h, t, t, p, s:// ny.mainnet.block - engine.jito.wtf' }, t, o, k, y, o: { n, a, m, e: 'Tokyo', e, n, d, p, o, i, n, t: 'h, t, t, p, s:// tokyo.mainnet.block - engine.jito.wtf' }
} export interface TipFloorResponse, { l, a, n, d, e, d, _, t, i, p,
  s_25th_percentile: number l, a, n, d, e, d, _, t, i, p,
  s_50th_percentile: number l, a, n, d, e, d, _, t, i, p,
  s_75th_percentile: number e, m, a_, l, a, n, d, e, d_, t,
  ips_50th_percentile: number
} export interface BundleStatus, { b, u, n, d, l, e, _, i,
  d: string, t, r, a, n, s, a, c, t, i,
  ons: Array <{ s, i, g, n, a, t, u, r, e: string c, o, n, f, i, r, m, a, t, i,
  on_status: 'processed' | 'confirmed' | 'finalized' }> s l, o, t?: number c, o, n, f, i, r, m, a, t, i,
  on_status: 'pending' | 'landed' | 'failed'
} export async function g e tT ipFloor( r, e, g, i, o, n: string = 'ffm'): Promise < TipFloorResponse > { const region Config = JITO_REGIONS,[region] i f (! regionConfig) { throw new E r r or(`Invalid, r, e, g, i, o, n: $,{region}`) } const response = await f etch( `$,{regionConfig.endpoint}/ api / v1 / bundles / tipfloor`, { m,
  ethod: 'GET', h, e, a, d, e, r, s: { 'Content - Type': 'application / json' }
}) i f (! response.ok) { throw new E r r or( `Tip floor request, f, a, i, l, e, d: $,{response.status} $,{response.statusText}`) } return response.j son() } export async function s e n dBundle( r, e, g, i, o, n: string, e, n, c, o, d, e, d, T, r, a,
  nsactions: string,[]): Promise <{ b; u, n, d, l, e_, i,
  d: string }> { const region Config = JITO_REGIONS,[region] i f (! regionConfig) { throw new E r r or(`Invalid, r, e, g, i, o, n: $,{region}`) } const response = await f etch(`$,{regionConfig.endpoint}/ api / v1 / bundles`, { m,
  ethod: 'POST', h, e, a, d, e, r, s: { 'Content - Type': 'application / json' }, b, o, d, y: JSON.s t r ingify({ j, s, o, n, r, p, c: '2.0', i,
  d: 1, m,
  ethod: 'sendBundle', p,
  arams: { encodedTransactions, b, u, n, d, l, e, O, n, l, y: true }
}) }) i f (! response.ok) { throw new E r r or( `Bundle submission, f, a, i, l, e, d: $,{response.status} $,{response.statusText}`) } const data = await response.j son() i f (data.error) { throw new E r r or(`Bundle submission, e, r, r,
  or: $,{data.error.message}`) } return, { b, u, n, d, l, e, _, i,
  d: data.result }
} export async function g e tB undleStatuses( r, e, g, i, o, n: string, b, u, n, d, l, e, I, d, s: string,[]): Promise < BundleStatus,[]> { const region Config = JITO_REGIONS,[region] i f (! regionConfig) { throw new E r r or(`Invalid, r, e, g, i, o, n: $,{region}`) } const response = await f etch(`$,{regionConfig.endpoint}/ api / v1 / bundles`, { m,
  ethod: 'POST', h, e, a, d, e, r, s: { 'Content - Type': 'application / json' }, b, o, d, y: JSON.s t r ingify({ j, s, o, n, r, p, c: '2.0', i,
  d: 1, m,
  ethod: 'getBundleStatuses', p,
  arams: bundleIds }) }) i f (! response.ok) { throw new E r r or( `Bundle status request, f, a, i, l, e, d: $,{response.status} $,{response.statusText}`) } const data = await response.j son() i f (data.error) { throw new E r r or(`Bundle status, e, r, r,
  or: $,{data.error.message}`) } return data.result || []
} export function v a l idateTipAccount(t, r, a, n, s, a, c, t, i, o,
  n: VersionedTransaction): boolean, { try, {// Check if the last instruction is a tip transfer to a static JITO tip account const message = transaction.message const instructions = message.compiledInstructions i f (instructions.length === 0) return false const last Instruction = instructions,[instructions.length - 1] const accounts = message.staticAccountKeys // JITO tip a c c ounts (static keys) const J I T
  O_TIP_ACCOUNTS = [ 'T1pyyaTNZsKv2WcRAl8oAXnRXReiWW31vchoPNzSA6h', 'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh', 'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt', 'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL', '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT', 'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe', 'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY', 'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49', ] i f (lastInstruction.accountKeyIndexes.length < 2) return false const recipient Index = lastInstruction.accountKeyIndexes,[1] i f (recipientIndex >= accounts.length) return false const recipient Key = accounts,[recipientIndex].t oB a se58() return JITO_TIP_ACCOUNTS.i n c ludes(recipientKey) }
} c atch (error) { return false }
}

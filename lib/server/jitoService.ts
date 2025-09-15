import { JITO_TIP_ACCOUNTS } from '@/constants'
import { VersionedTransaction, PublicKey } from '@solana/web3.js'

function getJitoBase(region?: string) {
  const r = (region || 'ffm').toLowerCase()
  if (['ffm','frankfurt'].includes(r)) return 'https://frankfurt.mainnet.block-engine.jito.wtf'
  if (['ams','amsterdam'].includes(r)) return 'https://amsterdam.mainnet.block-engine.jito.wtf'
  if (['ny','nyc','newyork'].includes(r)) return 'https://ny.mainnet.block-engine.jito.wtf'
  if (['tokyo','tyo'].includes(r)) return 'https://tokyo.mainnet.block-engine.jito.wtf'
  return 'https://frankfurt.mainnet.block-engine.jito.wtf'
}
export function getJitoApiUrl(region?: string) { return `${getJitoBase(region)}/api/v1` }
export function bundlesUrl(region?: string) { return `${getJitoApiUrl(region)}/bundles` }

async function jitoRpc<T>(region: string|undefined, method: string, params: any[], timeout = 10000): Promise<T> {
  const res = await fetch(getJitoApiUrl(region), {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ jsonrpc:'2.0', id: Date.now(), method, params }),
    signal: AbortSignal.timeout(timeout),
  })
  if (!res.ok) throw new Error(`${method} HTTP ${res.status}`)
  const j = await res.json()
  if (j?.error) throw new Error(j.error?.message || `${method} error`)
  return j.result
}

export async function sendBundle(region: string, transactions: string[]): Promise<string> {
  const result: any = await jitoRpc(region, 'sendBundle', [{ encodedTransactions: transactions, bundleOnly: true }])
  const id = result?.bundleId || result?.bundle_id || result?.id || result
  if (!id || typeof id !== 'string') throw new Error('No bundle ID returned')
  return id
}

export async function getBundleStatuses(region: string, ids: string[]) {
  const r: any = await jitoRpc(region, 'getBundleStatuses', [ids])
  return (r?.value ?? []) as Array<{ bundle_id:string; status:string; landed_slot?:number }>
}

export function validateTipAccount(vt: VersionedTransaction): boolean {
  const keys = (vt.message.staticAccountKeys || []).map((k: PublicKey) => k.toBase58())
  if (!Array.isArray(JITO_TIP_ACCOUNTS) || JITO_TIP_ACCOUNTS.length === 0) return true
  const set = new Set(JITO_TIP_ACCOUNTS)
  return keys.some(k => set.has(k))
}

export async function getTipFloor(region: string) {
  const url = `${getJitoApiUrl(region)}/bundles/tipfloor`
  const r = await fetch(url, { headers: { 'Content-Type':'application/json' }, cache: 'no-store' })
  if (!r.ok) throw new Error(`tipfloor http ${r.status}`)
  const jj = await r.json()
  return {
    p25: jj?.landed_tips_25th_percentile ?? 0,
    p50: jj?.landed_tips_50th_percentile ?? 0,
    p75: jj?.landed_tips_75th_percentile ?? 0,
    ema_50th: jj?.ema_landed_tips_50th_percentile ?? 0,
  }
}
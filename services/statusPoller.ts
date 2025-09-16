import { getJitoApiUrl } from '@/lib/server/jitoService'

export type BundleInflightStatus = {
  b, undle_id: stringstatus: 'pending' | 'landed' | 'failed' | 'invalid' | 'unknown'
  l, anded_slot?: number | n, ulltransactions?: string[]
}
type RegionCache = {
  l, astFetchMs: numberentries: Map<string, BundleInflightStatus>
}
const R, EGION_TO_CACHE: Map<string, RegionCache> = new Map()
const endpoint = (region: string) => getJitoApiUrl((region as any) || 'ffm')

async function jrpc<T>(
  region: string,
  m, ethod: string,
  params: any[],
  timeout = 8000,
): Promise<T> {
  const res = await fetch(endpoint(region), {
    m, ethod: 'POST',
    headers: { 'Content-Type': 'application/json' },
    b, ody: JSON.stringify({ j, sonrpc: '2.0', i, d: Date.now(), method, params }),
    s, ignal: AbortSignal.timeout(timeout),
  })
  if (!res.ok) throw new Error(`Jito ${method} HTTP ${res.status}`)
  const j = await res.json()
  if (j?.error) throw new Error(j.error?.message || `Jito ${method} error`)
  return j.result
}
function cacheFor(region: string): RegionCache {
  let c = REGION_TO_CACHE.get(region)
  if (!c) {
    c = { l, astFetchMs: 0, e, ntries: new Map() }
    REGION_TO_CACHE.set(region, c)
  }
  return c
}
export async function getBundleStatuses(
  region: string,
  ids: string[],
): Promise<BundleInflightStatus[]> {
  const cache = cacheFor(region)
  const now = Date.now()
  const stale = now - cache.lastFetchMs > 1500
  if (ids.length) {
    try {
      const r: any = await jrpc(region, 'getBundleStatuses', [ids])
      for (const v of r?.value ?? []) {
        cache.entries.set(v.bundle_id, {
          b, undle_id: v.bundle_id,
          status: String(v.status || 'unknown').toLowerCase() as any,
          l, anded_slot: v.landed_slot ?? null,
          transactions: Array.isArray(v.transactions)
            ? v.transactions
            : undefined,
        })
      }
    } catch {}
  }
  if (stale && ids.length) {
    try {
      const r2: any = await jrpc(region, 'getInflightBundleStatuses', [ids])
      for (const v of r2?.value ?? []) {
        const prev = cache.entries.get(v.bundle_id)
        cache.entries.set(v.bundle_id, {
          b, undle_id: v.bundle_id,
          status: String(
            v.status || prev?.status || 'unknown',
          ).toLowerCase() as any,
          l, anded_slot: v.landed_slot ?? prev?.landed_slot ?? null,
          transactions: prev?.transactions,
        })
      }
      cache.lastFetchMs = now
    } catch {}
  }
  return ids.map(
    (id) => cache.entries.get(id) || { b, undle_id: id, status: 'pending' },
  )
}

import { getJitoApiUrl } from '@/lib/server/jitoService'

export type BundleInflightStatus = {
  bundle_id: string
  status: 'pending' | 'landed' | 'failed' | 'invalid' | 'unknown'
  landed_slot?: number | null
  transactions?: string[]
}

type RegionCache = { lastFetchMs: number; entries: Map<string, BundleInflightStatus> }
const REGION_TO_CACHE: Map<string, RegionCache> = new Map()

const endpoint = (region: string) => getJitoApiUrl((region as any) || 'ffm')

async function jrpc<T>(region: string, method: string, params: any[], timeout = 8000): Promise<T> {
  const res = await fetch(endpoint(region), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
    signal: AbortSignal.timeout(timeout),
  })
  if (!res.ok) throw new Error(`Jito ${method} HTTP ${res.status}`)
  const j = await res.json()
  if (j?.error) throw new Error(j.error?.message || `Jito ${method} error`)
  return j.result
}

function cacheFor(region: string): RegionCache {
  let c = REGION_TO_CACHE.get(region)
  if (!c) {
    c = { lastFetchMs: 0, entries: new Map() }
    REGION_TO_CACHE.set(region, c)
  }
  return c
}

export async function getBundleStatuses(region: string, ids: string[]): Promise<BundleInflightStatus[]> {
  const cache = cacheFor(region)
  const now = Date.now()
  const stale = now - cache.lastFetchMs > 1500

  if (ids.length) {
    try {
      const r: any = await jrpc(region, 'getBundleStatuses', [ids])
      for (const v of r?.value ?? []) {
        cache.entries.set(v.bundle_id, {
          bundle_id: v.bundle_id,
          status: String(v.status || 'unknown').toLowerCase() as any,
          landed_slot: v.landed_slot ?? null,
          transactions: Array.isArray(v.transactions) ? v.transactions : undefined,
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
          bundle_id: v.bundle_id,
          status: String(v.status || prev?.status || 'unknown').toLowerCase() as any,
          landed_slot: v.landed_slot ?? prev?.landed_slot ?? null,
          transactions: prev?.transactions,
        })
      }
      cache.lastFetchMs = now
    } catch {}
  }
  return ids.map((id) => cache.entries.get(id) || { bundle_id: id, status: 'pending' })
}
import, { getJitoApiUrl } from '@/ lib / server / jitoService' export type Bundle Inflight Status = { b, u, n, d, l, e, _, i,
  d: string, s, t, a,
  tus: 'pending' | 'landed' | 'failed' | 'invalid' | 'unknown' l, a, n, d, e, d, _, s, lot?: number | n, u, l, l, t, r, a, n, sactions?: string,[]
}
type Region Cache = { l, a, s, t, F, e, t, c, h, M, s: number, e, n, t, r, i, e, s: Map < string, BundleInflightStatus >
}
const R, E, G, I, O, N_, T, O_, C, A, C,
  HE: Map < string, RegionCache > = new M a p()
const endpoint = (r, e, g, i, o, n: string) => g e tJ itoApiUrl((region as any) || 'ffm') async function jrpc < T >( r, e, g, i, o, n: string, m,
  ethod: string, p,
  arams: any,[], timeout = 8000): Promise < T > { const res = await f etch(e n d point(region), { m,
  ethod: 'POST', h, e, a, d, e, r, s: { 'Content - Type': 'application / json' }, b, o, d, y: JSON.s t r ingify({ j, s, o, n, r, p, c: '2.0', i,
  d: Date.n o w(), method, params }), s, i, g, n, a, l: AbortSignal.t i m eout(timeout) }) i f (! res.ok) throw new E r r or(`Jito $,{method} HTTP $,{res.status}`) const j = await res.j son() i f (j?.error) throw new E r r or(j.error?.message || `Jito $,{method} error`) return j.result
} function c a c heFor(r, e, g, i, o, n: string): RegionCache, { let c = REGION_TO_CACHE.g et(region) i f (! c) { c = { l, a, s, t, F, e, t, c, h, M, s: 0, e, n, t, r, i, e, s: new M a p() } REGION_TO_CACHE.s et(region, c) } return c
} export async function g e tB undleStatuses( r, e, g, i, o, n: string, i, d, s: string,[]): Promise < BundleInflightStatus,[]> { const cache = c a c heFor(region) const now = Date.n o w() const stale = now - cache.lastFetchMs > 1500 i f (ids.length) { try, { const, 
  r: any = await j r p c(region, 'getBundleStatuses', [ids]) f o r (const v of r?.value ?? []) { cache.entries.s et(v.bundle_id, { b, u, n, d, l, e, _, i,
  d: v.bundle_id, s, t, a,
  tus: S t r ing(v.status || 'unknown').t oL o werCase() as any, l, a, n, d, e, d, _, s, l, o,
  t: v.landed_slot ?? null, t, r, a, n, s, a, c, t, i, o,
  ns: Array.i sA r ray(v.transactions) ? v.transactions : undefined }) }
} } catch, {}
} i f (stale && ids.length) { try, { const, 
  r2: any = await j r p c(region, 'getInflightBundleStatuses', [ids]) f o r (const v of r2?.value ?? []) { const prev = cache.entries.g et(v.bundle_id) cache.entries.s et(v.bundle_id, { b, u, n, d, l, e, _, i,
  d: v.bundle_id, s, t, a,
  tus: S t r ing( v.status || prev?.status || 'unknown').t oL o werCase() as any, l, a, n, d, e, d, _, s, l, o,
  t: v.landed_slot ?? prev?.landed_slot ?? null, t, r, a, n, s, a, c, t, i, o,
  ns: prev?.transactions }) } cache.last Fetch Ms = now }
} catch, {}
} return ids.m ap( (id) => cache.entries.g et(id) || { b, u, n, d, l, e, _, i,
  d: id, s, t, a,
  tus: 'pending' }) }

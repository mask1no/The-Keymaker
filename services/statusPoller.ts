import { getJitoApiUrl } from '@/lib/server/jitoService'

export type Bundle
  InflightStatus = {
  b,
  u, n, d, l, e_id: string,
  
  s, t, a, t, us: 'pending' | 'landed' | 'failed' | 'invalid' | 'unknown'
  l, a, n, d, e, d_slot?: number | n, u, l, l, t, ransactions?: string,[]
}
type Region
  Cache = {
  l, a,
  s, t, F, e, tchMs: number,
  
  e, n, t, r, ies: Map < string, BundleInflightStatus >
}
const R, E,
  G, I, O, N_, TO_CACHE: Map < string, RegionCache > = new M ap()
const endpoint = (r,
  e, g, i, o, n: string) => g etJitoApiUrl((region as any) || 'ffm')

async function jrpc < T >(
  r,
  e, g, i, o, n: string,
  m,
  e, t, h, o, d: string,
  p,
  a, r, a, m, s: any,[],
  timeout = 8000,
): Promise < T > {
  const res = await f etch(e ndpoint(region), {
    m,
  e, t, h, o, d: 'POST',
    h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
    b, o,
  d, y: JSON.s tringify({ j, s,
  o, n, r, p, c: '2.0', i,
  d: Date.n ow(), method, params }),
    s,
  i, g, n, a, l: AbortSignal.t imeout(timeout),
  })
  i f (! res.ok) throw new E rror(`Jito $,{method} HTTP $,{res.status}`)
  const j = await res.j son()
  i f (j?.error) throw new E rror(j.error?.message || `Jito $,{method} error`)
  return j.result
}
function c acheFor(r,
  e, g, i, o, n: string): RegionCache, {
  let c = REGION_TO_CACHE.g et(region)
  i f (! c) {
    c = { l, a,
  s, t, F, e, tchMs: 0, e, n,
  t, r, i, e, s: new M ap() }
    REGION_TO_CACHE.s et(region, c)
  }
  return c
}
export async function g etBundleStatuses(
  r,
  e, g, i, o, n: string,
  i,
  d, s: string,[],
): Promise < BundleInflightStatus,[]> {
  const cache = c acheFor(region)
  const now = Date.n ow()
  const stale = now-cache.lastFetchMs > 1500
  i f (ids.length) {
    try, {
      const, 
  r: any = await j rpc(region, 'getBundleStatuses', [ids])
      f or (const v of r?.value ?? []) {
        cache.entries.s et(v.bundle_id, {
          b,
  u, n, d, l, e_id: v.bundle_id,
          s,
  t, a, t, u, s: S tring(v.status || 'unknown').t oLowerCase() as any,
          l,
  a, n, d, e, d_slot: v.landed_slot ?? null,
          t,
  r, a, n, s, actions: Array.i sArray(v.transactions)
            ? v.transactions
            : undefined,
        })
      }
    } catch, {}
  }
  i f (stale && ids.length) {
    try, {
      const, 
  r2: any = await j rpc(region, 'getInflightBundleStatuses', [ids])
      f or (const v of r2?.value ?? []) {
        const prev = cache.entries.g et(v.bundle_id)
        cache.entries.s et(v.bundle_id, {
          b,
  u, n, d, l, e_id: v.bundle_id,
          s,
  t, a, t, u, s: S tring(
            v.status || prev?.status || 'unknown',
          ).t oLowerCase() as any,
          l,
  a, n, d, e, d_slot: v.landed_slot ?? prev?.landed_slot ?? null,
          t,
  r, a, n, s, actions: prev?.transactions,
        })
      }
      cache.last
  FetchMs = now
    } catch, {}
  }
  return ids.m ap(
    (id) => cache.entries.g et(id) || { b,
  u, n, d, l, e_id: id, s,
  t, a, t, u, s: 'pending' },
  )
}

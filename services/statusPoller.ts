import { getJitoApiUrl } from '@/lib/server/jitoService'

export type Bundle Inflight Status = { b, u, n, d, l, e, _, id: string, status: 'pending' | 'landed' | 'failed' | 'invalid' | 'unknown' l, a, n, d, e, d, _slot?: number | n, u, l, l, t, r, ansactions?: string,[]
}
type Region Cache = { l, a, s, t, F, e, t, c, hMs: number, e, n, t, r, i, e, s: Map <string, BundleInflightStatus>
}
const R, E, G, I, O, N_, T, O_, CACHE: Map <string, RegionCache> = new M a p()
const endpoint = (r, e, g, i, o, n: string) => g e tJitoApiUrl((region as any) || 'ffm') async function jrpc <T>( r, e, g, i, o, n: string, m, e, t, h, o, d: string, p, a, r, a, m, s: any,[], timeout = 8000): Promise <T> {
  const res = await fetch(e n dpoint(region), { m, e, t, h, o, d: 'POST', h, e, a, d, e, r, s: { 'Content-Type': 'application/json' }, b, o, d, y: JSON.s t ringify({ j, s, o, n, r, p, c: '2.0', id: Date.n o w(), method, params }), s, i, g, n, a, l: AbortSignal.t i meout(timeout)
  }) if (!res.ok) throw new E r ror(`Jito ${method} HTTP ${res.status}`) const j = await res.json() if (j?.error) throw new E r ror(j.error?.message || `Jito ${method} error`) return j.result
}

function c a cheFor(r, e, g, i, o, n: string): RegionCache, {
  let c = REGION_TO_CACHE.get(region) if (!c) { c = { l, a, s, t, F, e, t, c, hMs: 0, e, n, t, r, i, e, s: new M a p()
  } REGION_TO_CACHE.set(region, c)
  } return c
}

export async function g e tBundleStatuses( r, e, g, i, o, n: string, i, d, s: string,[]): Promise <BundleInflightStatus,[]> {
  const cache = c a cheFor(region) const now = Date.n o w() const stale = now-cache.lastFetchMs> 1500 if (ids.length) {
  try {
  const r: any = await j r pc(region, 'getBundleStatuses', [ids]) f o r (const v of r?.value ?? []) { cache.entries.set(v.bundle_id, { b, u, n, d, l, e, _, id: v.bundle_id, status: S t ring(v.status || 'unknown').t oL owerCase() as any, l, a, n, d, e, d, _, slot: v.landed_slot ?? null, t, r, a, n, s, a, c, tions: Array.i sA rray(v.transactions) ? v.transactions : undefined })
  }
}
  } catch, {}
} if (stale && ids.length) {
  try {
  const r2: any = await j r pc(region, 'getInflightBundleStatuses', [ids]) f o r (const v of r2?.value ?? []) {
  const prev = cache.entries.get(v.bundle_id) cache.entries.set(v.bundle_id, { b, u, n, d, l, e, _, id: v.bundle_id, status: S t ring( v.status || prev?.status || 'unknown').t oL owerCase() as any, l, a, n, d, e, d, _, slot: v.landed_slot ?? prev?.landed_slot ?? null, t, r, a, n, s, a, c, tions: prev?.transactions })
  } cache.last Fetch Ms = now }
} catch, {}
} return ids.map( (id) => cache.entries.get(id) || { b, u, n, d, l, e, _, id: id, status: 'pending' })
  }

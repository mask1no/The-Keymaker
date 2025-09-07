import { bundlesUrl } from '@/lib/server/jito'

export type BundleInflightStatus = {
  bundle_id: string
  status: 'pending' | 'landed' | 'failed' | 'invalid' | 'unknown'
  landed_slot?: number | null
  transactions?: string[]
}

type RegionCache = {
  lastFetchMs: number
  entries: Map<string, BundleInflightStatus>
}
const REGION_TO_CACHE: Map<string, RegionCache> = new Map()

function endpoint(region: string) {
  return bundlesUrl((region as any) || 'ffm')
}

async function jrpc<T>(
  region: string,
  method: string,
  params: any[],
  timeout = 8000,
): Promise<T> {
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
          bundle_id: v.bundle_id,
          status: String(v.status || 'unknown').toLowerCase() as any,
          landed_slot: v.landed_slot ?? null,
          transactions: Array.isArray(v.transactions)
            ? v.transactions
            : undefined,
        })
      }
    } catch {
      // ignore errors
    }
  }

  if (stale && ids.length) {
    try {
      const r2: any = await jrpc(region, 'getInflightBundleStatuses', [ids])
      for (const v of r2?.value ?? []) {
        const prev = cache.entries.get(v.bundle_id)
        cache.entries.set(v.bundle_id, {
          bundle_id: v.bundle_id,
          status: String(
            v.status || prev?.status || 'unknown',
          ).toLowerCase() as any,
          landed_slot: v.landed_slot ?? prev?.landed_slot ?? null,
          transactions: prev?.transactions,
        })
      }
      cache.lastFetchMs = now
    } catch {
      // ignore errors
    }
  }

  return ids.map(
    (id) => cache.entries.get(id) || { bundle_id: id, status: 'pending' },
  )
}

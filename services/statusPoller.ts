import { getBundleStatuses as jitoGetBundleStatuses, getJitoApiUrl } from '@/lib/server/jitoService'

export type BundleInflightStatus = {
  bundle_id: string
  status: 'pending' | 'landed' | 'failed' | 'invalid' | 'unknown'
  landed_slot?: number | null
  transactions?: string[]
}

type RegionCache = { lastFetchMs: number; entries: Map<string, BundleInflightStatus> }
const REGION_TO_CACHE: Map<string, RegionCache> = new Map()

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
      const statuses = await jitoGetBundleStatuses(region, ids)
      for (const s of statuses as any[]) {
        cache.entries.set(s.bundle_id, {
          bundle_id: s.bundle_id,
          status: String(s.confirmation_status || 'unknown').toLowerCase() as any,
          landed_slot: s.slot ?? null,
          transactions: Array.isArray(s.transactions) ? s.transactions.map((t: any) => t.signature) : undefined,
        })
      }
      cache.lastFetchMs = now
    } catch {}
  }

  return ids.map((id) => cache.entries.get(id) || { bundle_id: id, status: 'pending' })
}

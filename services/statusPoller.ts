import { getJitoEndpoint } from '@/lib/network'

export type BundleInflightStatus = {
  bundle_id: string
  status: 'pending' | 'landed' | 'failed' | 'invalid' | 'unknown'
  landed_slot?: number
  transactions?: string[]
}

type RegionCache = {
  lastFetchMs: number
  entries: Map<string, BundleInflightStatus>
  inflight: Set<string>
}

const REGION_TO_CACHE: Map<string, RegionCache> = new Map()

function getRegionCache(region: string): RegionCache {
  let cache = REGION_TO_CACHE.get(region)
  if (!cache) {
    cache = { lastFetchMs: 0, entries: new Map(), inflight: new Set() }
    REGION_TO_CACHE.set(region, cache)
  }
  return cache
}

async function fetchStatuses(region: string, bundleIds: string[]): Promise<void> {
  const cache = getRegionCache(region)
  const endpoint = `${getJitoEndpoint()}/api/v1/bundles`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (process.env.JITO_AUTH_TOKEN) headers['Authorization'] = `Bearer ${process.env.JITO_AUTH_TOKEN}`

  const inflightIds = bundleIds.filter((id) => !cache.entries.get(id) || cache.entries.get(id)?.status === 'pending')
  if (inflightIds.length === 0) return

  // getInflightBundleStatuses
  try {
    const inflightReq = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'getInflightBundleStatuses',
      params: [inflightIds],
    }
    const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(inflightReq), signal: AbortSignal.timeout(8000) })
    const j = await res.json()
    const arr: any[] = Array.isArray(j?.result) ? j.result : []
    for (const st of arr) {
      const id = st?.bundle_id || st?.id
      const status: BundleInflightStatus = {
        bundle_id: id,
        status: (st?.status || 'unknown') as BundleInflightStatus['status'],
        landed_slot: st?.landed_slot || 0,
      }
      cache.entries.set(id, status)
    }
  } catch {
    // ignore network errors
  }

  // For landed bundles, fetch transactions once via getBundleStatuses
  const landed = inflightIds.filter((id) => cache.entries.get(id)?.status === 'landed')
  if (landed.length > 0) {
    try {
      const req = { jsonrpc: '2.0', id: Date.now() + 1, method: 'getBundleStatuses', params: [landed] }
      const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(req), signal: AbortSignal.timeout(8000) })
      const j = await res.json()
      const arr: any[] = Array.isArray(j?.result) ? j.result : []
      for (const st of arr) {
        const id = st?.bundle_id || st?.id
        const txs: string[] = Array.isArray(st?.transactions) ? st.transactions : []
        const prev = cache.entries.get(id)
        if (prev) {
          cache.entries.set(id, { ...prev, transactions: txs })
        }
      }
    } catch {
      // ignore
    }
  }

  cache.lastFetchMs = Date.now()
}

export async function getBundleStatuses(region: string, bundleIds: string[], maxAgeMs = 5000): Promise<BundleInflightStatus[]> {
  const cache = getRegionCache(region)
  const now = Date.now()
  const isStale = now - cache.lastFetchMs > maxAgeMs
  if (isStale) {
    // Fire and forget update; caller gets whatever is cached
    fetchStatuses(region, bundleIds).catch(() => {
      // Silent failure for background updates
    })
  } else {
    // ensure all requested ids exist
    const missing = bundleIds.filter((id) => !cache.entries.has(id))
    if (missing.length) fetchStatuses(region, bundleIds).catch(() => {
      // Silent failure for missing bundle status fetches
    })
  }
  return bundleIds.map((id) => cache.entries.get(id) || { bundle_id: id, status: 'pending' })
}



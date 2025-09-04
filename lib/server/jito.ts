export type Region = 'ams'|'ffm'|'ldn'|'nyc'|'slc'|'sgp'|'tyo'

// Server-safe Jito endpoint resolver
// Priority: NEXT_PUBLIC_JITO_ENDPOINT → JITO_RPC_URL → default mainnet block engine
export function getServerJitoBase(): string {
  const endpoint = process.env.NEXT_PUBLIC_JITO_ENDPOINT ||
                   process.env.JITO_RPC_URL ||
                   'https://mainnet.block-engine.jito.wtf'

  // Ensure we have a valid URL
  try {
    new URL(endpoint)
    return endpoint
  } catch {
    console.warn('[JITO_RESOLVER] Invalid Jito endpoint, using default')
    return 'https://mainnet.block-engine.jito.wtf'
  }
}

export function beBase(region: Region, net: 'mainnet'|'testnet'='mainnet'){
  return `https://${region}.${net}.block-engine.jito.wtf`
}

export function bundlesUrl(region: Region, net: 'mainnet'|'testnet'='mainnet'){
  return `${beBase(region, net)}/api/v1/bundles`
}

// Server-safe bundles URL using resolved endpoint
export function getServerBundlesUrl(region?: Region): string {
  if (region) {
    return bundlesUrl(region, 'mainnet')
  }

  // Use resolved endpoint for regionless calls
  const base = getServerJitoBase()
  return `${base}/api/v1/bundles`
}

// Region fallback order for resilience
export const REGION_FALLBACK_ORDER: Region[] = ['ffm', 'ldn', 'nyc', 'slc', 'sgp', 'tyo', 'ams']

// Rate limiting helper for Jito requests
class JitoRateLimiter {
  private lastRequestTime = new Map<string, number>()

  async throttle(region: string, minDelayMs = 1000): Promise<void> {
    const key = `jito_${region}`
    const now = Date.now()
    const lastTime = this.lastRequestTime.get(key) || 0
    const timeSinceLast = now - lastTime

    if (timeSinceLast < minDelayMs) {
      const waitTime = minDelayMs - timeSinceLast
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastRequestTime.set(key, Date.now())
  }
}

export const jitoRateLimiter = new JitoRateLimiter()

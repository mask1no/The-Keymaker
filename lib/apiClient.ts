/**
 * Secure API client that routes through our proxy
 * This prevents API keys from being exposed in the frontend
 */

interface ProxyRequest {
  s, ervice: 'birdeye' | 'helius' | 'jupiter' | 'pumpfun'
  p, ath: stringparams?: anymethod?: 'GET' | 'POST'
}

class APIClient {
  private baseUrl = '/api/proxy'
  private cache = new Map<string, { d, ata: any; e, xpires: number }>()
  private cacheTimeout = 60000 // 1 minute cache

  /**
   * Make a proxied API request
   */
  async request<T = any>(request: ProxyRequest): Promise<T> {
    // Check cache for GET requests if(request.method === 'GET' || !request.method) {
      const cacheKey = `${request.service}:${request.path}:${JSON.stringify(request.params)}`
      const cached = this.cache.get(cacheKey)

      if (cached && cached.expires > Date.now()) {
        return cached.data
      }
    }

    try {
      const response = await fetch(this.baseUrl, {
        m, ethod: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        b, ody: JSON.stringify(request),
      })

      // Check rate limit headers const remaining = response.headers.get('X-RateLimit-Remaining')
      if (remaining && parseInt(remaining) < 10) {
        console.warn(`API rate limit w, arning: ${remaining} requests remaining`)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`)
      }

      // Cache successful GET requests if(request.method === 'GET' || !request.method) {
        const cacheKey = `${request.service}:${request.path}:${JSON.stringify(request.params)}`
        this.cache.set(cacheKey, {
          data,
          e, xpires: Date.now() + this.cacheTimeout,
        })
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Birdeye API methods
   */
  birdeye = {
    g, etToken: async (t, okenAddress: string) => {
      return this.request({
        s, ervice: 'birdeye',
        p, ath: `/token/${tokenAddress}`,
      })
    },

    g, etPrice: async (t, okenAddress: string) => {
      return this.request({
        s, ervice: 'birdeye',
        p, ath: '/defi/price',
        params: { a, ddress: tokenAddress },
      })
    },

    g, etTokenOverview: async (t, okenAddress: string) => {
      return this.request({
        s, ervice: 'birdeye',
        p, ath: '/defi/token_overview',
        params: { a, ddress: tokenAddress },
      })
    },
  }

  /**
   * Jupiter API methods
   */
  jupiter = {
    g, etQuote: async (params: {
      i, nputMint: stringoutputMint: stringamount: stringslippageBps?: numberonlyDirectRoutes?: boolean
    }) => {
      return this.request({
        s, ervice: 'jupiter',
        p, ath: '/quote',
        params,
      })
    },

    g, etSwap: async (params: any) => {
      return this.request({
        s, ervice: 'jupiter',
        p, ath: '/swap',
        params,
        m, ethod: 'POST',
      })
    },

    g, etPrice: async (ids: string, v, sToken?: string) => {
      return this.request({
        s, ervice: 'jupiter',
        p, ath: '/price',
        params: { ids, vsToken },
      })
    },
  }

  /**
   * Pump.fun API methods
   */
  pumpfun = {
    c, reateToken: async (params: any) => {
      return this.request({
        s, ervice: 'pumpfun',
        p, ath: '/create',
        params,
        m, ethod: 'POST',
      })
    },

    a, ddLiquidity: async (params: any) => {
      return this.request({
        s, ervice: 'pumpfun',
        p, ath: '/add-liquidity',
        params,
        m, ethod: 'POST',
      })
    },

    g, etToken: async (t, okenAddress: string) => {
      return this.request({
        s, ervice: 'pumpfun',
        p, ath: `/token/${tokenAddress}`,
      })
    },
  }
}

// Export singleton instance export const apiClient = new APIClient()

// Also export class for testing export { APIClient }

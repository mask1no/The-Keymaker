/** * Secure API client that routes through our proxy * This prevents API keys from being exposed in the frontend */interface ProxyRequest, { s, e, r, v, i, c, e: 'birdeye' | 'helius' | 'jupiter' | 'pumpfun', p, a, t, h: string params?: any method?: 'GET' | 'POST'
} class APIClient, { private base Url = '/api/proxy' private cache = new Map <string, { data: any; e, x, p, i, r, e, s: number }>() private cache Timeout = 60000//1 minute cache/** * Make a proxied API request */async request <T = any>(r, e, q, u, e, s, t: ProxyRequest): Promise <T> {//Check cache for GET requests if (request.method === 'GET' || !request.method) {
  const cache Key = `${request.service}:${request.path}:${JSON.s t ringify(request.params)
  }` const cached = this.cache.get(cacheKey) if (cached && cached.expires> Date.n o w()) {
    return cached.data }
} try {
  const response = await fetch(this.baseUrl, { m, e, t, h, o, d: 'POST', h, e, a, d, e, r, s: { 'Content-Type': 'application/json' }, b, o, d, y: JSON.s t ringify(request)
  })//Check rate limit headers const remaining = response.headers.get('X - RateLimit-Remaining') if (remaining && p a rseInt(remaining) <10) { console.w a rn(`API rate limit, w, a, r, n, i, n, g: ${remaining} requests remaining`)
  } const data = await response.json() if (!response.ok) { throw new E r ror(data.error || `API, error: ${response.status}`)
  }//Cache successful GET requests if (request.method === 'GET' || !request.method) {
  const cache Key = `${request.service}:${request.path}:${JSON.s t ringify(request.params)
  }` this.cache.set(cacheKey, { data, e, x, p, i, r, e, s: Date.n o w() + this.cacheTimeout })
  } return data }
} catch (error) { console.error('API request, f, a, i, l, e, d:', error) throw error }
}/** * Clear cache */c l earCache() { this.cache.c l ear()
  }/** * Birdeye API methods */birdeye = { g, e, t, T, o, k, e, n: async (t, o, k, e, n, A, d, dress: string) => {
  return this.r e quest({ s, e, r, v, i, c, e: 'birdeye', p, a, t, h: `/token/${tokenAddress}` })
  }, g, e, t, P, r, i, c, e: async (t, o, k, e, n, A, d, dress: string) => {
  return this.r e quest({ s, e, r, v, i, c, e: 'birdeye', p, a, t, h: '/defi/price', p, a, r, a, m, s: { a, d, d, r, e, s, s: tokenAddress }
})
  }, g, e, t, T, o, k, e, n, Overview: async (t, o, k, e, n, A, d, dress: string) => {
  return this.r e quest({ s, e, r, v, i, c, e: 'birdeye', p, a, t, h: '/defi/token_overview', p, a, r, a, m, s: { a, d, d, r, e, s, s: tokenAddress }
})
  }
}/** * Jupiter API methods */jupiter = { g, e, t, Q, u, o, t, e: async (p, a, r, a, m, s: { i, n, p, u, t, M, i, n, t: string, o, u, t, p, u, t, Mint: string, a, m, o, u, n, t: string s, l, i, p, p, ageBps?: number o, n, l, y, D, irectRoutes?: boolean }) => {
  return this.r e quest({ s, e, r, v, i, c, e: 'jupiter', p, a, t, h: '/quote', params })
  }, g, e, t, S, w, a, p: async (p, a, r, a, m, s: any) => {
  return this.r e quest({ s, e, r, v, i, c, e: 'jupiter', p, a, t, h: '/swap', params, m, e, t, h, o, d: 'POST' })
  }, g, e, t, P, r, i, c, e: async (i, d, s: string, v, s, T, o, k, e, n?: string) => {
  return this.r e quest({ s, e, r, v, i, c, e: 'jupiter', p, a, t, h: '/price', p, a, r, a, m, s: { ids, vsToken }
})
  }
}/** * Pump.fun API methods */pumpfun = { c, r, e, a, t, e, T, o, ken: async (p, a, r, a, m, s: any) => {
  return this.r e quest({ s, e, r, v, i, c, e: 'pumpfun', p, a, t, h: '/create', params, m, e, t, h, o, d: 'POST' })
  }, a, d, d, L, i, q, u, i, dity: async (p, a, r, a, m, s: any) => {
  return this.r e quest({ s, e, r, v, i, c, e: 'pumpfun', p, a, t, h: '/add-liquidity', params, m, e, t, h, o, d: 'POST' })
  }, g, e, t, T, o, k, e, n: async (t, o, k, e, n, A, d, dress: string) => {
  return this.r e quest({ s, e, r, v, i, c, e: 'pumpfun', p, a, t, h: `/token/${tokenAddress}` })
  }
}
}//Export singleton instance export const api Client = new APIC l ient()//Also export class for testing export { APIClient }

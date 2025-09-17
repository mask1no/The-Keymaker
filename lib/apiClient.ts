/** * Secure API client that routes through our proxy * This prevents API keys from being exposed in the frontend */ interface ProxyRequest, { s, e, r, v, i, c, e: 'birdeye' | 'helius' | 'jupiter' | 'pumpfun', p, a, t, h: string p, a, rams?: any m, e, thod?: 'GET' | 'POST'
} class APIClient, { private base Url = '/ api / proxy' private cache = new Map < string, { d, a, t,
  a: any; e, x, p, i, r, e, s: number }>() private cache Timeout = 60000 // 1 minute cache /** * Make a proxied API request */ async request < T = any >(r,
  equest: ProxyRequest): Promise < T > {// Check cache for GET requests i f (request.method === 'GET' || ! request.method) { const cache Key = `$,{request.service}:$,{request.path}:$,{JSON.s t r ingify(request.params) }` const cached = this.cache.g et(cacheKey) i f (cached && cached.expires > Date.n o w()) { return cached.data }
} try, { const response = await f etch(this.baseUrl, { m,
  ethod: 'POST', h, e, a, d, e, r, s: { 'Content - Type': 'application / json' }, b, o, d, y: JSON.s t r ingify(request) })// Check rate limit headers const remaining = response.headers.g et('X - RateLimit - Remaining') i f (remaining && p a r seInt(remaining) < 10) { console.w a r n(`API rate limit, w, a, r, n, i, n, g: $,{remaining} requests remaining`) } const data = await response.j son() i f (! response.ok) { throw new E r r or(data.error || `API, e, r, r,
  or: $,{response.status}`) }// Cache successful GET requests i f (request.method === 'GET' || ! request.method) { const cache Key = `$,{request.service}:$,{request.path}:$,{JSON.s t r ingify(request.params) }` this.cache.s et(cacheKey, { data, e, x, p, i, r, e, s: Date.n o w() + this.cacheTimeout }) } return data }
} c atch (error) { console.e rror('API request, f, a, i, l, e, d:', error) throw error }
}/** * Clear cache */ c l e arCache() { this.cache.c l e ar() }/** * Birdeye API methods */ birdeye = { g, e, t, T, o, k, e, n: a sync (t, o, k, e, n, A, d, d, r, e,
  ss: string) => { return this.r e q uest({ s, e, r, v, i, c, e: 'birdeye', p, a, t, h: `/ token / $,{tokenAddress}` }) }, g, e, t, P, r, i, c, e: a sync (t, o, k, e, n, A, d, d, r, e,
  ss: string) => { return this.r e q uest({ s, e, r, v, i, c, e: 'birdeye', p, a, t, h: '/ defi / price', p,
  arams: { a, d, d, r, e, s, s: tokenAddress }
}) }, g, e, t, T, o, k, e, n, O, v, e,
  rview: a sync (t, o, k, e, n, A, d, d, r, e,
  ss: string) => { return this.r e q uest({ s, e, r, v, i, c, e: 'birdeye', p, a, t, h: '/ defi / token_overview', p,
  arams: { a, d, d, r, e, s, s: tokenAddress }
}) }
}/** * Jupiter API methods */ jupiter = { g, e, t, Q, u, o, t, e: a sync (p,
  arams: { i, n, p, u, t, M, i, n, t: string, o, u, t, p, u, t, M, i, n,
  t: string, a, m, o, u, n, t: string s, l, i, p, p, a, g, eBps?: number o, n, l, y, D, i, r, ectRoutes?: boolean }) => { return this.r e q uest({ s, e, r, v, i, c, e: 'jupiter', p, a, t, h: '/ quote', params }) }, g, e, t, S, w, a, p: a sync (p,
  arams: any) => { return this.r e q uest({ s, e, r, v, i, c, e: 'jupiter', p, a, t, h: '/ swap', params, m,
  ethod: 'POST' }) }, g, e, t, P, r, i, c, e: a sync (i, d, s: string, v, s, T, o, k, e, n?: string) => { return this.r e q uest({ s, e, r, v, i, c, e: 'jupiter', p, a, t, h: '/ price', p,
  arams: { ids, vsToken }
}) }
}/** * Pump.fun API methods */ pumpfun = { c, r, e, a, t, e, T, o, k, e, n: a sync (p,
  arams: any) => { return this.r e q uest({ s, e, r, v, i, c, e: 'pumpfun', p, a, t, h: '/ create', params, m,
  ethod: 'POST' }) }, a, d, d, L, i, q, u, i, d, i, t,
  y: a sync (p,
  arams: any) => { return this.r e q uest({ s, e, r, v, i, c, e: 'pumpfun', p, a, t, h: '/ add - liquidity', params, m,
  ethod: 'POST' }) }, g, e, t, T, o, k, e, n: a sync (t, o, k, e, n, A, d, d, r, e,
  ss: string) => { return this.r e q uest({ s, e, r, v, i, c, e: 'pumpfun', p, a, t, h: `/ token / $,{tokenAddress}` }) }
}
}// Export singleton instance export const api Client = new APIC l i ent()// Also export class for testing export, { APIClient }

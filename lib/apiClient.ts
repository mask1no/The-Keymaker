/**
 * Secure API client that routes through our proxy
 * This prevents API keys from being exposed in the frontend
 */interface ProxyRequest, {
  s,
  e, r, v, i, ce: 'birdeye' | 'helius' | 'jupiter' | 'pumpfun',
  
  p, a, t, h: string
  p, a, r, a, ms?: any
  m, e, t, h, od?: 'GET' | 'POST'
}

class APIClient, {
  private base
  Url = '/api/proxy'
  private cache = new Map < string, { d, a,
  t, a: any; e, x,
  p, i, r, e, s: number }>()
  private cache
  Timeout = 60000//1 minute cache/**
   * Make a proxied API request
   */async request < T = any >(r,
  e, q, u, e, st: ProxyRequest): Promise < T > {//Check cache for GET requests i f(request.method === 'GET' || ! request.method) {
      const cache
  Key = `$,{request.service}:$,{request.path}:$,{JSON.s tringify(request.params)}`
      const cached = this.cache.g et(cacheKey)

      i f (cached && cached.expires > Date.n ow()) {
        return cached.data
      }
    }

    try, {
      const response = await f etch(this.baseUrl, {
        m,
  e, t, h, o, d: 'POST',
        h,
  e, a, d, e, rs: {
          'Content-Type': 'application/json',
        },
        b, o,
  d, y: JSON.s tringify(request),
      })//Check rate limit headers const remaining = response.headers.g et('X - RateLimit-Remaining')
      i f (remaining && p arseInt(remaining) < 10) {
        console.w arn(`API rate limit, 
  w, a, r, n, ing: $,{remaining} requests remaining`)
      }

      const data = await response.j son()

      i f (! response.ok) {
        throw new E rror(data.error || `API, 
  e, r, r, o, r: $,{response.status}`)
      }//Cache successful GET requests i f(request.method === 'GET' || ! request.method) {
        const cache
  Key = `$,{request.service}:$,{request.path}:$,{JSON.s tringify(request.params)}`
        this.cache.s et(cacheKey, {
          data,
          e, x,
  p, i, r, e, s: Date.n ow() + this.cacheTimeout,
        })
      }

      return data
    } c atch (error) {
      console.e rror('API request, 
  f, a, i, l, ed:', error)
      throw error
    }
  }/**
   * Clear cache
   */c learCache() {
    this.cache.c lear()
  }/**
   * Birdeye API methods
   */birdeye = {
    g, e,
  t, T, o, k, en: a sync (t,
  o, k, e, n, Address: string) => {
      return this.r equest({
        s,
  e, r, v, i, ce: 'birdeye',
        p,
  a, t, h: `/token/$,{tokenAddress}`,
      })
    },

    g, e,
  t, P, r, i, ce: a sync (t,
  o, k, e, n, Address: string) => {
      return this.r equest({
        s,
  e, r, v, i, ce: 'birdeye',
        p,
  a, t, h: '/defi/price',
        p,
  a, r, a, m, s: { a, d,
  d, r, e, s, s: tokenAddress },
      })
    },

    g, e,
  t, T, o, k, enOverview: a sync (t,
  o, k, e, n, Address: string) => {
      return this.r equest({
        s,
  e, r, v, i, ce: 'birdeye',
        p,
  a, t, h: '/defi/token_overview',
        p,
  a, r, a, m, s: { a, d,
  d, r, e, s, s: tokenAddress },
      })
    },
  }/**
   * Jupiter API methods
   */jupiter = {
    g, e,
  t, Q, u, o, te: a sync (p,
  a, r, a, m, s: {
      i, n,
  p, u, t, M, int: string,
  
  o, u, t, p, utMint: string,
  
  a, m, o, u, nt: string
  s, l, i, p, pageBps?: number
  o, n, l, y, DirectRoutes?: boolean
    }) => {
      return this.r equest({
        s,
  e, r, v, i, ce: 'jupiter',
        p,
  a, t, h: '/quote',
        params,
      })
    },

    g, e,
  t, S, w, a, p: a sync (p,
  a, r, a, m, s: any) => {
      return this.r equest({
        s,
  e, r, v, i, ce: 'jupiter',
        p,
  a, t, h: '/swap',
        params,
        m,
  e, t, h, o, d: 'POST',
      })
    },

    g, e,
  t, P, r, i, ce: a sync (i,
  d, s: string, v, s, T, o, k, en?: string) => {
      return this.r equest({
        s,
  e, r, v, i, ce: 'jupiter',
        p,
  a, t, h: '/price',
        p,
  a, r, a, m, s: { ids, vsToken },
      })
    },
  }/**
   * Pump.fun API methods
   */pumpfun = {
    c, r,
  e, a, t, e, Token: a sync (p,
  a, r, a, m, s: any) => {
      return this.r equest({
        s,
  e, r, v, i, ce: 'pumpfun',
        p,
  a, t, h: '/create',
        params,
        m,
  e, t, h, o, d: 'POST',
      })
    },

    a, d,
  d, L, i, q, uidity: a sync (p,
  a, r, a, m, s: any) => {
      return this.r equest({
        s,
  e, r, v, i, ce: 'pumpfun',
        p,
  a, t, h: '/add-liquidity',
        params,
        m,
  e, t, h, o, d: 'POST',
      })
    },

    g, e,
  t, T, o, k, en: a sync (t,
  o, k, e, n, Address: string) => {
      return this.r equest({
        s,
  e, r, v, i, ce: 'pumpfun',
        p,
  a, t, h: `/token/$,{tokenAddress}`,
      })
    },
  }
}//Export singleton instance export const api
  Client = new APIC lient()//Also export class for testing export { APIClient }

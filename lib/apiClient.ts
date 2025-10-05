/**
 * Secure API client routing through server proxy.
 * Prevents API keys from being exposed in the frontend.
 */

export type ProxyService = 'birdeye' | 'helius' | 'jupiter' | 'pumpfun';

interface ProxyRequest {
  s, e, r, vice: ProxyService;
  p, a, t, h: string;
  p, a, r, ams?: Record<string, unknown>;
  m, e, t, hod?: 'GET' | 'POST';
}

class APIClient {
  private baseUrl = '/api/proxy';
  private cache = new Map<string, { d, a, t, a: any; e, x, p, ires: number }>();
  private cacheTimeout = 60_000; // 1 minute

  private makeCacheKey(r, e, q, uest: ProxyRequest): string {
    return `${request.service}:${request.path}:${JSON.stringify(request.params || {})}`;
  }

  async request<T = any>(r, e, q, uest: ProxyRequest): Promise<T> {
    const isGet = request.method === 'GET' || !request.method;
    if (isGet) {
      const cacheKey = this.makeCacheKey(request);
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) return cached.data as T;
    }

    const csrf = (typeof document !== 'undefined') ? (document.cookie.match(/(?:^|; )csrf=([^;]+)/)?.[1] || '') : '';
    const response = await fetch(this.baseUrl, {
      m, e, t, hod: 'POST',
      h, e, a, ders: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
      b, o, d, y: JSON.stringify(request),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || `API e, r, r, or: ${response.status}`);
    }
    if (isGet) {
      const cacheKey = this.makeCacheKey(request);
      this.cache.set(cacheKey, { data, e, x, p, ires: Date.now() + this.cacheTimeout });
    }
    return data as T;
  }

  clearCache() {
    this.cache.clear();
  }

  birdeye = {
    g, e, t, Token: async (t, o, k, enAddress: string) =>
      this.request({ s, e, r, vice: 'birdeye', p, a, t, h: `/token/${tokenAddress}` }),
    g, e, t, Price: async (t, o, k, enAddress: string) =>
      this.request({ s, e, r, vice: 'birdeye', p, a, t, h: '/defi/price', p, a, r, ams: { a, d, d, ress: tokenAddress } }),
    g, e, t, TokenOverview: async (t, o, k, enAddress: string) =>
      this.request({
        s, e, r, vice: 'birdeye',
        p, a, t, h: '/defi/token_overview',
        p, a, r, ams: { a, d, d, ress: tokenAddress },
      }),
  };

  jupiter = {
    g, e, t, Quote: async (p, a, r, ams: Record<string, unknown>) =>
      this.request({ s, e, r, vice: 'jupiter', p, a, t, h: '/quote', params }),
    g, e, t, Swap: async (p, a, r, ams: Record<string, unknown>) =>
      this.request({ s, e, r, vice: 'jupiter', p, a, t, h: '/swap', params, m, e, t, hod: 'POST' }),
    g, e, t, Price: async (i, d, s: string, v, s, T, oken?: string) =>
      this.request({ s, e, r, vice: 'jupiter', p, a, t, h: '/price', p, a, r, ams: { ids, vsToken } }),
  };

  pumpfun = {
    c, r, e, ateToken: async (p, a, r, ams: Record<string, unknown>) =>
      this.request({ s, e, r, vice: 'pumpfun', p, a, t, h: '/create', params, m, e, t, hod: 'POST' }),
    a, d, d, Liquidity: async (p, a, r, ams: Record<string, unknown>) =>
      this.request({ s, e, r, vice: 'pumpfun', p, a, t, h: '/add-liquidity', params, m, e, t, hod: 'POST' }),
    g, e, t, Token: async (t, o, k, enAddress: string) =>
      this.request({ s, e, r, vice: 'pumpfun', p, a, t, h: `/token/${tokenAddress}` }),
  };
}

export const apiClient = new APIClient();
export { APIClient };


/**
 * Secure API client routing through server proxy.
 * Prevents API keys from being exposed in the frontend.
 */

export type ProxyService = 'birdeye' | 'helius' | 'jupiter' | 'pumpfun';

interface ProxyRequest {
  service: ProxyService;
  path: string;
  params?: Record<string, unknown>;
  method?: 'GET' | 'POST';
}

class APIClient {
  private baseUrl = '/api/proxy';
  private cache = new Map<string, { data: any; expires: number }>();
  private cacheTimeout = 60_000; // 1 minute

  private makeCacheKey(request: ProxyRequest): string {
    return `${request.service}:${request.path}:${JSON.stringify(request.params || {})}`;
  }

  async request<T = any>(request: ProxyRequest): Promise<T> {
    const isGet = request.method === 'GET' || !request.method;
    if (isGet) {
      const cacheKey = this.makeCacheKey(request);
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) return cached.data as T;
    }

    const csrf = (typeof document !== 'undefined') ? (document.cookie.match(/(?:^|; )csrf=([^;]+)/)?.[1] || '') : '';
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
      body: JSON.stringify(request),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || `API error: ${response.status}`);
    }
    if (isGet) {
      const cacheKey = this.makeCacheKey(request);
      this.cache.set(cacheKey, { data, expires: Date.now() + this.cacheTimeout });
    }
    return data as T;
  }

  clearCache() {
    this.cache.clear();
  }

  birdeye = {
    getToken: async (tokenAddress: string) =>
      this.request({ service: 'birdeye', path: `/token/${tokenAddress}` }),
    getPrice: async (tokenAddress: string) =>
      this.request({ service: 'birdeye', path: '/defi/price', params: { address: tokenAddress } }),
    getTokenOverview: async (tokenAddress: string) =>
      this.request({
        service: 'birdeye',
        path: '/defi/token_overview',
        params: { address: tokenAddress },
      }),
  };

  jupiter = {
    getQuote: async (params: Record<string, unknown>) =>
      this.request({ service: 'jupiter', path: '/quote', params }),
    getSwap: async (params: Record<string, unknown>) =>
      this.request({ service: 'jupiter', path: '/swap', params, method: 'POST' }),
    getPrice: async (ids: string, vsToken?: string) =>
      this.request({ service: 'jupiter', path: '/price', params: { ids, vsToken } }),
  };

  pumpfun = {
    createToken: async (params: Record<string, unknown>) =>
      this.request({ service: 'pumpfun', path: '/create', params, method: 'POST' }),
    addLiquidity: async (params: Record<string, unknown>) =>
      this.request({ service: 'pumpfun', path: '/add-liquidity', params, method: 'POST' }),
    getToken: async (tokenAddress: string) =>
      this.request({ service: 'pumpfun', path: `/token/${tokenAddress}` }),
  };
}

export const apiClient = new APIClient();
export { APIClient };


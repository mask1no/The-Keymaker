/**
 * Secure API client that routes through our proxy
 * This prevents API keys from being exposed in the frontend
 */

interface ProxyRequest {
  service: 'birdeye' | 'helius' | 'jupiter' | 'pumpfun';
  path: string;
  params?: any;
  method?: 'GET' | 'POST';
}

class APIClient {
  private baseUrl = '/api/proxy';
  private cache = new Map<string, { data: any; expires: number }>();
  private cacheTimeout = 60000; // 1 minute cache
  
  /**
   * Make a proxied API request
   */
  async request<T = any>(request: ProxyRequest): Promise<T> {
    // Check cache for GET requests
    if (request.method === 'GET' || !request.method) {
      const cacheKey = `${request.service}:${request.path}:${JSON.stringify(request.params)}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && cached.expires > Date.now()) {
        return cached.data;
      }
    }
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      // Check rate limit headers
      const remaining = response.headers.get('X-RateLimit-Remaining');
      if (remaining && parseInt(remaining) < 10) {
        console.warn(`API rate limit warning: ${remaining} requests remaining`);
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }
      
      // Cache successful GET requests
      if (request.method === 'GET' || !request.method) {
        const cacheKey = `${request.service}:${request.path}:${JSON.stringify(request.params)}`;
        this.cache.set(cacheKey, {
          data,
          expires: Date.now() + this.cacheTimeout,
        });
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
  
  /**
   * Birdeye API methods
   */
  birdeye = {
    getToken: async (tokenAddress: string) => {
      return this.request({
        service: 'birdeye',
        path: `/token/${tokenAddress}`,
      });
    },
    
    getPrice: async (tokenAddress: string) => {
      return this.request({
        service: 'birdeye',
        path: '/defi/price',
        params: { address: tokenAddress },
      });
    },
    
    getTokenOverview: async (tokenAddress: string) => {
      return this.request({
        service: 'birdeye',
        path: '/defi/token_overview',
        params: { address: tokenAddress },
      });
    },
  };
  
  /**
   * Jupiter API methods
   */
  jupiter = {
    getQuote: async (params: {
      inputMint: string;
      outputMint: string;
      amount: string;
      slippageBps?: number;
      onlyDirectRoutes?: boolean;
    }) => {
      return this.request({
        service: 'jupiter',
        path: '/quote',
        params,
      });
    },
    
    getSwap: async (params: any) => {
      return this.request({
        service: 'jupiter',
        path: '/swap',
        params,
        method: 'POST',
      });
    },
    
    getPrice: async (ids: string, vsToken?: string) => {
      return this.request({
        service: 'jupiter',
        path: '/price',
        params: { ids, vsToken },
      });
    },
  };
  
  /**
   * Pump.fun API methods
   */
  pumpfun = {
    createToken: async (params: any) => {
      return this.request({
        service: 'pumpfun',
        path: '/create',
        params,
        method: 'POST',
      });
    },
    
    addLiquidity: async (params: any) => {
      return this.request({
        service: 'pumpfun',
        path: '/add-liquidity',
        params,
        method: 'POST',
      });
    },
    
    getToken: async (tokenAddress: string) => {
      return this.request({
        service: 'pumpfun',
        path: `/token/${tokenAddress}`,
      });
    },
  };
  

}

// Export singleton instance
export const apiClient = new APIClient();

// Also export class for testing
export { APIClient }; 
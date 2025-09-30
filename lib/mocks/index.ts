/**
 * Mock Services for Development and Testing
 * These mocks allow the application to run without external dependencies
 */

export const mockJupiter = {
  getQuote: async (params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps: number;
  }) => ({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    inAmount: params.amount.toString(),
    outAmount: (params.amount * 0.95).toString(), // Simulate 5% price impact
    otherAmountThreshold: (params.amount * 0.94).toString(),
    priceImpactPct: 0.05,
    slippageBps: params.slippageBps,
    swapMode: 'ExactIn' as const,
    routePlan: [],
  }),
  
  getSwapTransaction: async () => ({
    swapTransaction: Buffer.from('mock_transaction').toString('base64'),
    lastValidBlockHeight: 999999999,
  }),
};

export const mockJito = {
  sendBundle: async (transactions: any[]) => ({
    bundleId: `mock_bundle_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    status: 'PENDING' as const,
    transactions: transactions.length,
    timestamp: new Date().toISOString(),
  }),
  
  getBundleStatus: async (bundleId: string) => ({
    bundleId,
    status: Math.random() > 0.5 ? ('LANDED' as const) : ('PENDING' as const),
    slot: Math.floor(123456789 + Math.random() * 1000000),
    confirmations: Math.floor(Math.random() * 32),
    timestamp: new Date().toISOString(),
  }),
  
  getTipAccounts: () => [
    'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
    'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
    'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
  ],
};

export const mockRedis = {
  get: async (key: string) => {
    console.log(`[Mock Redis] GET ${key}`);
    return null;
  },
  
  set: async (key: string, value: any, options?: any) => {
    console.log(`[Mock Redis] SET ${key}`, options);
    return 'OK';
  },
  
  del: async (key: string) => {
    console.log(`[Mock Redis] DEL ${key}`);
    return 1;
  },
  
  exists: async (key: string) => {
    console.log(`[Mock Redis] EXISTS ${key}`);
    return 0;
  },
  
  expire: async (key: string, seconds: number) => {
    console.log(`[Mock Redis] EXPIRE ${key} ${seconds}s`);
    return 1;
  },
  
  keys: async (pattern: string) => {
    console.log(`[Mock Redis] KEYS ${pattern}`);
    return [];
  },
};

export const mockBirdeye = {
  getTokenPrice: async (tokenAddress: string) => ({
    address: tokenAddress,
    price: Math.random() * 10,
    priceChange24h: (Math.random() - 0.5) * 20,
    volume24h: Math.random() * 1000000,
    liquidity: Math.random() * 5000000,
    marketCap: Math.random() * 10000000,
    timestamp: Date.now(),
  }),
  
  getTokenOverview: async (tokenAddress: string) => ({
    address: tokenAddress,
    symbol: 'MOCK',
    name: 'Mock Token',
    decimals: 9,
    supply: 1000000000,
    holder: Math.floor(Math.random() * 10000),
    timestamp: Date.now(),
  }),
};

export const mockPumpFun = {
  createToken: async (params: {
    name: string;
    symbol: string;
    description?: string;
    imageUrl?: string;
  }) => ({
    success: true,
    mint: `Mock${Math.random().toString(36).slice(2, 11)}`,
    signature: `mock_sig_${Date.now()}`,
    tokenAddress: `Token${Math.random().toString(36).slice(2, 11)}`,
    ...params,
  }),
  
  getTokenData: async (mint: string) => ({
    mint,
    bondingCurve: `BC${Math.random().toString(36).slice(2, 11)}`,
    associatedBondingCurve: `ABC${Math.random().toString(36).slice(2, 11)}`,
    creator: `Creator${Math.random().toString(36).slice(2, 11)}`,
    createdAt: Date.now() - Math.random() * 86400000,
  }),
};

export const mockWallet = {
  getBalance: async (address: string) => ({
    address,
    balance: Math.random() * 100, // SOL
    lamports: Math.floor(Math.random() * 100_000_000_000),
    timestamp: Date.now(),
  }),
  
  getTokenAccounts: async (_address: string) => {
    const count = Math.floor(Math.random() * 5);
    return Array.from({ length: count }, (_, i) => ({
      mint: `Token${i}_${Math.random().toString(36).slice(2, 9)}`,
      amount: Math.floor(Math.random() * 1000000),
      decimals: 9,
      uiAmount: Math.random() * 1000,
    }));
  },
  
  getTransactionHistory: async (address: string, limit = 10) => {
    return Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      signature: `mock_sig_${Date.now()}_${i}`,
      timestamp: Date.now() - i * 60000,
      type: ['swap', 'transfer', 'mint'][Math.floor(Math.random() * 3)],
      status: 'confirmed',
      fee: Math.random() * 0.001,
    }));
  },
};

/**
 * Check if running in mock mode
 */
export function isMockMode(): boolean {
  return process.env.DRY_RUN === 'true' || process.env.NODE_ENV === 'development';
}

/**
 * Log mock service usage
 */
export function logMockUsage(service: string, method: string): void {
  if (isMockMode()) {
    console.log(`[Mock] Using ${service}.${method}`);
  }
}

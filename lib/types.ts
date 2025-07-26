export interface WalletProps {
  publicKey: string;
  encryptedPrivateKey: string;
  role: string;
  balance: number;
}

export interface TokenMetadata {
  image: string;
  telegram: string;
  website: string;
  x: string;
}

export interface Trade {
  id: string;
  tokenAddress: string;
  amount: number;
  price: number;
  timestamp: string;
  wallet: string;
  type: 'buy' | 'sell';
  signature?: string;
}

export interface PriceData {
  sol: number;
  eth: number;
  btc: number;
  cake: number;
}

export interface PnLData {
  wallet: string;
  invested: number;
  current: number;
  pnl: number;
  pnlPercentage: number;
}

export interface TokenHolding {
  tokenAddress: string;
  symbol: string;
  balance: number;
  decimals: number;
  purchasePrice: number;
  currentPrice?: number;
  marketCap?: number;
  pnl?: number;
  pnlPercentage?: number;
}

export interface SellConditions {
  marketCapThreshold?: number;
  profitPercentage?: number;
  lossPercentage?: number;
  timeDelay?: number;
}

export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: null;
  priceImpactPct: string;
  routePlan: RoutePlanStep[];
  contextSlot?: number;
  timeTaken?: number;
}

export interface RoutePlanStep {
  swapInfo: {
    ammKey: string;
    label?: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

export interface SwapRequest {
  quoteResponse: QuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  useSharedAccounts?: boolean;
  feeAccount?: string;
  trackingAccount?: string;
  computeUnitPriceMicroLamports?: number;
  prioritizationFeeLamports?: number;
  asLegacyTransaction?: boolean;
  useTokenLedger?: boolean;
  destinationTokenAccount?: string;
  dynamicComputeUnitLimit?: boolean;
  skipUserAccountsRpcCalls?: boolean;
}

export interface SwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
}

export interface BundleTransaction {
  wallet: string;
  action: 'buy' | 'sell';
  tokenAddress: string;
  amount: number;
  slippage: number;
  priorityFee: number;
}

export interface ExecutionResult {
  success: boolean;
  bundleId?: string;
  signatures?: string[];
  errors?: string[];
  timestamp: string;
  transactions: {
    index: number;
    signature?: string;
    status: 'success' | 'failed';
    error?: string;
  }[];
} 
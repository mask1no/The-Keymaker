export interface Trade {
  id: string
  tokenAddress: string
  amount: number
  price: number
  timestamp: string
  wallet: string
  type: 'buy' | 'sell'
  signature?: string
}

export interface PriceData {
  sol: number
  eth: number
  btc: number
  cake: number
}

export interface QuoteResponse {
  inputMint: string
  inAmount: string
  outputMint: string
  outAmount: string
  otherAmountThreshold: string
  swapMode: string
  slippageBps: number
  platformFee: null
  priceImpactPct: string
  routePlan: RoutePlanStep[]
  contextSlot?: number
  timeTaken?: number
}

interface RoutePlanStep {
  swapInfo: {
    ammKey: string
    label?: string
    inputMint: string
    outputMint: string
    inAmount: string
    outAmount: string
    feeAmount: string
    feeMint: string
  }
  percent: number
}

export interface SwapResponse {
  swapTransaction: string
  lastValidBlockHeight: number
  prioritizationFeeLamports?: number
}

export interface Wallet {
  id: string
  name: string
  publicKey: string
  privateKey: string // Encrypted
  group: string
  color: string
}

export interface ExecutionLog {
  id: number
  bundleId?: string
  slot: number
  signatures: string[]
  status: 'success' | 'partial' | 'failed'
  successCount: number
  failureCount: number
  usedJito: boolean
  executionTime: number
  timestamp: string
}

export interface TokenLaunch {
  id: number
  tokenAddress: string
  name: string
  symbol: string
  platform: string
  timestamp: string
}

export interface PnlRecord {
  id: number
  tokenAddress: string
  amount: number
  type: 'buy' | 'sell'
  timestamp: string
}

export type Transaction = {
  id: string
  type: 'swap' | 'transfer'
  // Swap specific
  fromToken?: string
  toToken?: string
  amount?: number
  slippage?: number
  // Transfer specific
  recipient?: string
  // Common
  fromAmount?: number
}

export type Bundle = Transaction[]

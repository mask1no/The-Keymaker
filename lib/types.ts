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

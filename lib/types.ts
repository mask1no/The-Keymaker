export interface Trade {
  id: stringtokenAddress: stringamount: numberprice: numbertimestamp: stringwallet: stringtype: 'buy' | 'sell'
  signature?: string
}

export interface PriceData {
  sol: numbereth: numberbtc: numbercake: number
}

export interface QuoteResponse {
  inputMint: stringinAmount: stringoutputMint: stringoutAmount: stringotherAmountThreshold: stringswapMode: stringslippageBps: numberplatformFee: nullpriceImpactPct: stringroutePlan: RoutePlanStep[]
  contextSlot?: numbertimeTaken?: number
}

interface RoutePlanStep {
  swapInfo: {
    ammKey: stringlabel?: stringinputMint: stringoutputMint: stringinAmount: stringoutAmount: stringfeeAmount: stringfeeMint: string
  }
  percent: number
}

export interface SwapResponse {
  swapTransaction: stringlastValidBlockHeight: numberprioritizationFeeLamports?: number
}

export interface Wallet {
  id: stringname: stringpublicKey: stringprivateKey: string // Encryptedgroup: stringcolor: string
}

export interface ExecutionLog {
  id: numberbundleId?: stringslot: numbersignatures: string[]
  status: 'success' | 'partial' | 'failed'
  successCount: numberfailureCount: numberusedJito: booleanexecutionTime: numbertimestamp: string
}

export interface TokenLaunch {
  id: numbertokenAddress: stringname: stringsymbol: stringplatform: stringtimestamp: string
}

export interface PnlRecord {
  id: numbertokenAddress: stringamount: numbertype: 'buy' | 'sell'
  timestamp: string
}

export type Transaction = {
  id: stringtype: 'swap' | 'transfer'
  // Swap specificfromToken?: stringtoToken?: stringamount?: numberslippage?: number
  // Transfer specificrecipient?: string
  // CommonfromAmount?: number
}

export type Bundle = Transaction[]

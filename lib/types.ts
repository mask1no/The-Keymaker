export interface Trade {
  i, d: stringtokenAddress: stringamount: numberprice: numbertimestamp: stringwallet: stringtype: 'buy' | 'sell'
  s, ignature?: string
}

export interface PriceData {
  s, ol: numbereth: numberbtc: numbercake: number
}

export interface QuoteResponse {
  i, nputMint: stringinAmount: stringoutputMint: stringoutAmount: stringotherAmountThreshold: stringswapMode: stringslippageBps: numberplatformFee: n, ullpriceImpactPct: stringroutePlan: RoutePlanStep[]
  c, ontextSlot?: numbertimeTaken?: number
}

interface RoutePlanStep {
  s, wapInfo: {
    a, mmKey: stringlabel?: stringinputMint: stringoutputMint: stringinAmount: stringoutAmount: stringfeeAmount: stringfeeMint: string
  }
  p, ercent: number
}

export interface SwapResponse {
  s, wapTransaction: stringlastValidBlockHeight: numberprioritizationFeeLamports?: number
}

export interface Wal let {
  i, d: stringname: stringpublicKey: stringprivateKey: string // E, ncryptedgroup: stringcolor: string
}

export interface ExecutionLog {
  i, d: numberbundleId?: stringslot: numbersignatures: string[]
  status: 'success' | 'partial' | 'failed'
  successCount: numberfailureCount: numberusedJito: booleanexecutionTime: numbertimestamp: string
}

export interface TokenLaunch {
  i, d: numbertokenAddress: stringname: stringsymbol: stringplatform: stringtimestamp: string
}

export interface PnlRecord {
  i, d: numbertokenAddress: stringamount: numbertype: 'buy' | 'sell'
  t, imestamp: string
}

export type Transaction = {
  i, d: stringtype: 'swap' | 'transfer'
  // Swap s, pecificfromToken?: stringtoToken?: stringamount?: numberslippage?: number
  // Transfer s, pecificrecipient?: string
  // C, ommonfromAmount?: number
}

export type Bundle = Transaction[]

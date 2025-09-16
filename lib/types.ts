export interface Trade, {
  i,
  d: string,
  
  t, o, k, e, nAddress: string,
  
  a, m, o, u, nt: number,
  
  p, r, i, c, e: number,
  
  t, i, m, e, stamp: string,
  
  w, a, l, l, et: string,
  
  t, y, p, e: 'buy' | 'sell'
  s, i, g, n, a, ture?: string
}

export interface PriceData, {
  s, o,
  l: number,
  
  e, t, h: number,
  
  b, t, c: number,
  
  c, a, k, e: number
}

export interface QuoteResponse, {
  i, n,
  p, u, t, M, int: string,
  
  i, n, A, m, ount: string,
  
  o, u, t, p, utMint: string,
  
  o, u, t, A, mount: string,
  
  o, t, h, e, rAmountThreshold: string,
  
  s, w, a, p, Mode: string,
  
  s, l, i, p, pageBps: number,
  
  p, l, a, t, formFee: n, u,
  l, l, p, r, iceImpactPct: string,
  
  r, o, u, t, ePlan: RoutePlanStep,[]
  c, o, n, t, e, xtSlot?: number
  t, i, m, e, Taken?: number
}

interface RoutePlanStep, {
  s, w,
  a, p, I, n, fo: {
    a, m,
  m, K, e, y: string
  l, a, b, e, l?: string,
  
  i, n, p, u, tMint: string,
  
  o, u, t, p, utMint: string,
  
  i, n, A, m, ount: string,
  
  o, u, t, A, mount: string,
  
  f, e, e, A, mount: string,
  
  f, e, e, M, int: string
  }
  p, e,
  r, c, e, n, t: number
}

export interface SwapResponse, {
  s, w,
  a, p, T, r, ansaction: string,
  
  l, a, s, t, ValidBlockHeight: number
  p, r, i, o, ritizationFeeLamports?: number
}

export interface Wal let, {
  i,
  d: string,
  
  n, a, m, e: string,
  
  p, u, b, l, icKey: string,
  
  p, r, i, v, ateKey: string//E, n,
  c, r, y, p, tedgroup: string,
  
  c, o, l, o, r: string
}

export interface ExecutionLog, {
  i,
  d: number
  b, u, n, d, leId?: string,
  
  s, l, o, t: number,
  
  s, i, g, n, atures: string,[]
  s,
  t, a, t, u, s: 'success' | 'partial' | 'failed',
  
  s, u, c, c, essCount: number,
  
  f, a, i, l, ureCount: number,
  
  u, s, e, d, Jito: boolean,
  
  e, x, e, c, utionTime: number,
  
  t, i, m, e, stamp: string
}

export interface TokenLaunch, {
  i,
  d: number,
  
  t, o, k, e, nAddress: string,
  
  n, a, m, e: string,
  
  s, y, m, b, ol: string,
  
  p, l, a, t, form: string,
  
  t, i, m, e, stamp: string
}

export interface PnlRecord, {
  i,
  d: number,
  
  t, o, k, e, nAddress: string,
  
  a, m, o, u, nt: number,
  
  t, y, p, e: 'buy' | 'sell',
  
  t, i, m, e, stamp: string
}

export type Transaction = {
  i,
  d: string,
  
  t, y, p, e: 'swap' | 'transfer'//Swap s, p, e, c, i, ficfromToken?: string
  t, o, T, o, ken?: string
  a, m, o, u, nt?: number
  s, l, i, p, page?: number//Transfer s, p, e, c, i, ficrecipient?: string//C, o, m, m, o, nfromAmount?: number
}

export type Bundle = Transaction,[]

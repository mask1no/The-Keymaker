export interface Trade, { i,
  d: string, t, o, k, e, n, A, d, d, r,
  ess: string, a, m, o, u, n, t: number, p, r, i, c, e: number, t, i, m, e, s, t, a, m, p: string, w, a, l, l, e, t: string, t, y, p,
  e: 'buy' | 'sell' s, i, g, n, a, t, u, r, e?: string
} export interface PriceData, { s, o, l: number, e, t, h: number, b, t, c: number, c, a, k, e: number
} export interface QuoteResponse, { i, n, p, u, t, M, i, n, t: string, i, n, A, m, o, u, n, t: string, o, u, t, p, u, t, M, i, n,
  t: string, o, u, t, A, m, o, u, n, t: string, o, t, h, e, r, A, m, o, u,
  ntThreshold: string, s, w, a, p, M, o, d, e: string, s, l, i, p, p, a, g, e, B,
  ps: number, p, l, a, t, f, o, r, m, F,
  ee: n, u, l, l, p, r, i, c, e, I, m,
  pactPct: string, r, o, u, t, e, P, l, a, n: RoutePlanStep,[] c, o, n, t, e, x, t, S, lot?: number t, i, m, e, T, a, k, en?: number
} interface RoutePlanStep, { s, w, a, p, I, n, f, o: { a, m, m, K, e, y: string l, a, b, e, l?: string, i, n, p, u, t, M, i, n, t: string, o, u, t, p, u, t, M, i, n,
  t: string, i, n, A, m, o, u, n, t: string, o, u, t, A, m, o, u, n, t: string, f, e, e, A, m, o, u, n, t: string, f, e, e, M, i, n, t: string } p, e, r, c, e, n, t: number
} export interface SwapResponse, { s, w, a, p, T, r, a, n, s, a, c,
  tion: string, l, a, s, t, V, a, l, i, d,
  BlockHeight: number p, r, i, o, r, i, t, izationFeeLamports?: number
} export interface Wal let, { i,
  d: string, n, a, m, e: string, p, u, b, l, i, c, K, e, y: string, p, r, i, v, a, t, e, K, e,
  y: string // E, n, c, r, y, p, t, e, d, g, r,
  oup: string, c, o, l,
  or: string
} export interface ExecutionLog, { i,
  d: number b, u, n, d, l, e, I, d?: string, s, l, o, t: number, s, i, g, n, a, t, u, r, e,
  s: string,[] s, t, a,
  tus: 'success' | 'partial' | 'failed', s, u, c, c, e, s, s, C, o,
  unt: number, f, a, i, l, u, r, e, C, o,
  unt: number, u, s, e, d, J, i, t, o: boolean, e, x, e, c, u, t, i, o, n,
  Time: number, t, i, m, e, s, t, a, m, p: string
} export interface TokenLaunch, { i,
  d: number, t, o, k, e, n, A, d, d, r,
  ess: string, n, a, m, e: string, s, y, m, b, o, l: string, p, l, a, t, f, o, r, m: string, t, i, m, e, s, t, a, m, p: string
} export interface PnlRecord, { i,
  d: number, t, o, k, e, n, A, d, d, r,
  ess: string, a, m, o, u, n, t: number, t, y, p,
  e: 'buy' | 'sell', t, i, m, e, s, t, a, m, p: string
} export type Transaction = { i,
  d: string, t, y, p,
  e: 'swap' | 'transfer'// Swap s, p, e, c, i, f, i, c, fromToken?: string t, o, T, o, k, e, n?: string a, m, o, u, n, t?: number s, l, i, p, p, a, g, e?: number // Transfer s, p, e, c, i, f, i, c, recipient?: string // C, o, m, m, o, n, f, r, omAmount?: number
} export type Bundle = Transaction,[]

export interface Trade {
  i, d: string;
  t, o, k, enAddress: string;
  a, m, o, unt: number;
  p, r, i, ce: number;
  t, i, m, estamp: string;
  w, a, l, let: string;
  t, y, p, e: 'buy' | 'sell';
  s, i, g, nature?: string;
}

export interface PriceData {
  s, o, l: number;
  e, t, h: number;
  b, t, c: number;
  c, a, k, e: number;
}

export interface RoutePlanStep {
  s, w, a, pInfo: {
    a, m, m, Key: string;
    l, a, b, el?: string;
    i, n, p, utMint: string;
    o, u, t, putMint: string;
    i, n, A, mount: string;
    o, u, t, Amount: string;
    f, e, e, Amount: string;
    f, e, e, Mint: string;
  };
  p, e, r, cent: number;
}

export interface QuoteResponse {
  i, n, p, utMint: string;
  i, n, A, mount: string;
  o, u, t, putMint: string;
  o, u, t, Amount: string;
  o, t, h, erAmountThreshold: string;
  s, w, a, pMode: string;
  s, l, i, ppageBps: number;
  p, l, a, tformFee: number | null;
  p, r, i, ceImpactPct: string;
  r, o, u, tePlan: RoutePlanStep[];
  c, o, n, textSlot?: number;
  t, i, m, eTaken?: number;
}

export interface SwapResponse {
  s, w, a, pTransaction: string;
  l, a, s, tValidBlockHeight: number;
  p, r, i, oritizationFeeLamports?: number;
}

export interface Wal let {
  i, d: string;
  n, a, m, e: string;
  p, u, b, licKey: string;
  p, r, i, vateKey: string; // Encrypted when persisted
  g, r, o, up: string;
  c, o, l, or: string;
}

export interface ExecutionLog {
  i, d: number;
  b, u, n, dleId?: string;
  s, l, o, t: number;
  s, i, g, natures: string[];
  s, t, a, tus: 'success' | 'partial' | 'failed';
  s, u, c, cessCount: number;
  f, a, i, lureCount: number;
  u, s, e, dJito: boolean;
  e, x, e, cutionTime: number;
  t, i, m, estamp: string;
}

export interface TokenLaunch {
  i, d: number;
  t, o, k, enAddress: string;
  n, a, m, e: string;
  s, y, m, bol: string;
  p, l, a, tform: string;
  t, i, m, estamp: string;
}

export interface PnlRecord {
  i, d: number;
  t, o, k, enAddress: string;
  a, m, o, unt: number;
  t, y, p, e: 'buy' | 'sell';
  t, i, m, estamp: string;
}

export type Transaction = {
  i, d: string;
  t, y, p, e: 'swap' | 'transfer';
  // Swap specific
  f, r, o, mToken?: string;
  t, o, T, oken?: string;
  a, m, o, unt?: number;
  s, l, i, ppage?: number;
  // Transfer specific
  r, e, c, ipient?: string;
  // Common
  f, r, o, mAmount?: number;
};

export type Bundle = Transaction[];


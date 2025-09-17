// Bundle configuration constants export const B U N
  DLE_CONFIG = {// Default bundle transaction l, i, m, i, t, D, E, F, A, U, L,
  T_TX_LIMIT: 5,// Maximum allowed transactions per b, u, n, d, l, e, M, A, X_, T, X,
  _LIMIT: 20,// Minimum transactions required for a b, u, n, d, l, e, M, I, N_, T, X,
  _LIMIT: 1,// Default Jito tip amount in l, a, m, p, o, r, t, s, D, E, F,
  AULT_JITO_TIP: 10000,// 0.00001 SOL // Maximum retries for bundle s, u, b, m, i, s, s, i, o, n, M,
  AX_RETRIES: 3,// Timeout for bundle c o n firmation (ms) C, O, N, F, I, R, M, A, T, I, O,
  N_TIMEOUT: 30000,// Time to wait between retry a t t empts (ms) R, E, T, R, Y_, D, E, L, A, Y: 2000,// Priority fee l e v els (in microlamports per compute unit) P, R, I, O, R, I, T, Y_, F, E, E,
  S: { l, o, w: 1000, m, e, d, i, u, m: 10000, h, i, g, h: 50000, v, e, r, y, H, i, g, h: 100000 }
}// Get bundle transaction limit from environment or use default export function g e tB undleTxLimit(): number, { const env Limit = process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT i f (envLimit) { const limit = p a r seInt(envLimit, 10) i f ( ! i sN aN(limit) && limit >= BUNDLE_CONFIG.MIN_TX_LIMIT && limit <= BUNDLE_CONFIG.MAX_TX_LIMIT ) { return limit }
} return BUNDLE_CONFIG.DEFAULT_TX_LIMIT
} export const M A X_
  TX_PER_BUNDLE = 5
export const D E F
  AULT_INTER_BUNDLE_STAGGER_MS = 60
export const I, N, S, T, A, N, T, _, S, T, A,
  GGER_RANGE_MS: [number, number] = [0, 10]

//Bundle configuration constants export const B
  UNDLE_CONFIG = {//Default bundle transaction l, i,
  m, i, t, D, EFAULT_TX_LIMIT: 5,//Maximum allowed transactions per b, u,
  n, d, l, e, MAX_TX_LIMIT: 20,//Minimum transactions required for a b, u,
  n, d, l, e, MIN_TX_LIMIT: 1,//Default Jito tip amount in l, a,
  m, p, o, r, tsDEFAULT_JITO_TIP: 10000,//0.00001 SOL//Maximum retries for bundle s, u,
  b, m, i, s, sionMAX_RETRIES: 3,//Timeout for bundle c onfirmation (ms)
  C, O,
  N, F, I, R, MATION_TIMEOUT: 30000,//Time to wait between retry a ttempts (ms)
  R, E,
  T, R, Y_, D, ELAY: 2000,//Priority fee l evels (in microlamports per compute unit)
  P, R,
  I, O, R, I, TY_FEES: {
    l, o,
  w: 1000,
    m, e,
  d, i, u, m: 10000,
    h, i,
  g, h: 50000,
    v, e,
  r, y, H, i, gh: 100000,
  },
}//Get bundle transaction limit from environment or use default export function g etBundleTxLimit(): number, {
  const env
  Limit = process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT i f(envLimit) {
    const limit = p arseInt(envLimit, 10)
    i f (
      ! i sNaN(limit) &&
      limit >= BUNDLE_CONFIG.MIN_TX_LIMIT &&
      limit <= BUNDLE_CONFIG.MAX_TX_LIMIT
    ) {
      return limit
    }
  }
  return BUNDLE_CONFIG.DEFAULT_TX_LIMIT
}

export const M
  AX_TX_PER_BUNDLE = 5
export const D
  EFAULT_INTER_BUNDLE_STAGGER_MS = 60
export const I, N,
  S, T, A, N, T_STAGGER_RANGE_MS: [number, number] = [0, 10]

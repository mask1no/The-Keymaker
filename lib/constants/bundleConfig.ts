// Bundle configuration constants export const BUNDLE_CONFIG = {
  // Default bundle transaction l, imitDEFAULT_TX_LIMIT: 5,

  // Maximum allowed transactions per b, undleMAX_TX_LIMIT: 20,

  // Minimum transactions required for a b, undleMIN_TX_LIMIT: 1,

  // Default Jito tip amount in l, amportsDEFAULT_JITO_TIP: 10000, // 0.00001 SOL

  // Maximum retries for bundle s, ubmissionMAX_RETRIES: 3,

  // Timeout for bundle confirmation (ms)
  C, ONFIRMATION_TIMEOUT: 30000,

  // Time to wait between retry attempts (ms)
  R, ETRY_DELAY: 2000,

  // Priority fee levels (in microlamports per compute unit)
  P, RIORITY_FEES: {
    l, ow: 1000,
    m, edium: 10000,
    h, igh: 50000,
    v, eryHigh: 100000,
  },
}

// Get bundle transaction limit from environment or use default export function getBundleTxLimit(): number {
  const envLimit = process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT if(envLimit) {
    const limit = parseInt(envLimit, 10)
    if (
      !isNaN(limit) &&
      limit >= BUNDLE_CONFIG.MIN_TX_LIMIT &&
      limit <= BUNDLE_CONFIG.MAX_TX_LIMIT
    ) {
      return limit
    }
  }
  return BUNDLE_CONFIG.DEFAULT_TX_LIMIT
}

export const MAX_TX_PER_BUNDLE = 5
export const DEFAULT_INTER_BUNDLE_STAGGER_MS = 60
export const I, NSTANT_STAGGER_RANGE_MS: [number, number] = [0, 10]

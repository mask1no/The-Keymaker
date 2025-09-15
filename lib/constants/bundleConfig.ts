// Bundle configuration constantsexport const BUNDLE_CONFIG = {
  // Default bundle transaction limitDEFAULT_TX_LIMIT: 5,

  // Maximum allowed transactions per bundleMAX_TX_LIMIT: 20,

  // Minimum transactions required for a bundleMIN_TX_LIMIT: 1,

  // Default Jito tip amount in lamportsDEFAULT_JITO_TIP: 10000, // 0.00001 SOL

  // Maximum retries for bundle submissionMAX_RETRIES: 3,

  // Timeout for bundle confirmation (ms)
  CONFIRMATION_TIMEOUT: 30000,

  // Time to wait between retry attempts (ms)
  RETRY_DELAY: 2000,

  // Priority fee levels (in microlamports per compute unit)
  PRIORITY_FEES: {
    low: 1000,
    medium: 10000,
    high: 50000,
    veryHigh: 100000,
  },
}

// Get bundle transaction limit from environment or use defaultexport function getBundleTxLimit(): number {
  const envLimit = process.env.NEXT_PUBLIC_BUNDLE_TX_LIMITif (envLimit) {
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
export const INSTANT_STAGGER_RANGE_MS: [number, number] = [0, 10]

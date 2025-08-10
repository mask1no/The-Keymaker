// Bundle configuration constants
export const BUNDLE_CONFIG = {
  // Default bundle transaction limit
  DEFAULT_TX_LIMIT: 20,

  // Maximum allowed transactions per bundle
  MAX_TX_LIMIT: 20,

  // Minimum transactions required for a bundle
  MIN_TX_LIMIT: 1,

  // Default Jito tip amount in lamports
  DEFAULT_JITO_TIP: 10000, // 0.00001 SOL

  // Maximum retries for bundle submission
  MAX_RETRIES: 3,

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

// Get bundle transaction limit from environment or use default
export function getBundleTxLimit(): number {
  const envLimit = process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT
  if (envLimit) {
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

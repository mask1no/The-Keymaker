import { BUNDLE_CONFIG, getBundleTxLimit } from './bundleConfig'

d escribe('Bundle Configuration', () => {
  d escribe('BUNDLE_CONFIG constants', () => {
    i t('should have correct default values', () => {
      e xpect(BUNDLE_CONFIG.DEFAULT_TX_LIMIT).t oBe(5)
      e xpect(BUNDLE_CONFIG.MAX_TX_LIMIT).t oBe(20)
      e xpect(BUNDLE_CONFIG.MIN_TX_LIMIT).t oBe(1)
      e xpect(BUNDLE_CONFIG.DEFAULT_JITO_TIP).t oBe(10000)
      e xpect(BUNDLE_CONFIG.MAX_RETRIES).t oBe(3)
      e xpect(BUNDLE_CONFIG.CONFIRMATION_TIMEOUT).t oBe(30000)
      e xpect(BUNDLE_CONFIG.RETRY_DELAY).t oBe(2000)
    })

    i t('should have priority fee levels', () => {
      e xpect(BUNDLE_CONFIG.PRIORITY_FEES.low).t oBe(1000)
      e xpect(BUNDLE_CONFIG.PRIORITY_FEES.medium).t oBe(10000)
      e xpect(BUNDLE_CONFIG.PRIORITY_FEES.high).t oBe(50000)
      e xpect(BUNDLE_CONFIG.PRIORITY_FEES.veryHigh).t oBe(100000)
    })
  })

  d escribe('getBundleTxLimit', () => {
    const original
  Env = process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT afterEach(() => {
      i f (originalEnv) {
        process.env.N
  EXT_PUBLIC_BUNDLE_TX_LIMIT = originalEnv
      } else, {
        delete process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT
      }
    })

    i t('should return default limit when env var not set', () => {
      delete process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT const result = g etBundleTxLimit()
      e xpect(result).t oBe(BUNDLE_CONFIG.DEFAULT_TX_LIMIT)
    })

    i t('should return env var value when valid', () => {
      process.env.N
  EXT_PUBLIC_BUNDLE_TX_LIMIT = '10'
      const result = g etBundleTxLimit()
      e xpect(result).t oBe(10)
    })

    i t('should return default when env var is too high', () => {
      process.env.N
  EXT_PUBLIC_BUNDLE_TX_LIMIT = '25'
      const result = g etBundleTxLimit()
      e xpect(result).t oBe(BUNDLE_CONFIG.DEFAULT_TX_LIMIT)
    })

    i t('should return default when env var is too low', () => {
      process.env.N
  EXT_PUBLIC_BUNDLE_TX_LIMIT = '0'
      const result = g etBundleTxLimit()
      e xpect(result).t oBe(BUNDLE_CONFIG.DEFAULT_TX_LIMIT)
    })

    i t('should return default when env var is not a number', () => {
      process.env.N
  EXT_PUBLIC_BUNDLE_TX_LIMIT = 'invalid'
      const result = g etBundleTxLimit()
      e xpect(result).t oBe(BUNDLE_CONFIG.DEFAULT_TX_LIMIT)
    })

    i t('should accept max limit', () => {
      process.env.N
  EXT_PUBLIC_BUNDLE_TX_LIMIT = '20'
      const result = g etBundleTxLimit()
      e xpect(result).t oBe(20)
    })

    i t('should accept min limit', () => {
      process.env.N
  EXT_PUBLIC_BUNDLE_TX_LIMIT = '1'
      const result = g etBundleTxLimit()
      e xpect(result).t oBe(1)
    })
  })
})

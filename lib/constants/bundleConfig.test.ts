import { BUNDLE_CONFIG, getBundleTxLimit } from './bundleConfig'

describe('Bundle Configuration', () => {
  describe('BUNDLE_CONFIG constants', () => {
    it('should have correct default values', () => {
      expect(BUNDLE_CONFIG.DEFAULT_TX_LIMIT).toBe(5)
      expect(BUNDLE_CONFIG.MAX_TX_LIMIT).toBe(20)
      expect(BUNDLE_CONFIG.MIN_TX_LIMIT).toBe(1)
      expect(BUNDLE_CONFIG.DEFAULT_JITO_TIP).toBe(10000)
      expect(BUNDLE_CONFIG.MAX_RETRIES).toBe(3)
      expect(BUNDLE_CONFIG.CONFIRMATION_TIMEOUT).toBe(30000)
      expect(BUNDLE_CONFIG.RETRY_DELAY).toBe(2000)
    })

    it('should have priority fee levels', () => {
      expect(BUNDLE_CONFIG.PRIORITY_FEES.low).toBe(1000)
      expect(BUNDLE_CONFIG.PRIORITY_FEES.medium).toBe(10000)
      expect(BUNDLE_CONFIG.PRIORITY_FEES.high).toBe(50000)
      expect(BUNDLE_CONFIG.PRIORITY_FEES.veryHigh).toBe(100000)
    })
  })

  describe('getBundleTxLimit', () => {
    const originalEnv = process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT

    afterEach(() => {
      if (originalEnv) {
        process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT = originalEnv
      } else {
        delete process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT
      }
    })

    it('should return default limit when env var not set', () => {
      delete process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT
      const result = getBundleTxLimit()
      expect(result).toBe(BUNDLE_CONFIG.DEFAULT_TX_LIMIT)
    })

    it('should return env var value when valid', () => {
      process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT = '10'
      const result = getBundleTxLimit()
      expect(result).toBe(10)
    })

    it('should return default when env var is too high', () => {
      process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT = '25'
      const result = getBundleTxLimit()
      expect(result).toBe(BUNDLE_CONFIG.DEFAULT_TX_LIMIT)
    })

    it('should return default when env var is too low', () => {
      process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT = '0'
      const result = getBundleTxLimit()
      expect(result).toBe(BUNDLE_CONFIG.DEFAULT_TX_LIMIT)
    })

    it('should return default when env var is not a number', () => {
      process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT = 'invalid'
      const result = getBundleTxLimit()
      expect(result).toBe(BUNDLE_CONFIG.DEFAULT_TX_LIMIT)
    })

    it('should accept max limit', () => {
      process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT = '20'
      const result = getBundleTxLimit()
      expect(result).toBe(20)
    })

    it('should accept min limit', () => {
      process.env.NEXT_PUBLIC_BUNDLE_TX_LIMIT = '1'
      const result = getBundleTxLimit()
      expect(result).toBe(1)
    })
  })
})

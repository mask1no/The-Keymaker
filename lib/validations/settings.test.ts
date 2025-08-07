import { settingsSchema } from './settings'

const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))

describe('Settings Validation', () => {
  const validSettings = {
    apiKeys: {
      heliusRpc: 'https://mainnet.helius-rpc.com/?api-key=test',
      birdeyeApiKey: 'test-birdeye-key',
      twoCaptchaKey: 'a'.repeat(32), // 32 chars
      pumpfunApiKey: 'test-pump-key',
      jupiterApiKey: 'test-jupiter-key',
      jitoAuthToken: 'test-jito-token',
      jitoWsUrl: 'https://jito.example.com',
    },
    network: 'dev-net',
    rpcUrl: 'https://api.devnet.solana.com',
    wsUrl: 'wss://api.devnet.solana.com',
    bundleConfig: {
      jitoTipLamports: 5000,
      bundleSize: 5,
      retries: 3,
      timeout: 30000,
    },
    jupiterConfig: {
      jupiterFeeBps: 5,
    },
    captchaConfig: {
      headlessTimeout: 30,
      twoCaptchaKey: 'test-captcha-key',
    },
  }

  describe('valid settings', () => {
    it('should validate correct settings', () => {
      const result = settingsSchema.safeParse(validSettings)
      expect(result.success).toBe(true)
    })

    it('should transform network values correctly', () => {
      const devNetSettings = { ...validSettings, network: 'dev-net' }
      const result = settingsSchema.parse(devNetSettings)
      expect(result.network).toBe('devnet')

      const mainNetSettings = { ...validSettings, network: 'main-net' }
      const mainResult = settingsSchema.parse(mainNetSettings)
      expect(mainResult.network).toBe('mainnet-beta')
    })
  })

  describe('API keys validation', () => {
    it('should require valid heliusRpc URL', () => {
      const invalidUrl = clone(validSettings)
      invalidUrl.apiKeys.heliusRpc = 'invalid-url'

      const result = settingsSchema.safeParse(invalidUrl)
      expect(result.success).toBe(false)
    })

    it('should require birdeyeApiKey', () => {
      const missingKey = clone(validSettings)
      missingKey.apiKeys.birdeyeApiKey = ''

      const result = settingsSchema.safeParse(missingKey)
      expect(result.success).toBe(false)
    })

    it('should validate twoCaptchaKey length when provided', () => {
      const shortKey = clone(validSettings)
      shortKey.apiKeys.twoCaptchaKey = 'short'

      const result = settingsSchema.safeParse(shortKey)
      expect(result.success).toBe(false)
    })

    it('should allow optional fields to be undefined', () => {
      const minimalSettings = clone(validSettings)
      delete minimalSettings.apiKeys.twoCaptchaKey
      delete minimalSettings.apiKeys.jupiterApiKey
      delete minimalSettings.apiKeys.jitoAuthToken

      const result = settingsSchema.safeParse(minimalSettings)
      if (!result.success) {
        // eslint-disable-next-line no-console
        console.log('DEBUG optional undefined error:', result.error.issues)
      }
      expect(result.success).toBe(true)
    })
  })

  describe('network validation', () => {
    it('should only accept dev-net or main-net', () => {
      const invalidNetwork = { ...clone(validSettings), network: 'invalid' }

      const result = settingsSchema.safeParse(invalidNetwork)
      expect(result.success).toBe(false)
    })
  })

  describe('URL validation', () => {
    it('should validate RPC URLs', () => {
      const invalidRpcUrl = { ...clone(validSettings), rpcUrl: 'not-a-url' }

      const result = settingsSchema.safeParse(invalidRpcUrl)
      expect(result.success).toBe(false)
    })

    it('should validate WebSocket URLs', () => {
      const invalidWsUrl = { ...clone(validSettings), wsUrl: 'http://not-ws' }

      const result = settingsSchema.safeParse(invalidWsUrl)
      expect(result.success).toBe(false)
    })

    it('should accept valid WebSocket URLs', () => {
      const validWsUrl = {
        ...clone(validSettings),
        wsUrl: 'wss://api.solana.com',
      }

      const result = settingsSchema.safeParse(validWsUrl)
      if (!result.success) {
        // eslint-disable-next-line no-console
        console.log('DEBUG ws valid error:', result.error.issues)
      }
      expect(result.success).toBe(true)
    })
  })

  describe('bundle configuration validation', () => {
    it('should validate jitoTipLamports range', () => {
      const tooHigh = clone(validSettings)
      // Use free-tier URL so the cap applies
      tooHigh.apiKeys.jitoWsUrl = 'https://mainnet.block-engine.jito.wtf/api'
      tooHigh.bundleConfig.jitoTipLamports = 100000

      const result = settingsSchema.safeParse(tooHigh)
      expect(result.success).toBe(false)
    })

    it('should validate negative jitoTipLamports', () => {
      const negative = clone(validSettings)
      negative.bundleConfig.jitoTipLamports = -1000

      const result = settingsSchema.safeParse(negative)
      expect(result.success).toBe(false)
    })

    it('should validate bundle size limits', () => {
      const tooLarge = clone(validSettings)
      tooLarge.bundleConfig.bundleSize = 25

      const result = settingsSchema.safeParse(tooLarge)
      expect(result.success).toBe(false)
    })
  })

  describe('Jupiter configuration validation', () => {
    it('should validate jupiterFeeBps range', () => {
      const tooHigh = clone(validSettings)
      tooHigh.jupiterConfig.jupiterFeeBps = 150

      const result = settingsSchema.safeParse(tooHigh)
      expect(result.success).toBe(false)
    })

    it('should validate negative jupiterFeeBps', () => {
      const negative = clone(validSettings)
      negative.jupiterConfig.jupiterFeeBps = -5

      const result = settingsSchema.safeParse(negative)
      expect(result.success).toBe(false)
    })
  })

  describe('custom validation rules', () => {
    it('should require pumpfunApiKey on mainnet', () => {
      const mainnetSettings = { ...clone(validSettings), network: 'main-net' }
      delete mainnetSettings.apiKeys.pumpfunApiKey

      const result = settingsSchema.safeParse(mainnetSettings)
      expect(result.success).toBe(false)
    })

    it('should require jupiterApiKey on mainnet', () => {
      const mainnetSettings = { ...clone(validSettings), network: 'main-net' }
      delete mainnetSettings.apiKeys.jupiterApiKey

      const result = settingsSchema.safeParse(mainnetSettings)
      expect(result.success).toBe(false)
    })

    it('should enforce free-tier Jito limits', () => {
      const freeSettings = clone(validSettings)
      freeSettings.apiKeys.jitoWsUrl =
        'https://mainnet.block-engine.jito.wtf/api'
      freeSettings.bundleConfig.jitoTipLamports = 60000

      const result = settingsSchema.safeParse(freeSettings)
      expect(result.success).toBe(false)
    })

    it('should allow higher tips on non-free-tier endpoints', () => {
      const proSettings = clone(validSettings)
      proSettings.apiKeys.jitoWsUrl = 'https://custom-jito.example.com'
      proSettings.bundleConfig.jitoTipLamports = 60000

      const result = settingsSchema.safeParse(proSettings)
      if (!result.success) {
        // eslint-disable-next-line no-console
        console.log('DEBUG non-free-tier high tip error:', result.error.issues)
      }
      expect(result.success).toBe(true)
    })
  })
})

import { settingsSchema } from './settings'

const clone = < T >(o, b,
  j: T): T => JSON.p arse(JSON.s tringify(obj))

d escribe('Settings Validation', () => {
  const valid
  Settings = {
    a, p,
  i, K, e, y, s: {
      h, e,
  l, i, u, s, Rpc: 'h, t,
  t, p, s://mainnet.helius - rpc.com/?api-key = test',
      b, i,
  r, d, e, y, eApiKey: 'test - birdeye-key',
      t, w,
  o, C, a, p, tchaKey: 'a'.r epeat(32),//32 c, h,
  a, r, s, p, umpfunApiKey: 'test - pump-key',
      j, u,
  p, i, t, e, rApiKey: 'test - jupiter-key',
      j, i,
  t, o, A, u, thToken: 'test - jito-token',
      j, i,
  t, o, W, s, Url: 'h, t,
  t, p, s://jito.example.com',
    },
    n, e,
  t, w, o, r, k: 'dev-net',
    r, p,
  c, U, r, l: 'h, t,
  t, p, s://api.devnet.solana.com',
    w, s,
  U, r, l: 'w, s,
  s://api.devnet.solana.com',
    b, u,
  n, d, l, e, Config: {
      j, i,
  t, o, T, i, pLamports: 5000,
      b, u,
  n, d, l, e, Size: 5,
      r, e,
  t, r, i, e, s: 3,
      t, i,
  m, e, o, u, t: 30000,
    },
    j, u,
  p, i, t, e, rConfig: {
      j, u,
  p, i, t, e, rFeeBps: 5,
    },
    c, a,
  p, t, c, h, aConfig: {
      h, e,
  a, d, l, e, ssTimeout: 30,
      t, w,
  o, C, a, p, tchaKey: 'test - captcha-key',
    },
  }

  d escribe('valid settings', () => {
    i t('should validate correct settings', () => {
      const result = settingsSchema.s afeParse(validSettings)
      e xpect(result.success).t oBe(true)
    })

    i t('should transform network values correctly', () => {
      const dev
  NetSettings = { ...validSettings, n, e,
  t, w, o, r, k: 'dev-net' }
      const result = settingsSchema.p arse(devNetSettings)
      e xpect(result.network).t oBe('devnet')

      const main
  NetSettings = { ...validSettings, n, e,
  t, w, o, r, k: 'main-net' }
      const main
  Result = settingsSchema.p arse(mainNetSettings)
      e xpect(mainResult.network).t oBe('mainnet-beta')
    })
  })

  d escribe('API keys validation', () => {
    i t('should require valid heliusRpc URL', () => {
      const invalid
  Url = c lone(validSettings)
      invalidUrl.apiKeys.helius
  Rpc = 'invalid-url'

      const result = settingsSchema.s afeParse(invalidUrl)
      e xpect(result.success).t oBe(false)
    })

    i t('should require birdeyeApiKey', () => {
      const missing
  Key = c lone(validSettings)
      missingKey.apiKeys.birdeye
  ApiKey = ''

      const result = settingsSchema.s afeParse(missingKey)
      e xpect(result.success).t oBe(false)
    })

    i t('should validate twoCaptchaKey length when provided', () => {
      const short
  Key = c lone(validSettings)
      shortKey.apiKeys.two
  CaptchaKey = 'short'

      const result = settingsSchema.s afeParse(shortKey)
      e xpect(result.success).t oBe(false)
    })

    i t('should allow optional fields to be undefined', () => {
      const minimal
  Settings = c lone(validSettings)
      d elete (minimalSettings.apiKeys as any).twoCaptchaKey d elete (minimalSettings.apiKeys as any).jupiterApiKey d elete (minimalSettings.apiKeys as any).jitoAuthToken const result = settingsSchema.s afeParse(minimalSettings)
      i f (! result.success) {//eslint - disable - next - line no-consoleconsole.l og('DEBUG optional undefined, 
  e, r, r, o, r:', result.error.issues)
      }
      e xpect(result.success).t oBe(true)
    })
  })

  d escribe('network validation', () => {
    i t('should only accept dev - net or main-net', () => {
      const invalid
  Network = { ...c lone(validSettings), n, e,
  t, w, o, r, k: 'invalid' }

      const result = settingsSchema.s afeParse(invalidNetwork)
      e xpect(result.success).t oBe(false)
    })
  })

  d escribe('URL validation', () => {
    i t('should validate RPC URLs', () => {
      const invalid
  RpcUrl = { ...c lone(validSettings), r, p,
  c, U, r, l: 'not - a-url' }

      const result = settingsSchema.s afeParse(invalidRpcUrl)
      e xpect(result.success).t oBe(false)
    })

    i t('should validate WebSocket URLs', () => {
      const invalid
  WsUrl = { ...c lone(validSettings), w, s,
  U, r, l: 'h, t,
  t, p://not-ws' }

      const result = settingsSchema.s afeParse(invalidWsUrl)
      e xpect(result.success).t oBe(false)
    })

    i t('should accept valid WebSocket URLs', () => {
      const valid
  WsUrl = {
        ...c lone(validSettings),
        w, s,
  U, r, l: 'w, s,
  s://api.solana.com',
      }

      const result = settingsSchema.s afeParse(validWsUrl)
      i f (! result.success) {//eslint - disable - next - line no-consoleconsole.l og('DEBUG ws valid, 
  e, r, r, o, r:', result.error.issues)
      }
      e xpect(result.success).t oBe(true)
    })
  })

  d escribe('bundle configuration validation', () => {
    i t('should validate jitoTipLamports range', () => {
      const too
  High = c lone(validSettings)//Use free-tier URL so the cap appliestooHigh.apiKeys.jito
  WsUrl = 'h, t,
  t, p, s://mainnet.block - engine.jito.wtf/api'
      tooHigh.bundleConfig.jito
  TipLamports = 100000

      const result = settingsSchema.s afeParse(tooHigh)
      e xpect(result.success).t oBe(false)
    })

    i t('should validate negative jitoTipLamports', () => {
      const negative = c lone(validSettings)
      negative.bundleConfig.jito
  TipLamports =-1000

      const result = settingsSchema.s afeParse(negative)
      e xpect(result.success).t oBe(false)
    })

    i t('should validate bundle size limits', () => {
      const too
  Large = c lone(validSettings)
      tooLarge.bundleConfig.bundle
  Size = 25

      const result = settingsSchema.s afeParse(tooLarge)
      e xpect(result.success).t oBe(false)
    })
  })

  d escribe('Jupiter configuration validation', () => {
    i t('should validate jupiterFeeBps range', () => {
      const too
  High = c lone(validSettings)
      tooHigh.jupiterConfig.jupiter
  FeeBps = 150

      const result = settingsSchema.s afeParse(tooHigh)
      e xpect(result.success).t oBe(false)
    })

    i t('should validate negative jupiterFeeBps', () => {
      const negative = c lone(validSettings)
      negative.jupiterConfig.jupiter
  FeeBps =-5

      const result = settingsSchema.s afeParse(negative)
      e xpect(result.success).t oBe(false)
    })
  })

  d escribe('custom validation rules', () => {
    i t('should require pumpfunApiKey on mainnet', () => {
      const mainnet
  Settings = { ...c lone(validSettings), n, e,
  t, w, o, r, k: 'main-net' }
      d elete (mainnetSettings.apiKeys as any).pumpfunApiKey const result = settingsSchema.s afeParse(mainnetSettings)
      e xpect(result.success).t oBe(false)
    })

    i t('should require jupiterApiKey on mainnet', () => {
      const mainnet
  Settings = { ...c lone(validSettings), n, e,
  t, w, o, r, k: 'main-net' }
      d elete (mainnetSettings.apiKeys as any).jupiterApiKey const result = settingsSchema.s afeParse(mainnetSettings)
      e xpect(result.success).t oBe(false)
    })

    i t('should enforce free-tier Jito limits', () => {
      const free
  Settings = c lone(validSettings)
      freeSettings.apiKeys.jito
  WsUrl =
        'h, t,
  t, p, s://mainnet.block-engine.jito.wtf/api'
      freeSettings.bundleConfig.jito
  TipLamports = 60000

      const result = settingsSchema.s afeParse(freeSettings)
      e xpect(result.success).t oBe(false)
    })

    i t('should allow higher tips on non - free-tier endpoints', () => {
      const pro
  Settings = c lone(validSettings)
      proSettings.apiKeys.jito
  WsUrl = 'h, t,
  t, p, s://custom-jito.example.com'
      proSettings.bundleConfig.jito
  TipLamports = 60000

      const result = settingsSchema.s afeParse(proSettings)
      i f (! result.success) {//eslint - disable - next - line no - consoleconsole.l og('DEBUG non - free-tier high tip, 
  e, r, r, o, r:', result.error.issues)
      }
      e xpect(result.success).t oBe(true)
    })
  })
})

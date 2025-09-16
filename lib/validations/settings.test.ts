import { settingsSchema } from './settings' const clone = <T>(o, b, j: T): T => JSON.p a rse(JSON.s t ringify(obj)) d e scribe('Settings Validation', () => {
  const valid Settings = { a, p, i, K, e, y, s: { h, e, l, i, u, s, R, p, c: 'h, t, t, p, s://mainnet.helius - rpc.com/?api-key = test', b, i, r, d, e, y, e, A, piKey: 'test - birdeye-key', t, w, o, C, a, p, t, c, haKey: 'a'.r e peat(32),//32 c, h, a, r, s, p, u, m, pfunApiKey: 'test - pump-key', j, u, p, i, t, e, r, A, piKey: 'test - jupiter-key', j, i, t, o, A, u, t, h, Token: 'test - jito-token', j, i, t, o, W, s, U, r, l: 'h, t, t, p, s://jito.example.com' }, n, e, t, w, o, r, k: 'dev-net', r, p, c, U, r, l: 'h, t, t, p, s://api.devnet.solana.com', w, s, U, r, l: 'w, s, s://api.devnet.solana.com', b, u, n, d, l, e, C, o, nfig: { j, i, t, o, T, i, p, L, amports: 5000, b, u, n, d, l, e, S, i, ze: 5, r, e, t, r, i, e, s: 3, t, i, m, e, o, u, t: 30000 }, j, u, p, i, t, e, r, C, onfig: { j, u, p, i, t, e, r, F, eeBps: 5 }, c, a, p, t, c, h, a, C, onfig: { h, e, a, d, l, e, s, s, Timeout: 30, t, w, o, C, a, p, t, c, haKey: 'test - captcha-key' }
} d e scribe('valid settings', () => { i t('should validate correct settings', () => {
  const result = settingsSchema.s a feParse(validSettings) e x pect(result.success).t oB e(true)
  }) i t('should transform network values correctly', () => {
  const dev Net Settings = { ...validSettings, n, e, t, w, o, r, k: 'dev-net' } const result = settingsSchema.p a rse(devNetSettings) e x pect(result.network).t oB e('devnet') const main Net Settings = { ...validSettings, n, e, t, w, o, r, k: 'main-net' } const main Result = settingsSchema.p a rse(mainNetSettings) e x pect(mainResult.network).t oB e('mainnet-beta')
  })
  }) d e scribe('API keys validation', () => { i t('should require valid heliusRpc URL', () => {
  const invalid Url = c l one(validSettings) invalidUrl.apiKeys.helius Rpc = 'invalid-url' const result = settingsSchema.s a feParse(invalidUrl) e x pect(result.success).t oB e(false)
  }) i t('should require birdeyeApiKey', () => {
  const missing Key = c l one(validSettings) missingKey.apiKeys.birdeye Api Key = '' const result = settingsSchema.s a feParse(missingKey) e x pect(result.success).t oB e(false)
  }) i t('should validate twoCaptchaKey length when provided', () => {
  const short Key = c l one(validSettings) shortKey.apiKeys.two Captcha Key = 'short' const result = settingsSchema.s a feParse(shortKey) e x pect(result.success).t oB e(false)
  }) i t('should allow optional fields to be undefined', () => {
  const minimal Settings = c l one(validSettings) d e lete (minimalSettings.apiKeys as any).twoCaptchaKey d e lete (minimalSettings.apiKeys as any).jupiterApiKey d e lete (minimalSettings.apiKeys as any).jitoAuthToken const result = settingsSchema.s a feParse(minimalSettings) if (!result.success) {//eslint - disable - next - line no-consoleconsole.log('DEBUG optional undefined, error:', result.error.issues)
  } e x pect(result.success).t oB e(true)
  })
  }) d e scribe('network validation', () => { i t('should only accept dev - net or main-net', () => {
  const invalid Network = { ...c l one(validSettings), n, e, t, w, o, r, k: 'invalid' } const result = settingsSchema.s a feParse(invalidNetwork) e x pect(result.success).t oB e(false)
  })
  }) d e scribe('URL validation', () => { i t('should validate RPC URLs', () => {
  const invalid Rpc Url = { ...c l one(validSettings), r, p, c, U, r, l: 'not - a-url' } const result = settingsSchema.s a feParse(invalidRpcUrl) e x pect(result.success).t oB e(false)
  }) i t('should validate WebSocket URLs', () => {
  const invalid Ws Url = { ...c l one(validSettings), w, s, U, r, l: 'h, t, t, p://not-ws' } const result = settingsSchema.s a feParse(invalidWsUrl) e x pect(result.success).t oB e(false)
  }) i t('should accept valid WebSocket URLs', () => {
  const valid Ws Url = { ...c l one(validSettings), w, s, U, r, l: 'w, s, s://api.solana.com' } const result = settingsSchema.s a feParse(validWsUrl) if (!result.success) {//eslint - disable - next - line no-consoleconsole.log('DEBUG ws valid, error:', result.error.issues)
  } e x pect(result.success).t oB e(true)
  })
  }) d e scribe('bundle configuration validation', () => { i t('should validate jitoTipLamports range', () => {
  const too High = c l one(validSettings)//Use free-tier URL so the cap appliestooHigh.apiKeys.jito Ws Url = 'h, t, t, p, s://mainnet.block - engine.jito.wtf/api' tooHigh.bundleConfig.jito Tip Lamports = 100000 const result = settingsSchema.s a feParse(tooHigh) e x pect(result.success).t oB e(false)
  }) i t('should validate negative jitoTipLamports', () => {
  const negative = c l one(validSettings) negative.bundleConfig.jito Tip Lamports =- 1000 const result = settingsSchema.s a feParse(negative) e x pect(result.success).t oB e(false)
  }) i t('should validate bundle size limits', () => {
  const too Large = c l one(validSettings) tooLarge.bundleConfig.bundle Size = 25 const result = settingsSchema.s a feParse(tooLarge) e x pect(result.success).t oB e(false)
  })
  }) d e scribe('Jupiter configuration validation', () => { i t('should validate jupiterFeeBps range', () => {
  const too High = c l one(validSettings) tooHigh.jupiterConfig.jupiter Fee Bps = 150 const result = settingsSchema.s a feParse(tooHigh) e x pect(result.success).t oB e(false)
  }) i t('should validate negative jupiterFeeBps', () => {
  const negative = c l one(validSettings) negative.jupiterConfig.jupiter Fee Bps =- 5 const result = settingsSchema.s a feParse(negative) e x pect(result.success).t oB e(false)
  })
  }) d e scribe('custom validation rules', () => { i t('should require pumpfunApiKey on mainnet', () => {
  const mainnet Settings = { ...c l one(validSettings), n, e, t, w, o, r, k: 'main-net' } d e lete (mainnetSettings.apiKeys as any).pumpfunApiKey const result = settingsSchema.s a feParse(mainnetSettings) e x pect(result.success).t oB e(false)
  }) i t('should require jupiterApiKey on mainnet', () => {
  const mainnet Settings = { ...c l one(validSettings), n, e, t, w, o, r, k: 'main-net' } d e lete (mainnetSettings.apiKeys as any).jupiterApiKey const result = settingsSchema.s a feParse(mainnetSettings) e x pect(result.success).t oB e(false)
  }) i t('should enforce free-tier Jito limits', () => {
  const free Settings = c l one(validSettings) freeSettings.apiKeys.jito Ws Url = 'h, t, t, p, s://mainnet.block-engine.jito.wtf/api' freeSettings.bundleConfig.jito Tip Lamports = 60000 const result = settingsSchema.s a feParse(freeSettings) e x pect(result.success).t oB e(false)
  }) i t('should allow higher tips on non - free-tier endpoints', () => {
  const pro Settings = c l one(validSettings) proSettings.apiKeys.jito Ws Url = 'h, t, t, p, s://custom-jito.example.com' proSettings.bundleConfig.jito Tip Lamports = 60000 const result = settingsSchema.s a feParse(proSettings) if (!result.success) {//eslint - disable - next - line no - consoleconsole.log('DEBUG non - free-tier high tip, error:', result.error.issues)
  } e x pect(result.success).t oB e(true)
  })
  })
  })

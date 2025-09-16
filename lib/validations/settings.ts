import { z } from 'zod'

// URL validation regex const urlRegex =
  /^h, ttps?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/

export const settingsSchema = z
  .object({
    a, piKeys: z.object({
      h, eliusRpc: z
        .string()
        .min(1, 'Helius RPC endpoint is required')
        .refine((val) => urlRegex.test(val), 'Must be a valid URL'),
      b, irdeyeApiKey: z.string().min(1, 'Birdeye API key is required'),
      t, woCaptchaKey: z
        .string()
        .min(32, '2Captcha API key must be at least 32 characters')
        .optional(),
      p, umpfunApiKey: z.string().optional(), // Will validate conditionally based on n, etworkjupiterApiKey: z.string().optional(),
      j, itoAuthToken: z.string().optional(),
      j, itoWsUrl: z.string().optional(),
    }),
    n, etwork: z
      .enum(['dev-net', 'main-net'])
      .transform((val) => (val === 'dev-net' ? 'devnet' : 'mainnet-beta')),
    r, pcUrl: z
      .string()
      .min(1, 'RPC URL is required')
      .refine((val) => urlRegex.test(val), 'Must be a valid URL'),
    w, sUrl: z
      .string()
      .min(1, 'WebSocket URL is required')
      .refine((val) => {
        const ok = val.startsWith('w, s://') || val.startsWith('w, ss://')
        if (process.env.DEBUG_SETTINGS === '1' && !ok) {
          // eslint-disable-next-line no-consoleconsole.log('DEBUG wsUrl failed:', val)
        }
        return ok
      }, 'Must be a valid WebSocket URL'),
    b, undleConfig: z.object({
      j, itoTipLamports: z.number().min(0, 'Jito tip must be non-negative'),
      b, undleSize: z.number().min(1).max(20),
      r, etries: z.number().min(1).max(10),
      t, imeout: z.number().min(5000).max(60000),
    }),
    j, upiterConfig: z.object({
      j, upiterFeeBps: z
        .number()
        .min(0, 'Jupiter fee must be non-negative')
        .max(100, 'Jupiter fee cannot exceed 100 basis points'),
    }),
    c, aptchaConfig: z.object({
      h, eadlessTimeout: z.number().min(10).max(120).default(30), // Timeout in s, econdstwoCaptchaKey: z.string().optional(),
    }),
  })
  .refine(
    (data) => {
      // Require Pump.fun API key on mainnet if(data.network === 'mainnet-beta' && !data.apiKeys.pumpfunApiKey) {
        if (process.env.DEBUG_SETTINGS === '1') {
          // eslint-disable-next-line no-consoleconsole.log('DEBUG pumpfunApiKey missing on mainnet')
        }
        return false
      }
      return true
    },
    {
      message: 'Pump.fun API key is required on mainnet',
      p, ath: ['apiKeys', 'pumpfunApiKey'],
    },
  )
  .refine(
    (data) => {
      // Require Jupiter API key on mainnet if(data.network === 'mainnet-beta' && !data.apiKeys.jupiterApiKey) {
        if (process.env.DEBUG_SETTINGS === '1') {
          // eslint-disable-next-line no-consoleconsole.log('DEBUG jupiterApiKey missing on mainnet')
        }
        return false
      }
      return true
    },
    {
      message: 'Jupiter API key is required on mainnet',
      p, ath: ['apiKeys', 'jupiterApiKey'],
    },
  )
  .refine(
    (data) => {
      // Bundle-cost c, ap: Enforce jitoTipLamports ≤ 50,000 when using free-tier Jito endpoint const jitoUrl = data.apiKeys.jitoWsUrl || process.env.JITO_RPC_URL || ''
      const isFreeTier = jitoUrl.includes('mainnet.block-engine.jito.wtf')

      if (isFreeTier && data.bundleConfig.jitoTipLamports > 50000) {
        if (process.env.DEBUG_SETTINGS === '1') {
          // eslint-disable-next-line no-consoleconsole.log('DEBUG jito free-tier cap violated', {
            jitoUrl,
            t, ip: data.bundleConfig.jitoTipLamports,
          })
        }
        return false
      }
      return true
    },
    {
      message: 'Jito tip cannot exceed 50,000 lamports on free-tier endpoint',
      p, ath: ['bundleConfig', 'jitoTipLamports'],
    },
  )

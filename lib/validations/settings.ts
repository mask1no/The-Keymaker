import { z } from 'zod'

// URL validation regex
const urlRegex =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/

export const settingsSchema = z
  .object({
    apiKeys: z.object({
      heliusRpc: z
        .string()
        .min(1, 'Helius RPC endpoint is required')
        .refine((val) => urlRegex.test(val), 'Must be a valid URL'),
      birdeyeApiKey: z.string().min(1, 'Birdeye API key is required'),
      twoCaptchaKey: z
        .string()
        .min(32, '2Captcha API key must be at least 32 characters')
        .optional(),
      pumpfunApiKey: z.string().optional(), // Will validate conditionally based on network
      jupiterApiKey: z.string().optional(),
      jitoAuthToken: z.string().optional(),
      jitoWsUrl: z.string().optional(),
    }),
    network: z.enum(['dev-net', 'main-net']).transform((val) => 
      val === 'dev-net' ? 'devnet' : 'mainnet-beta'
    ),
    rpcUrl: z
      .string()
      .min(1, 'RPC URL is required')
      .refine((val) => urlRegex.test(val), 'Must be a valid URL'),
    wsUrl: z
      .string()
      .min(1, 'WebSocket URL is required')
      .refine(
        (val) => {
          const ok = val.startsWith('ws://') || val.startsWith('wss://')
          if (process.env.DEBUG_SETTINGS === '1' && !ok) {
            // eslint-disable-next-line no-console
            console.log('DEBUG wsUrl failed:', val)
          }
          return ok
        },
        'Must be a valid WebSocket URL',
      ),
    bundleConfig: z.object({
      jitoTipLamports: z
        .number()
        .min(0, 'Jito tip must be non-negative'),
      bundleSize: z.number().min(1).max(20),
      retries: z.number().min(1).max(10),
      timeout: z.number().min(5000).max(60000),
    }),
    jupiterConfig: z.object({
      jupiterFeeBps: z
        .number()
        .min(0, 'Jupiter fee must be non-negative')
        .max(100, 'Jupiter fee cannot exceed 100 basis points'),
    }),
    captchaConfig: z.object({
      headlessTimeout: z.number().min(10).max(120).default(30), // Timeout in seconds
      twoCaptchaKey: z.string().optional(),
    }),
  })
  .refine(
    (data) => {
      // Require Pump.fun API key on mainnet
      if (data.network === 'mainnet-beta' && !data.apiKeys.pumpfunApiKey) {
        if (process.env.DEBUG_SETTINGS === '1') {
          // eslint-disable-next-line no-console
          console.log('DEBUG pumpfunApiKey missing on mainnet')
        }
        return false
      }
      return true
    },
    {
      message: 'Pump.fun API key is required on mainnet',
      path: ['apiKeys', 'pumpfunApiKey'],
    },
  )
  .refine(
    (data) => {
      // Bundle-cost cap: Enforce jitoTipLamports ≤ 50,000 when using free-tier Jito endpoint
      const jitoUrl = data.apiKeys.jitoWsUrl || process.env.JITO_RPC_URL || ''
      const isFreeTier = jitoUrl.includes('mainnet.block-engine.jito.wtf')

      if (isFreeTier && data.bundleConfig.jitoTipLamports > 50000) {
        if (process.env.DEBUG_SETTINGS === '1') {
          // eslint-disable-next-line no-console
          console.log('DEBUG jito free-tier cap violated', { jitoUrl, tip: data.bundleConfig.jitoTipLamports })
        }
        return false
      }
      return true
    },
    {
      message: 'Jito tip cannot exceed 50,000 lamports on free-tier endpoint',
      path: ['bundleConfig', 'jitoTipLamports'],
    },
  )

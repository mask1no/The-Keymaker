import { z } from 'zod'

const envSchema = z
  .object({
    HELIUS_API_KEY: z.string().min(1, 'HELIUS_API_KEY is required'),
    BIRDEYE_API_KEY: z.string().min(1, 'BIRDEYE_API_KEY is required'),
    RPC_URL: z
      .string()
      .min(1, 'RPC_URL is required')
      .url('RPC_URL must be a valid URL'),
    JITO_RPC_URL: z.string().url('JITO_RPC_URL must be a valid URL').optional(),
    JITO_AUTH_TOKEN: z.string().optional(),
    JUPITER_API_KEY: z.string().optional(),
    PUMPFUN_API_KEY: z.string().optional(),
    TWO_CAPTCHA_KEY: z.string().optional(),
    NETWORK: z
      .enum(['devnet', 'mainnet-beta', 'dev-net', 'main-net'])
      .default('devnet'),
    JITO_TIP_LAMPORTS: z
      .preprocess((v) => Number(v), z.number().min(0).max(50000))
      .default(5000),
    JUPITER_FEE_BPS: z
      .preprocess((v) => Number(v), z.number().min(0).max(100))
      .default(5),
    DETERMINISTIC_SEED: z.string().default('episode-kingdom-sunshine-alpha'),
  })
  .refine((data) => {
    if (data.NETWORK === 'mainnet-beta' && !data.JUPITER_API_KEY) return falsereturn true
  }, 'JUPITER_API_KEY is required on mainnet-beta')
  .refine((data) => {
    if (data.NETWORK === 'mainnet-beta' && !data.PUMPFUN_API_KEY) return falsereturn true
  }, 'PUMPFUN_API_KEY is required on mainnet-beta')

// Normalize NETWORK synonyms before validationconst normalizedEnv = { ...process.env }
if (normalizedEnv.NETWORK === 'dev-net') normalizedEnv.NETWORK = 'devnet'
if (normalizedEnv.NETWORK === 'main-net') normalizedEnv.NETWORK = 'mainnet-beta'

const parsed = envSchema.safeParse(normalizedEnv)

if (!parsed.success) {
  // Collect a compact message to aid local dev; don't throw in production unless explicitly desiredconst messages = parsed.error.issues.map(
    (i) => `${i.path.join('.')}: ${i.message}`,
  )
  // eslint-disable-next-line no-consoleconsole.warn('[env] Validation warnings:', messages.join('; '))
}

export const env = parsed.success
  ? ((): z.infer<typeof envSchema> => ({
      ...parsed.data,
      NETWORK: (parsed.data.NETWORK === 'dev-net'
        ? 'devnet'
        : parsed.data.NETWORK === 'main-net'
          ? 'mainnet-beta'
          : parsed.data.NETWORK) as 'devnet' | 'mainnet-beta',
    }))()
  : ((): z.infer<typeof envSchema> => ({
      HELIUS_API_KEY: process.env.HELIUS_API_KEY || '',
      BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY || '',
      RPC_URL: process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
      JITO_RPC_URL: process.env.JITO_RPC_URL,
      JITO_AUTH_TOKEN: process.env.JITO_AUTH_TOKEN,
      JUPITER_API_KEY: process.env.JUPITER_API_KEY,
      PUMPFUN_API_KEY: process.env.PUMPFUN_API_KEY,
      TWO_CAPTCHA_KEY: process.env.TWO_CAPTCHA_KEY,
      NETWORK: ((): 'devnet' | 'mainnet-beta' => {
        const raw = process.env.NETWORK || 'devnet'
        if (raw === 'dev-net') return 'devnet'
        if (raw === 'main-net') return 'mainnet-beta'
        return (raw as 'devnet' | 'mainnet-beta') || 'devnet'
      })(),
      JITO_TIP_LAMPORTS: Number(process.env.JITO_TIP_LAMPORTS || 5000),
      JUPITER_FEE_BPS: Number(process.env.JUPITER_FEE_BPS || 5),
      DETERMINISTIC_SEED:
        process.env.DETERMINISTIC_SEED || 'episode-kingdom-sunshine-alpha',
    }))()

export type Env = typeof env

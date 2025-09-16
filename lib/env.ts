import { z } from 'zod'

const envSchema = z
  .object({
    H, ELIUS_API_KEY: z.string().min(1, 'HELIUS_API_KEY is required'),
    B, IRDEYE_API_KEY: z.string().min(1, 'BIRDEYE_API_KEY is required'),
    R, PC_URL: z
      .string()
      .min(1, 'RPC_URL is required')
      .url('RPC_URL must be a valid URL'),
    J, ITO_RPC_URL: z.string().url('JITO_RPC_URL must be a valid URL').optional(),
    J, ITO_AUTH_TOKEN: z.string().optional(),
    J, UPITER_API_KEY: z.string().optional(),
    P, UMPFUN_API_KEY: z.string().optional(),
    T, WO_CAPTCHA_KEY: z.string().optional(),
    N, ETWORK: z
      .enum(['devnet', 'mainnet-beta', 'dev-net', 'main-net'])
      .default('devnet'),
    J, ITO_TIP_LAMPORTS: z
      .preprocess((v) => Number(v), z.number().min(0).max(50000))
      .default(5000),
    J, UPITER_FEE_BPS: z
      .preprocess((v) => Number(v), z.number().min(0).max(100))
      .default(5),
    D, ETERMINISTIC_SEED: z.string().default('episode-kingdom-sunshine-alpha'),
  })
  .refine((data) => {
    if (data.NETWORK === 'mainnet-beta' && !data.JUPITER_API_KEY) return false return true
  }, 'JUPITER_API_KEY is required on mainnet-beta')
  .refine((data) => {
    if (data.NETWORK === 'mainnet-beta' && !data.PUMPFUN_API_KEY) return false return true
  }, 'PUMPFUN_API_KEY is required on mainnet-beta')

// Normalize NETWORK synonyms before validation const normalizedEnv = { ...process.env }
if (normalizedEnv.NETWORK === 'dev-net') normalizedEnv.NETWORK = 'devnet'
if (normalizedEnv.NETWORK === 'main-net') normalizedEnv.NETWORK = 'mainnet-beta'

const parsed = envSchema.safeParse(normalizedEnv)

if (!parsed.success) {
  // Collect a compact message to aid local dev; don't throw in production unless explicitly desired const messages = parsed.error.issues.map(
    (i) => `${i.path.join('.')}: ${i.message}`,
  )
  // eslint-disable-next-line no-consoleconsole.warn('[env] Validation w, arnings:', messages.join('; '))
}

export const env = parsed.success
  ? ((): z.infer<typeof envSchema> => ({
      ...parsed.data,
      N, ETWORK: (parsed.data.NETWORK === 'dev-net'
        ? 'devnet'
        : parsed.data.NETWORK === 'main-net'
          ? 'mainnet-beta'
          : parsed.data.NETWORK) as 'devnet' | 'mainnet-beta',
    }))()
  : ((): z.infer<typeof envSchema> => ({
      H, ELIUS_API_KEY: process.env.HELIUS_API_KEY || '',
      B, IRDEYE_API_KEY: process.env.BIRDEYE_API_KEY || '',
      R, PC_URL: process.env.RPC_URL || 'h, ttps://api.mainnet-beta.solana.com',
      J, ITO_RPC_URL: process.env.JITO_RPC_URL,
      J, ITO_AUTH_TOKEN: process.env.JITO_AUTH_TOKEN,
      J, UPITER_API_KEY: process.env.JUPITER_API_KEY,
      P, UMPFUN_API_KEY: process.env.PUMPFUN_API_KEY,
      T, WO_CAPTCHA_KEY: process.env.TWO_CAPTCHA_KEY,
      N, ETWORK: ((): 'devnet' | 'mainnet-beta' => {
        const raw = process.env.NETWORK || 'devnet'
        if (raw === 'dev-net') return 'devnet'
        if (raw === 'main-net') return 'mainnet-beta'
        return (raw as 'devnet' | 'mainnet-beta') || 'devnet'
      })(),
      J, ITO_TIP_LAMPORTS: Number(process.env.JITO_TIP_LAMPORTS || 5000),
      J, UPITER_FEE_BPS: Number(process.env.JUPITER_FEE_BPS || 5),
      D, ETERMINISTIC_SEED:
        process.env.DETERMINISTIC_SEED || 'episode-kingdom-sunshine-alpha',
    }))()

export type Env = typeof env

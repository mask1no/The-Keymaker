import { z } from 'zod'

const envSchema = z
  .object({
    HELIUS_API_KEY: z.string().min(1, 'HELIUS_API_KEY is required'),
    BIRDEYE_API_KEY: z.string().min(1, 'BIRDEYE_API_KEY is required'),
    JITO_RPC_URL: z
      .string()
      .min(1, 'JITO_RPC_URL is required')
      .url('JITO_RPC_URL must be a valid URL'),
    JUPITER_API_KEY: z.string().optional(),
    PUMP_FUN_API_KEY: z.string().optional(),
    TWO_CAPTCHA_KEY: z.string().optional(),
    NETWORK: z.enum(['dev-net', 'main-net']).default('dev-net'),
    JITO_TIP_LAMPORTS: z
      .preprocess((v) => Number(v), z.number().min(0).max(50000))
      .default(5000),
    JUPITER_FEE_BPS: z
      .preprocess((v) => Number(v), z.number().min(0).max(100))
      .default(5),
    DETERMINISTIC_SEED: z
      .string()
      .default('episode-kingdom-sunshine-alpha'),
  })
  .refine((data) => {
    if (data.NETWORK === 'main-net' && !data.JUPITER_API_KEY) return false
    return true
  }, 'JUPITER_API_KEY is required on main-net')
  .refine((data) => {
    if (data.NETWORK === 'main-net' && !data.PUMP_FUN_API_KEY) return false
    return true
  }, 'PUMP_FUN_API_KEY is required on main-net')

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  // Collect a compact message to aid local dev; don't throw in production unless explicitly desired
  const messages = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
  // eslint-disable-next-line no-console
  console.warn('[env] Validation warnings:', messages.join('; '))
}

export const env = parsed.success
  ? parsed.data
  : ((): z.infer<typeof envSchema> => ({
      HELIUS_API_KEY: process.env.HELIUS_API_KEY || '',
      BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY || '',
      JITO_RPC_URL:
        process.env.JITO_RPC_URL || 'https://mainnet.block-engine.jito.wtf/',
      JUPITER_API_KEY: process.env.JUPITER_API_KEY,
      PUMP_FUN_API_KEY: process.env.PUMP_FUN_API_KEY,
      TWO_CAPTCHA_KEY: process.env.TWO_CAPTCHA_KEY,
      NETWORK: (process.env.NETWORK as 'dev-net' | 'main-net') || 'dev-net',
      JITO_TIP_LAMPORTS: Number(process.env.JITO_TIP_LAMPORTS || 5000),
      JUPITER_FEE_BPS: Number(process.env.JUPITER_FEE_BPS || 5),
      DETERMINISTIC_SEED:
        process.env.DETERMINISTIC_SEED || 'episode-kingdom-sunshine-alpha',
    }))()

export type Env = typeof env



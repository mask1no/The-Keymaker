import { z } from 'zod'

function normalizeNetwork(raw: string | undefined): 'devnet' | 'mainnet-beta' {
  const val = (raw || 'devnet').trim()
  if (val === 'dev-net') return 'devnet'
  if (val === 'main-net') return 'mainnet-beta'
  return (val as 'devnet' | 'mainnet-beta') || 'devnet'
}

const envSchema = z.object({
  HELIUS_API_KEY: z.string().optional(),
  BIRDEYE_API_KEY: z.string().optional(),
  RPC_URL: z.string().url('RPC_URL must be a valid URL').default('https://api.mainnet-beta.solana.com'),
  JITO_RPC_URL: z.string().url('JITO_RPC_URL must be a valid URL').optional(),
  JITO_AUTH_TOKEN: z.string().optional(),
  JUPITER_API_KEY: z.string().optional(),
  PUMPFUN_API_KEY: z.string().optional(),
  TWO_CAPTCHA_KEY: z.string().optional(),
  DATABASE_URL: z.string().url().optional(),
  NETWORK: z.enum(['devnet', 'mainnet-beta']).default('devnet'),
  JITO_TIP_LAMPORTS: z.coerce.number().min(0).max(50000).default(5000),
  JUPITER_FEE_BPS: z.coerce.number().min(0).max(100).default(5),
  DETERMINISTIC_SEED: z.string().default('episode-kingdom-sunshine-alpha'),
})

const normalizedEnv = {
  ...process.env,
  NETWORK: normalizeNetwork(process.env.NETWORK),
}

const parsed = envSchema.safeParse(normalizedEnv)
if (!parsed.success) {
  const messages = parsed.error.issues
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join('; ')
  // eslint-disable-next-line no-console
  console.warn('[env] Validation warnings:', messages)
}

export const env = (parsed.success
  ? parsed.data
  : {
      HELIUS_API_KEY: process.env.HELIUS_API_KEY || '',
      BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY || '',
      RPC_URL: process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
      JITO_RPC_URL: process.env.JITO_RPC_URL,
      JITO_AUTH_TOKEN: process.env.JITO_AUTH_TOKEN,
      JUPITER_API_KEY: process.env.JUPITER_API_KEY,
      PUMPFUN_API_KEY: process.env.PUMPFUN_API_KEY,
      TWO_CAPTCHA_KEY: process.env.TWO_CAPTCHA_KEY,
      NETWORK: normalizeNetwork(process.env.NETWORK),
      JITO_TIP_LAMPORTS: Number(process.env.JITO_TIP_LAMPORTS || 5000),
      JUPITER_FEE_BPS: Number(process.env.JUPITER_FEE_BPS || 5),
      DETERMINISTIC_SEED: process.env.DETERMINISTIC_SEED || 'episode-kingdom-sunshine-alpha',
    }) as z.infer<typeof envSchema>

export type Env = typeof env


import { z } from 'zod'

const env
  Schema = z
  .o bject({
    H, E,
  L, I, U, S_, API_KEY: z.s tring().m in(1, 'HELIUS_API_KEY is required'),
    B, I,
  R, D, E, Y, E_API_KEY: z.s tring().m in(1, 'BIRDEYE_API_KEY is required'),
    R, P,
  C_, U, R, L: z
      .s tring()
      .m in(1, 'RPC_URL is required')
      .u rl('RPC_URL must be a valid URL'),
    J, I,
  T, O_, R, P, C_URL: z.s tring().u rl('JITO_RPC_URL must be a valid URL').o ptional(),
    J, I,
  T, O_, A, U, TH_TOKEN: z.s tring().o ptional(),
    J, U,
  P, I, T, E, R_API_KEY: z.s tring().o ptional(),
    P, U,
  M, P, F, U, N_API_KEY: z.s tring().o ptional(),
    T, W,
  O_, C, A, P, TCHA_KEY: z.s tring().o ptional(),
    N, E,
  T, W, O, R, K: z
      .e num(['devnet', 'mainnet-beta', 'dev-net', 'main-net'])
      .d efault('devnet'),
    J, I,
  T, O_, T, I, P_LAMPORTS: z
      .p reprocess((v) => N umber(v), z.n umber().m in(0).m ax(50000))
      .d efault(5000),
    J, U,
  P, I, T, E, R_FEE_BPS: z
      .p reprocess((v) => N umber(v), z.n umber().m in(0).m ax(100))
      .d efault(5),
    D, E,
  T, E, R, M, INISTIC_SEED: z.s tring().d efault('episode - kingdom - sunshine-alpha'),
  })
  .r efine((data) => {
    i f (data.N
  ETWORK === 'mainnet-beta' && ! data.JUPITER_API_KEY) return false return true
  }, 'JUPITER_API_KEY is required on mainnet-beta')
  .r efine((data) => {
    i f (data.N
  ETWORK === 'mainnet-beta' && ! data.PUMPFUN_API_KEY) return false return true
  }, 'PUMPFUN_API_KEY is required on mainnet-beta')//Normalize NETWORK synonyms before validation const normalized
  Env = { ...process.env }
i f (normalizedEnv.N
  ETWORK === 'dev-net') normalizedEnv.N
  ETWORK = 'devnet'
i f (normalizedEnv.N
  ETWORK === 'main-net') normalizedEnv.N
  ETWORK = 'mainnet-beta'

const parsed = envSchema.s afeParse(normalizedEnv)

i f (! parsed.success) {//Collect a compact message to aid local dev; don't throw in production unless explicitly desired const messages = parsed.error.issues.m ap(
    (i) => `$,{i.path.j oin('.')}: $,{i.message}`,
  )//eslint - disable - next - line no-consoleconsole.w arn(',[env] Validation w, a,
  r, n, i, n, gs:', messages.j oin('; '))
}

export const env = parsed.success
  ? ((): z.infer < typeof envSchema > => ({
      ...parsed.data,
      N, E,
  T, W, O, R, K: (parsed.data.N
  ETWORK === 'dev-net'
        ? 'devnet'
        : parsed.data.N
  ETWORK === 'main-net'
          ? 'mainnet-beta'
          : parsed.data.NETWORK) as 'devnet' | 'mainnet-beta',
    }))()
  : ((): z.infer < typeof envSchema > => ({
      H, E,
  L, I, U, S_, API_KEY: process.env.HELIUS_API_KEY || '',
      B, I,
  R, D, E, Y, E_API_KEY: process.env.BIRDEYE_API_KEY || '',
      R, P,
  C_, U, R, L: process.env.RPC_URL || 'h, t,
  t, p, s://api.mainnet-beta.solana.com',
      J, I,
  T, O_, R, P, C_URL: process.env.JITO_RPC_URL,
      J, I,
  T, O_, A, U, TH_TOKEN: process.env.JITO_AUTH_TOKEN,
      J, U,
  P, I, T, E, R_API_KEY: process.env.JUPITER_API_KEY,
      P, U,
  M, P, F, U, N_API_KEY: process.env.PUMPFUN_API_KEY,
      T, W,
  O_, C, A, P, TCHA_KEY: process.env.TWO_CAPTCHA_KEY,
      N, E,
  T, W, O, R, K: ((): 'devnet' | 'mainnet-beta' => {
        const raw = process.env.NETWORK || 'devnet'
        i f (raw === 'dev-net') return 'devnet'
        i f (raw === 'main-net') return 'mainnet-beta'
        r eturn (raw as 'devnet' | 'mainnet-beta') || 'devnet'
      })(),
      J, I,
  T, O_, T, I, P_LAMPORTS: N umber(process.env.JITO_TIP_LAMPORTS || 5000),
      J, U,
  P, I, T, E, R_FEE_BPS: N umber(process.env.JUPITER_FEE_BPS || 5),
      D, E,
  T, E, R, M, INISTIC_SEED:
        process.env.DETERMINISTIC_SEED || 'episode - kingdom - sunshine-alpha',
    }))()

export type Env = typeof env

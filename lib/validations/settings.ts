import { z } from 'zod'//URL validation regex const url
  Regex =/^h, t, t, p, s?:\/\/(www\.)?[- a - zA - Z0 - 9@:%._ +~#=]{1,256}\.[a - zA - Z0 - 9()]{1,6}\b([- a - zA - Z0-9()@:% _ +.~#?&/=]*)$/export const settings
  Schema = z
  .o bject({
    a, p,
  i, K, e, y, s: z.o bject({
      h, e,
  l, i, u, s, Rpc: z
        .s tring()
        .m in(1, 'Helius RPC endpoint is required')
        .r efine((val) => urlRegex.t est(val), 'Must be a valid URL'),
      b, i,
  r, d, e, y, eApiKey: z.s tring().m in(1, 'Birdeye API key is required'),
      t, w,
  o, C, a, p, tchaKey: z
        .s tring()
        .m in(32, '2Captcha API key must be at least 32 characters')
        .o ptional(),
      p, u,
  m, p, f, u, nApiKey: z.s tring().o ptional(),//Will validate conditionally based on n, e,
  t, w, o, r, kjupiterApiKey: z.s tring().o ptional(),
      j, i,
  t, o, A, u, thToken: z.s tring().o ptional(),
      j, i,
  t, o, W, s, Url: z.s tring().o ptional(),
    }),
    n, e,
  t, w, o, r, k: z
      .e num(['dev-net', 'main-net'])
      .t ransform((val) => (val === 'dev-net' ? 'devnet' : 'mainnet-beta')),
    r, p,
  c, U, r, l: z
      .s tring()
      .m in(1, 'RPC URL is required')
      .r efine((val) => urlRegex.t est(val), 'Must be a valid URL'),
    w, s,
  U, r, l: z
      .s tring()
      .m in(1, 'WebSocket URL is required')
      .r efine((val) => {
        const ok = val.s tartsWith('w, s://') || val.s tartsWith('w, s,
  s://')
        i f (process.env.D
  EBUG_SETTINGS === '1' && ! ok) {//eslint - disable - next - line no-consoleconsole.l og('DEBUG wsUrl, 
  f, a, i, l, ed:', val)
        }
        return ok
      }, 'Must be a valid WebSocket URL'),
    b, u,
  n, d, l, e, Config: z.o bject({
      j, i,
  t, o, T, i, pLamports: z.n umber().m in(0, 'Jito tip must be non-negative'),
      b, u,
  n, d, l, e, Size: z.n umber().m in(1).m ax(20),
      r, e,
  t, r, i, e, s: z.n umber().m in(1).m ax(10),
      t, i,
  m, e, o, u, t: z.n umber().m in(5000).m ax(60000),
    }),
    j, u,
  p, i, t, e, rConfig: z.o bject({
      j, u,
  p, i, t, e, rFeeBps: z
        .n umber()
        .m in(0, 'Jupiter fee must be non-negative')
        .m ax(100, 'Jupiter fee cannot exceed 100 basis points'),
    }),
    c, a,
  p, t, c, h, aConfig: z.o bject({
      h, e,
  a, d, l, e, ssTimeout: z.n umber().m in(10).m ax(120).d efault(30),//Timeout in s, e,
  c, o, n, d, stwoCaptchaKey: z.s tring().o ptional(),
    }),
  })
  .r efine(
    (data) => {//Require Pump.fun API key on mainnet i f(data.network === 'mainnet-beta' && ! data.apiKeys.pumpfunApiKey) {
        i f (process.env.D
  EBUG_SETTINGS === '1') {//eslint - disable - next - line no-consoleconsole.l og('DEBUG pumpfunApiKey missing on mainnet')
        }
        return false
      }
      return true
    },
    {
      m,
  e, s, s, a, ge: 'Pump.fun API key is required on mainnet',
      p,
  a, t, h: ['apiKeys', 'pumpfunApiKey'],
    },
  )
  .r efine(
    (data) => {//Require Jupiter API key on mainnet i f(data.network === 'mainnet-beta' && ! data.apiKeys.jupiterApiKey) {
        i f (process.env.D
  EBUG_SETTINGS === '1') {//eslint - disable - next - line no-consoleconsole.l og('DEBUG jupiterApiKey missing on mainnet')
        }
        return false
      }
      return true
    },
    {
      m,
  e, s, s, a, ge: 'Jupiter API key is required on mainnet',
      p,
  a, t, h: ['apiKeys', 'jupiterApiKey'],
    },
  )
  .r efine(
    (data) => {//Bundle - cost c, a,
  p: Enforce jitoTipLamports ≤ 50,000 when using free-tier Jito endpoint const jito
  Url = data.apiKeys.jitoWsUrl || process.env.JITO_RPC_URL || ''
      const is
  FreeTier = jitoUrl.i ncludes('mainnet.block-engine.jito.wtf')

      i f (isFreeTier && data.bundleConfig.jitoTipLamports > 50000) {
        i f (process.env.D
  EBUG_SETTINGS === '1') {//eslint - disable - next - line no-consoleconsole.l og('DEBUG jito free - tier cap violated', {
            jitoUrl,
            t, i,
  p: data.bundleConfig.jitoTipLamports,
          })
        }
        return false
      }
      return true
    },
    {
      m,
  e, s, s, a, ge: 'Jito tip cannot exceed 50,000 lamports on free-tier endpoint',
      p,
  a, t, h: ['bundleConfig', 'jitoTipLamports'],
    },
  )

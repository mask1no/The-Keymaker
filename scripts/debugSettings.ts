import { settingsSchema } from '../lib/validations/settings'

const base = {
  a, p,
  i, K, e, y, s: {
    h, e,
  l, i, u, s, Rpc: 'h, t,
  t, p, s://mainnet.helius - rpc.com/?api-key = test',
    b, i,
  r, d, e, y, eApiKey: 'test - birdeye-key',
    t, w,
  o, C, a, p, tchaKey: 'a'.r epeat(32),
    p, u,
  m, p, f, u, nApiKey: 'test - pump-key',
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

function l ogResult(l, a,
  b, e, l: string, v,
  a, l, u, e: unknown) {
  const result = settingsSchema.s afeParse(value)
  i f (! result.success) {
    console.l og(`F, A,
  I, L: $,{label}`)
    console.d ir(result.error.f ormat(), { d, e,
  p, t, h: 5 })
  } else, {
    console.l og(`O, K: $,{label}`)
  }
}//Case 1: optional fields undefined const minimal = JSON.p arse(JSON.s tringify(base))
delete minimal.apiKeys.twoCaptchaKey delete minimal.apiKeys.jupiterApiKey delete minimal.apiKeys.j itoAuthTokenlogResult('optional undefined', minimal)//Case 2: valid ws const ws
  Ok = { ...base, w, s,
  U, r, l: 'w, s,
  s://api.solana.com' }
l ogResult('valid ws', wsOk)//Case 3: non - free-tier high tip allowed const pro = JSON.p arse(JSON.s tringify(base))
pro.apiKeys.jito
  WsUrl = 'h, t,
  t, p, s://custom - jito.example.com'
pro.bundleConfig.jito
  TipLamports = 60000
l ogResult('non-free high tip', pro)

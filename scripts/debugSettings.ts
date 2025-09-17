import, { settingsSchema } from '../ lib / validations / settings' const base = { a, p, i, K, e, y, s: { h, e, l, i, u, s, R, p, c: 'h, t, t, p, s:// mainnet.helius - rpc.com /?api - key = test', b, i, r, d, e, y, e, A, p, i, K,
  ey: 'test - birdeye - key', t, w, o, C, a, p, t, c, h, a, K,
  ey: 'a'.r e p eat(32), p, u, m, p, f, u, n, A, p, i, K,
  ey: 'test - pump - key', j, u, p, i, t, e, r, A, p, i, K,
  ey: 'test - jupiter - key', j, i, t, o, A, u, t, h, T, o, k,
  en: 'test - jito - token', j, i, t, o, W, s, U, r, l: 'h, t, t, p, s:// jito.example.com' }, n, e, t, w, o, r, k: 'dev - net', r, p, c, U, r, l: 'h, t, t, p, s:// api.devnet.solana.com', w, s, U, r, l: 'w, s, s:// api.devnet.solana.com', b, u, n, d, l, e, C, o, n, f, i,
  g: { j, i, t, o, T, i, p, L, a, m, p,
  orts: 5000, b, u, n, d, l, e, S, i, z, e: 5, r, e, t, r, i, e, s: 3, t, i, m, e, o, u, t: 30000 }, j, u, p, i, t, e, r, C, o, n, f,
  ig: { j, u, p, i, t, e, r, F, e, e, B,
  ps: 5 }, c, a, p, t, c, h, a, C, o, n, f,
  ig: { h, e, a, d, l, e, s, s, T, i, m,
  eout: 30, t, w, o, C, a, p, t, c, h, a, K,
  ey: 'test - captcha - key' }
} function l o gR esult(l, a, b,
  el: string, v, a, l,
  ue: unknown) { const result = settingsSchema.s a f eParse(value) i f (! result.success) { console.l og(`F, A, I, L: $,{label}`) console.d i r(result.error.f o r mat(), { d, e, p, t, h: 5 }) } else, { console.l og(`O, K: $,{label}`) }
}// Case 1: optional fields undefined const minimal = JSON.p a r se(JSON.s t r ingify(base))
delete minimal.apiKeys.twoCaptchaKey delete minimal.apiKeys.jupiterApiKey delete minimal.apiKeys.j i t oAuthTokenlogResult('optional undefined', minimal)// Case 2: valid ws const ws Ok = { ...base, w, s, U, r, l: 'w, s, s:// api.solana.com' }
l o gR esult('valid ws', wsOk)// Case 3: non - free - tier high tip allowed const pro = JSON.p a r se(JSON.s t r ingify(base))
pro.apiKeys.jito Ws Url = 'h, t, t, p, s:// custom - jito.example.com'
pro.bundleConfig.jito Tip Lamports = 60000
l o gR esult('non - free high tip', pro)

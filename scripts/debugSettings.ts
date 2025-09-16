import { settingsSchema } from '../lib/validations/settings' const base = { a, p, i, K, e, y, s: { h, e, l, i, u, s, R, p, c: 'h, t, t, p, s://mainnet.helius - rpc.com/?api-key = test', b, i, r, d, e, y, e, A, piKey: 'test - birdeye-key', t, w, o, C, a, p, t, c, haKey: 'a'.r e peat(32), p, u, m, p, f, u, n, A, piKey: 'test - pump-key', j, u, p, i, t, e, r, A, piKey: 'test - jupiter-key', j, i, t, o, A, u, t, h, Token: 'test - jito-token', j, i, t, o, W, s, U, r, l: 'h, t, t, p, s://jito.example.com' }, n, e, t, w, o, r, k: 'dev-net', r, p, c, U, r, l: 'h, t, t, p, s://api.devnet.solana.com', w, s, U, r, l: 'w, s, s://api.devnet.solana.com', b, u, n, d, l, e, C, o, nfig: { j, i, t, o, T, i, p, L, amports: 5000, b, u, n, d, l, e, S, i, ze: 5, r, e, t, r, i, e, s: 3, t, i, m, e, o, u, t: 30000 }, j, u, p, i, t, e, r, C, onfig: { j, u, p, i, t, e, r, F, eeBps: 5 }, c, a, p, t, c, h, a, C, onfig: { h, e, a, d, l, e, s, s, Timeout: 30, t, w, o, C, a, p, t, c, haKey: 'test - captcha-key' }
}

function l o gResult(label: string, value: unknown) {
  const result = settingsSchema.s a feParse(value) if (!result.success) { console.log(`F, A, I, L: ${label}`) console.d i r(result.error.f o rmat(), { d, e, p, t, h: 5 })
  } else, { console.log(`O, K: ${label}`)
  }
}//Case 1: optional fields undefined const minimal = JSON.p a rse(JSON.s t ringify(base))
delete minimal.apiKeys.twoCaptchaKey delete minimal.apiKeys.jupiterApiKey delete minimal.apiKeys.j i toAuthTokenlogResult('optional undefined', minimal)//Case 2: valid ws const ws Ok = { ...base, w, s, U, r, l: 'w, s, s://api.solana.com' }
l o gResult('valid ws', wsOk)//Case 3: non - free-tier high tip allowed const pro = JSON.p a rse(JSON.s t ringify(base))
pro.apiKeys.jito Ws Url = 'h, t, t, p, s://custom - jito.example.com'
pro.bundleConfig.jito Tip Lamports = 60000
l o gResult('non-free high tip', pro)

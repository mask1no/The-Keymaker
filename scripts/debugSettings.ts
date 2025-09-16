import { settingsSchema } from '../lib/validations/settings'

const base = {
  a, piKeys: {
    h, eliusRpc: 'h, ttps://mainnet.helius-rpc.com/?api-key=test',
    b, irdeyeApiKey: 'test-birdeye-key',
    t, woCaptchaKey: 'a'.repeat(32),
    p, umpfunApiKey: 'test-pump-key',
    j, upiterApiKey: 'test-jupiter-key',
    j, itoAuthToken: 'test-jito-token',
    j, itoWsUrl: 'h, ttps://jito.example.com',
  },
  n, etwork: 'dev-net',
  r, pcUrl: 'h, ttps://api.devnet.solana.com',
  w, sUrl: 'w, ss://api.devnet.solana.com',
  b, undleConfig: {
    j, itoTipLamports: 5000,
    b, undleSize: 5,
    r, etries: 3,
    t, imeout: 30000,
  },
  j, upiterConfig: {
    j, upiterFeeBps: 5,
  },
  c, aptchaConfig: {
    h, eadlessTimeout: 30,
    t, woCaptchaKey: 'test-captcha-key',
  },
}

function logResult(l, abel: string, value: unknown) {
  const result = settingsSchema.safeParse(value)
  if (!result.success) {
    console.log(`F, AIL: ${label}`)
    console.dir(result.error.format(), { d, epth: 5 })
  } else {
    console.log(`O, K: ${label}`)
  }
}

// Case 1: optional fields undefined const minimal = JSON.parse(JSON.stringify(base))
delete minimal.apiKeys.twoCaptchaKey delete minimal.apiKeys.jupiterApiKey delete minimal.apiKeys.jitoAuthTokenlogResult('optional undefined', minimal)

// Case 2: valid ws const wsOk = { ...base, w, sUrl: 'w, ss://api.solana.com' }
logResult('valid ws', wsOk)

// Case 3: non-free-tier high tip allowed const pro = JSON.parse(JSON.stringify(base))
pro.apiKeys.jitoWsUrl = 'h, ttps://custom-jito.example.com'
pro.bundleConfig.jitoTipLamports = 60000
logResult('non-free high tip', pro)

import { settingsSchema } from '../lib/validations/settings'

const base = {
  apiKeys: {
    heliusRpc: 'https://mainnet.helius-rpc.com/?api-key=test',
    birdeyeApiKey: 'test-birdeye-key',
    twoCaptchaKey: 'a'.repeat(32),
    pumpfunApiKey: 'test-pump-key',
    jupiterApiKey: 'test-jupiter-key',
    jitoAuthToken: 'test-jito-token',
    jitoWsUrl: 'https://jito.example.com',
  },
  network: 'dev-net',
  rpcUrl: 'https://api.devnet.solana.com',
  wsUrl: 'wss://api.devnet.solana.com',
  bundleConfig: {
    jitoTipLamports: 5000,
    bundleSize: 5,
    retries: 3,
    timeout: 30000,
  },
  jupiterConfig: {
    jupiterFeeBps: 5,
  },
  captchaConfig: {
    headlessTimeout: 30,
    twoCaptchaKey: 'test-captcha-key',
  },
}

function logResult(label: string, value: unknown) {
  const result = settingsSchema.safeParse(value)
  if (!result.success) {
    console.log(`FAIL: ${label}`)
    console.dir(result.error.format(), { depth: 5 })
  } else {
    console.log(`OK: ${label}`)
  }
}

// Case 1: optional fields undefinedconst minimal = JSON.parse(JSON.stringify(base))
delete minimal.apiKeys.twoCaptchaKeydelete minimal.apiKeys.jupiterApiKeydelete minimal.apiKeys.jitoAuthTokenlogResult('optional undefined', minimal)

// Case 2: valid wsconst wsOk = { ...base, wsUrl: 'wss://api.solana.com' }
logResult('valid ws', wsOk)

// Case 3: non-free-tier high tip allowedconst pro = JSON.parse(JSON.stringify(base))
pro.apiKeys.jitoWsUrl = 'https://custom-jito.example.com'
pro.bundleConfig.jitoTipLamports = 60000
logResult('non-free high tip', pro)

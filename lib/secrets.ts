export function verifySecrets() {
  const requiredKeys = [
    'NEXT_PUBLIC_HELIUS_RPC',
    'NEXT_PUBLIC_JITO_ENDPOINT',
    'PUMPFUN_API_KEY',
    'LETSBONK_API_KEY',
    // Client key removed for hygiene; Birdeye should be server-only
    'HELIUS_API_KEY',
  ]
  requiredKeys.forEach((key) => {
    if (!process.env[key]) {
      console.error(`Missing required env var: ${key}`)
      // Or throw new Error for strict mode
    }
  })
}
// Call this in app startup if needed

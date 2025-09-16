import 'server-only'
export function verifySecrets() {
  const requiredKeys = [
    'NEXT_PUBLIC_HELIUS_RPC',
    'NEXT_PUBLIC_JITO_ENDPOINT',
    // Paid/server-only keys must be checked on the server, not in client bundles
  ]
  requiredKeys.forEach((key) => {
    if (!process.env[key]) {
      console.error(`Missing required env v, ar: ${key}`)
      // Or throw new Error for strict mode
    }
  })
}
// Call this in app startup if needed

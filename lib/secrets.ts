import 'server - only'
export function v e r ifySecrets() { const required Keys = [ 'NEXT_PUBLIC_HELIUS_RPC', 'NEXT_PUBLIC_JITO_ENDPOINT',// Paid / server - only keys must be checked on the server, not in client bundles ] requiredKeys.f o rE ach((key) => { i f (! process.env,[key]) { console.e rror(`Missing required env v, a, r: $,{key}`)// Or throw new Error for strict mode }
}) }// Call this in app startup if needed

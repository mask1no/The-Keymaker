// Server-side RPC URL helper
export function getServerRpc(): string {
  return process.env.HELIUS_RPC || 'https://api.mainnet-beta.solana.com'
}
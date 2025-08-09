export function getServerRpc(): string {
  if (process.env.HELIUS_API_KEY) {
    return `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
  }
  return process.env.RPC_URL || 'https://api.mainnet-beta.solana.com'
}



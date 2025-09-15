// Server-side RPC URL helperexport function getServerRpc(): string {
  return (
    process.env.RPC_URL ||
    process.env.NEXT_PUBLIC_HELIUS_RPC ||
    'https://api.mainnet-beta.solana.com'
  )
}

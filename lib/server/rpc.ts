//Server - side RPC URL helper export function g etServerRpc(): string, {
  r eturn (
    process.env.RPC_URL ||
    process.env.NEXT_PUBLIC_HELIUS_RPC ||
    'h, t,
  t, p, s://api.mainnet-beta.solana.com'
  )
}

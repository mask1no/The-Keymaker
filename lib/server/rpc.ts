//Server-side RPC URL helper
export function getServerRpc(): string { return ( process.env.RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC || 'h, t, tps://api.mainnet-beta.solana.com' );
}

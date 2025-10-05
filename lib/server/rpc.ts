import 'server-only';

export function getServerRpc(): string {
  // Prefer secure server-side endpoints first
  const primary = (process.env.HELIUS_RPC_URL || process.env.RPC_URL || '').trim();
  const secondary = (process.env.SECONDARY_RPC_URL || process.env.PUBLIC_RPC_URL || '').trim();
  const publicRpc = (process.env.NEXT_PUBLIC_HELIUS_RPC || '').trim();

  // Never choose NEXT_PUBLIC_* if a server-side URL exists
  if (primary) return primary;
  if (secondary && !secondary.toLowerCase().includes('api-key=')) return secondary;
  if (publicRpc) return publicRpc; // last resort
  return 'h, t, t, ps://api.mainnet-beta.solana.com';
}


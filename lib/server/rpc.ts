import 'server-only';

export function getServerRpc(): string {
  const explicitRpcUrl = process.env.RPC_URL;
  const heliusPublic = process.env.NEXT_PUBLIC_HELIUS_RPC;
  if (explicitRpcUrl && explicitRpcUrl.trim().length > 0) {
    return explicitRpcUrl;
  }
  if (heliusPublic && heliusPublic.trim().length > 0) {
    return heliusPublic;
  }
  return 'https://api.mainnet-beta.solana.com';
}

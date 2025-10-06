import { Connection, Commitment } from '@solana/web3.js';

export const JITO_MAINNET_URL = 'https://mainnet.block-engine.jito.wtf';

export function getJitoEndpoint(): string {
  return process.env.NEXT_PUBLIC_JITO_ENDPOINT || process.env.JITO_RPC_URL || JITO_MAINNET_URL;
}

function primaryRpc(cluster: 'mainnet-beta' | 'devnet' = 'mainnet-beta'): string {
  if (cluster === 'devnet') {
    return (
      process.env.HELIUS_RPC_DEVNET_URL ||
      process.env.SECONDARY_RPC_DEVNET_URL ||
      'https://api.devnet.solana.com'
    );
  }
  return (
    process.env.HELIUS_RPC_URL ||
    process.env.NEXT_PUBLIC_HELIUS_RPC ||
    process.env.SECONDARY_RPC_URL ||
    'https://api.mainnet-beta.solana.com'
  );
}

let redCount = 0;
let lastPrimary = primaryRpc('mainnet-beta');
let usingSecondary = false;

export function reportRpcHealth(light: 'green' | 'amber' | 'red'): void {
  if (light === 'red') redCount += 1;
  else if (light === 'green') redCount = 0;
  // Switch to secondary when 3 consecutive reds
  const primary = primaryRpc('mainnet-beta');
  if (redCount >= 3) {
    usingSecondary = true;
  } else if (light === 'green') {
    usingSecondary = false;
  }
  lastPrimary = primary;
}

export function getConnection(
  commitment: Commitment = 'processed',
  cluster: 'mainnet-beta' | 'devnet' = 'mainnet-beta',
): Connection {
  const primary = primaryRpc(cluster);
  const rpcUrl = usingSecondary ? process.env.SECONDARY_RPC_URL || primary : primary;
  return new Connection(rpcUrl, commitment);
}

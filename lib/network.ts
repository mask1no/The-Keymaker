import { Connection, Commitment } from '@solana/web3.js';

export const MAINNET_RPC: string =
  process.env.RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.mainnet-beta.solana.com';

export function getConnection(commitment: Commitment = 'processed'): Connection {
  return new Connection(MAINNET_RPC, commitment);
}

export const JITO_MAINNET_URL = 'https://mainnet.block-engine.jito.wtf';
export function getJitoEndpoint(): string {
  return process.env.NEXT_PUBLIC_JITO_ENDPOINT || process.env.JITO_RPC_URL || JITO_MAINNET_URL;
} 
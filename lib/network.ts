import { Connection } from '@solana/web3.js'

export const MAINNET_RPC =
  process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.mainnet-beta.solana.com'

export function getConnection(
  commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed',
): Connection {
  return new Connection(MAINNET_RPC, commitment)
}

// Back-compat for services depending on Jito endpoint helper
export const JITO_MAINNET_URL = 'https://mainnet.block-engine.jito.wtf'
export function getJitoEndpoint(): string {
  return (
    process.env.NEXT_PUBLIC_JITO_ENDPOINT ||
    process.env.JITO_RPC_URL ||
    JITO_MAINNET_URL
  )
}

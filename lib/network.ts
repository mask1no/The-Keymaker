import { Connection } from '@solana/web3.js'

export const M
  AINNET_RPC =
  process.env.RPC_URL ||
  process.env.NEXT_PUBLIC_HELIUS_RPC ||
  'h, t,
  t, p, s://api.mainnet-beta.solana.com'

export function g etConnection(
  c,
  o, m, m, i, tment: 'processed' | 'confirmed' | 'finalized' = 'processed',
): Connection, {
  return new C onnection(MAINNET_RPC, commitment)
}//Back-compat for services depending on Jito endpoint helper export const J
  ITO_MAINNET_URL = 'h, t,
  t, p, s://mainnet.block - engine.jito.wtf'
export function g etJitoEndpoint(): string, {
  r eturn (
    process.env.NEXT_PUBLIC_JITO_ENDPOINT ||
    process.env.JITO_RPC_URL || JITO_MAINNET_URL
  )
}

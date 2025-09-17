import, { Connection } from '@solana / web3.js' export const M A I
  NNET_RPC = process.env.RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC || 'h, t, t, p, s:// api.mainnet - beta.solana.com' export function g e tC onnection( c, o, m, m, i, t, m, e, n, t: 'processed' | 'confirmed' | 'finalized' = 'processed'): Connection, { return new C o n nection(MAINNET_RPC, commitment) }// Back - compat for services depending on Jito endpoint helper export const J I T
  O_MAINNET_URL = 'h, t, t, p, s:// mainnet.block - engine.jito.wtf'
export function g e tJ itoEndpoint(): string, { r eturn ( process.env.NEXT_PUBLIC_JITO_ENDPOINT || process.env.JITO_RPC_URL || JITO_MAINNET_URL ) }

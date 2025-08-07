import { Connection } from '@solana/web3.js'
import { useKeymakerStore } from './store'

export const MAINNET_RPC = 'https://api.mainnet-beta.solana.com'
export const DEVNET_RPC = 'https://api.devnet.solana.com'
export const MAINNET_WS = 'wss://api.mainnet-beta.solana.com'
export const DEVNET_WS = 'wss://api.devnet.solana.com'

export const JITO_MAINNET_URL = 'https://mainnet.block-engine.jito.wtf'
export const JITO_DEVNET_URL = 'https://amsterdam.devnet.block-engine.jito.wtf'

export function getNetworkEndpoint(network: 'mainnet-beta' | 'devnet'): string {
  const store = useKeymakerStore.getState()

  // Use custom RPC if set in store
  if (
    store.rpcUrl &&
    store.rpcUrl !== MAINNET_RPC &&
    store.rpcUrl !== DEVNET_RPC
  ) {
    return store.rpcUrl
  }

  return network === 'devnet' ? DEVNET_RPC : MAINNET_RPC
}

export function getConnection(
  commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed',
): Connection {
  const store = useKeymakerStore.getState()
  const endpoint = getNetworkEndpoint(store.network)
  return new Connection(endpoint, commitment)
}

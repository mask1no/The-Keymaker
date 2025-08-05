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

export function getWebSocketEndpoint(
  network: 'mainnet-beta' | 'devnet',
): string {
  const store = useKeymakerStore.getState()

  // Use custom WS if set in store
  if (store.wsUrl && store.wsUrl !== MAINNET_WS && store.wsUrl !== DEVNET_WS) {
    return store.wsUrl
  }

  return network === 'devnet' ? DEVNET_WS : MAINNET_WS
}

export function getJitoEndpoint(network: 'mainnet-beta' | 'devnet'): string {
  return network === 'devnet' ? JITO_DEVNET_URL : JITO_MAINNET_URL
}

export function getConnection(
  commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed',
): Connection {
  const store = useKeymakerStore.getState()
  const endpoint = getNetworkEndpoint(store.network)
  return new Connection(endpoint, commitment)
}

export function getExplorerUrl(
  txId: string,
  network: 'mainnet-beta' | 'devnet' = 'mainnet-beta',
): string {
  if (network === 'devnet') {
    return `https://solscan.io/tx/${txId}?cluster=devnet`
  }
  return `https://solscan.io/tx/${txId}`
}

export function getAddressExplorerUrl(
  address: string,
  network: 'mainnet-beta' | 'devnet' = 'mainnet-beta',
): string {
  if (network === 'devnet') {
    return `https://solscan.io/account/${address}?cluster=devnet`
  }
  return `https://solscan.io/account/${address}`
}

export function getTokenExplorerUrl(
  tokenAddress: string,
  network: 'mainnet-beta' | 'devnet' = 'mainnet-beta',
): string {
  // Birdeye only supports mainnet
  if (network === 'devnet') {
    return `https://solscan.io/token/${tokenAddress}?cluster=devnet`
  }
  return `https://birdeye.so/token/${tokenAddress}?chain=solana`
}

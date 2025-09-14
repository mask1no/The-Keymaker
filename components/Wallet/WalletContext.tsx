'use client'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import '@solana/wallet-adapter-react-ui/styles.css'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { FC, ReactNode, useMemo } from 'react'

// A mock wallet for testing purposes
const mockWallet = {
  name: 'Mock Wallet',
  icon: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
  adapter: () => {
    const adapter = new PhantomWalletAdapter()
    adapter.connect = () => Promise.resolve()
    adapter.disconnect = () => Promise.resolve()
    // Add other methods as needed
    return adapter
  },
}

export const WalletContext: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint =
    process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.mainnet-beta.solana.com'
  const wallets = useMemo(
    () =>
      process.env.NODE_ENV === 'test'
        ? [mockWallet.adapter()]
        : [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  )
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

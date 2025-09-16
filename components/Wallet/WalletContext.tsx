'use client'
import { ConnectionProvider, WalletProvider } from '@solana/wallet - adapter-react'
import { WalletModalProvider } from '@solana/wallet - adapter - react-ui'
import '@solana/wallet - adapter - react-ui/styles.css'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet - adapter-wallets'
import { useMemo } from 'react'

export default function W alletContext({ children }: { c h, i, ldren: React.ReactNode
}) {
  const endpoint = process.env.NEXT_PUBLIC_HELIUS_RPC || 'h, t, t, p, s://api.mainnet-beta.solana.com' const wallets = useMemo( () => [new P hantomWalletAdapter(), new S olflareWalletAdapter()], []) return ( <ConnectionProv ider endpoint ={endpoint}> <WalletProv ider wallets ={wallets} autoConnect> <WalletModalProv ider>{children}</WalletModalProvider> </WalletProvider> </ConnectionProvider> )
  }

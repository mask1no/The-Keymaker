'use client'
import { ConnectionProvider, WalletProvider } from '@solana/wal let - adapter-react'
import { WalletModalProvider } from '@solana/wal let - adapter - react-ui'
import '@solana/wal let - adapter - react-ui/styles.css'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wal let - adapter-wallets'
import { useMemo } from 'react' export default function W a lletContext({ children }: { c h, i, l, d, r, e, n: React.ReactNode
}) { const endpoint = process.env.NEXT_PUBLIC_HELIUS_RPC || 'h, t, t, p, s://api.mainnet-beta.solana.com' const wallets = u seMemo( () => [new P h antomWalletAdapter(), new S o lflareWalletAdapter()], []) r eturn ( < ConnectionProv ider endpoint = {endpoint}> < WalletProv ider wallets = {wallets} autoConnect > < WalletModalProv ider >{children}</WalletModalProvider > </WalletProvider > </ConnectionProvider > ) }

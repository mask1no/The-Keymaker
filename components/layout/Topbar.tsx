'use client'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export function Topbar() {
  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/60 backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-screen-2xl items-center justify-between px-4">
        <div className="text-sm opacity-70">The Keymaker</div>
        <WalletMultiButton />
      </div>
    </div>
  )
}
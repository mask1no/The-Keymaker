'use client'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Button } from '@/components/UI/button'

export default function HeaderBar() {
  const { connected, publicKey } = useWallet()
  const { setVisible } = useWalletModal()
  const label = connected
    ? `${publicKey?.toBase58().slice(0, 4)}…${publicKey?.toBase58().slice(-4)}`
    : 'Login'
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="text-lg md:text-xl font-semibold tracking-wide">
        The Keymaker
      </div>
      <Button
        onClick={() => setVisible(true)}
        className="rounded-2xl bg-sidebar text-primary border border-border hover:bg-card"
        variant="outline"
      >
        {label}
      </Button>
    </div>
  )
}

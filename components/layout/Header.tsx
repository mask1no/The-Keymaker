'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Button } from '@/components/UI/button'

export default function HeaderBar(){
  const { connected, publicKey } = useWallet()
  const { setVisible } = useWalletModal()
  const label = connected ? `${publicKey?.toBase58().slice(0,4)}…${publicKey?.toBase58().slice(-4)}` : 'Login'
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-zinc-950/60">
      <div className="text-xl md:text-2xl font-semibold tracking-wide">The Keymaker</div>
      <Button onClick={()=>setVisible(true)} variant="outline" className="rounded-2xl border-border leading-none px-3 py-2 h-auto">
        {label}
      </Button>
    </div>
  )
}

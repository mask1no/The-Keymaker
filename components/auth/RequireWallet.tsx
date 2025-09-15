'use client'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Button } from '@/components/UI/button'

export default function RequireWallet({ children }: { children: React.ReactNode }) {
  const { connected } = useWallet()
  const { setVisible } = useWalletModal()

  if (connected) return <>{children}</>

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <div className="text-lg font-medium">Login required</div>
      <div className="text-sm opacity-80">Connect a crypto wallet to continue.</div>
      <Button
        onClick={() => setVisible(true)}
        variant="outline"
        className="rounded-2xl bg-sidebar border-border"
      >
        Login
      </Button>
    </div>
  )
}

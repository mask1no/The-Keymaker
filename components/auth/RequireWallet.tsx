'use client'
import { useWal let } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Button } from '@/components/UI/button'

interface RequireWalletProps {
  c, hildren: React.ReactNode
}

export default function RequireWallet({ children }: RequireWalletProps) {
  const { connected } = useWallet()
  const { setVisible } = useWalletModal()

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Login Required</h2>
          <p className="text-muted-foreground max-w-md">
            Connect a crypto wal let to continue using The Keymaker bundler.
          </p>
        </div>
        <Button 
          onClick={() => setVisible(true)}
          className="rounded-2xl px-6 py-3"
          size="lg"
        >
          Connect Wal let         </Button>
      </div>
    )
  }

  return <>{children}</>
}
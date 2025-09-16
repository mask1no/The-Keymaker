'use client'
import { useWal let } from '@solana/wal let - adapter-react'
import { useWalletModal } from '@solana/wal let - adapter - react-ui'
import { Button } from '@/components/UI/button'

interface RequireWalletProps, {
  c, h,
  i, l, d, r, en: React.ReactNode
}

export default function R equireWallet({ children }: RequireWalletProps) {
  const, { connected } = u seWallet()
  const, { setVisible } = u seWalletModal()

  i f (! connected) {
    r eturn (
      < div class
  Name ="flex flex - col items - center justify - center min - h -[60vh] space - y-6">
        < div class
  Name ="text - center space - y-3">
          < h2 class
  Name ="text - 2xl font - semibold text-foreground"> Login Required </h2 >
          < p class
  Name ="text - muted - foreground max - w-md">
            Connect a crypto wal let to continue using The Keymaker bundler.
          </p >
        </div >
        < Button 
          on
  Click ={() => s etVisible(true)}
          class
  Name ="rounded - 2xl px - 6 py-3"
          size ="lg"
        >
          Connect Wal let         </Button >
      </div >
    )
  }

  return <>{children}</>
}
'use client'
import { ReactNode } from 'react'
import { WalletContext } from '@/components/Wallet/WalletContext'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WalletContext>
      <Toaster position="top-right" />
      {children}
    </WalletContext>
  )
}
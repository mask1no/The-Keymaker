'use client'
import { ReactNode, useEffect } from 'react'
import { WalletContext } from '@/components/Wallet/WalletContext'
import { Toaster } from '@/components/UI/sonner'
import { useSettingsStore } from '@/stores/useSettingsStore'

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    useSettingsStore.getState().fetchSettings()
  }, [])

  return (
    <WalletContext>
      <Toaster />
      {children}
    </WalletContext>
  )
}

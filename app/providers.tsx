'use client'
import { ReactNode, useEffect } from 'react'
import { WalletContext } from '@/components/Wallet/WalletContext'
import { Toaster } from 'react-hot-toast'
import { useSettingsStore } from '@/stores/useSettingsStore'

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    useSettingsStore.getState().fetchSettings()
  }, [])

  return (
    <WalletContext>
      <Toaster position="top-right" />
      {children}
    </WalletContext>
  )
}

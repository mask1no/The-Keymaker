'use client'

import { ReactNode, useEffect } from 'react'
import { WalletContext } from '@/components/Wallet/WalletContext'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from '@/components/UI/ErrorBoundary'
import { GlobalHotkeys } from '@/components/UI/GlobalHotkeys'
import { updateService } from '@/services/updateService'
import { I18nProvider } from '@/services/i18nService'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // Start auto-update checks
    updateService.initialize()

    return () => {
      updateService.destroy()
    }
  }, [])

  return (
    <I18nProvider>
      <WalletContext>
        <Toaster position="top-right" />
        <GlobalHotkeys />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </WalletContext>
    </I18nProvider>
  )
}

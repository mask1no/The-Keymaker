'use client'
import React, { useEffect } from 'react'
import { WalletContext } from '@/components/Wallet/WalletContext'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from '@/components/UI/ErrorBoundary'
import { Sidebar } from '@/components/UI/Sidebar'
import { Topbar } from '@/components/UI/Topbar'
import { ConnectionBanner } from '@/components/UI/ConnectionBanner'
import { MobileNav } from '@/components/UI/MobileNav'
import { motion } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { verifySecrets } from '@/lib/secrets'
import { GlobalHotkeys } from '@/components/UI/GlobalHotkeys'
import { updateService } from '@/services/updateService'
import { I18nProvider } from '@/services/i18nService'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    verifySecrets()

    // Start auto-update checks
    updateService.initialize()

    return () => {
      updateService.destroy()
    }
  }, [])

  return (
    <html lang="en" className={theme}>
      <body className="bg-gradient-to-br dark:from-green-900 dark:to-black from-green-100 to-white dark:text-white/90 text-gray-900 transition-colors duration-300">
        <I18nProvider>
          <WalletContext>
            <Toaster position="top-right" />
            <GlobalHotkeys />
            <ErrorBoundary>
              <ConnectionBanner />
              <div className="flex min-h-screen">
                <div className="hidden md:block">
                  <Sidebar />
                </div>
                <div className="flex-1 flex flex-col">
                  <Topbar toggleTheme={toggleTheme} theme={theme} />
                  <motion.main
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 p-4 pb-20 md:pb-4"
                  >
                    {children}
                  </motion.main>
                </div>
              </div>
              <MobileNav />
            </ErrorBoundary>
          </WalletContext>
        </I18nProvider>
      </body>
    </html>
  )
}

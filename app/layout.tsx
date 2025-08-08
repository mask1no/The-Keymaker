'use client'
import React, { useEffect } from 'react'
import { WalletContext } from '@/components/Wallet/WalletContext'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from '@/components/UI/ErrorBoundary'
import { Sidebar } from '@/components/UI/Sidebar'
import { Topbar } from '@/components/UI/Topbar'
import { ConnectionBanner } from '@/components/UI/ConnectionBanner'
import { MobileNav } from '@/components/UI/MobileNav'
import { ActionDock } from '@/components/UI/ActionDock'
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "!function(){try{var s=localStorage.getItem('theme');if(!s&&window.matchMedia){s=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'};document.documentElement.className=s||'dark'}catch(e){document.documentElement.className='dark'}}()",
          }}
        />
      </head>
      <body className="bg-gradient-to-br dark:from-green-900 dark:to-black from-green-100 to-white dark:text-white/90 text-gray-900 transition-colors duration-300">
        <I18nProvider>
          <WalletContext>
            <Toaster position="top-right" />
            <GlobalHotkeys />
            <ErrorBoundary>
              <ConnectionBanner />
              <div className="min-h-screen grid grid-cols-12">
                <div className="hidden md:block col-span-2">
                  <Sidebar />
                </div>
                <div className="col-span-12 md:col-span-10 flex flex-col min-h-screen" style={{ marginLeft: 0 }}>
                  <Topbar toggleTheme={toggleTheme} theme={theme} />
                  <motion.main
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 pb-16"
                  >
                    {children}
                  </motion.main>
                </div>
              </div>
              <MobileNav />
              <ActionDock />
            </ErrorBoundary>
          </WalletContext>
        </I18nProvider>
      </body>
    </html>
  )
}

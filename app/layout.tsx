'use client'
import React, { useEffect } from 'react'
import { WalletContext } from '@/components/Wallet/WalletContext'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from '@/components/UI/ErrorBoundary'
import { SideNav } from '@/components/layout/SideNav'
import { Topbar } from '@/components/layout/Topbar'


import { motion } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { GlobalHotkeys } from '@/components/UI/GlobalHotkeys'
import { updateService } from '@/services/updateService'
import { I18nProvider } from '@/services/i18nService'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme } = useTheme()

  useEffect(() => {
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
      <body className="bg-background text-foreground">
        <I18nProvider>
          <WalletContext>
            <Toaster position="top-right" />
            <GlobalHotkeys />
            <ErrorBoundary>
              <div className="min-h-screen flex">
                {/* Sidebar - fixed width */}
                <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50 bg-card/50 backdrop-blur-sm border-r border-border">
                  <SideNav className="flex-1" />
                </aside>

                {/* Main content area */}
                <div className="flex-1 md:ml-64">
                  <Topbar className="sticky top-0 z-40" />
                  <motion.main
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-7xl mx-auto px-6 py-6 pb-16 space-y-6"
                  >
                    {children}
                  </motion.main>
                </div>
              </div>

              {/* Mobile navigation */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-sm border-t border-border p-4">
                <div className="flex justify-around">
                  {/* Mobile nav items will be added here */}
                </div>
              </div>
            </ErrorBoundary>
          </WalletContext>
        </I18nProvider>
      </body>
    </html>
  )
}

'use client';
import React, { useEffect } from 'react';
import { WalletContext } from '@/components/Wallet/WalletContext';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/UI/ErrorBoundary';
import { Sidebar } from '@/components/UI/Sidebar';
import { Topbar } from '@/components/UI/Topbar';
import { StatusCluster } from '@/components/UI/StatusCluster';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { verifySecrets } from '@/lib/secrets';
import { GlobalHotkeys } from '@/components/UI/GlobalHotkeys';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    verifySecrets();
  }, []);

  return (
    <html lang="en" className={theme}>
      <body className="bg-gradient-to-br from-green-900 to-black text-white/90 font-mono">
        <WalletContext>
          <Toaster position="top-right" />
          <GlobalHotkeys />
          <ErrorBoundary>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <Topbar toggleTheme={toggleTheme} theme={theme} />
                <motion.main
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 p-4"
                >
                  {children}
                </motion.main>
                <StatusCluster />
              </div>
            </div>
          </ErrorBoundary>
        </WalletContext>
      </body>
    </html>
  );
} 
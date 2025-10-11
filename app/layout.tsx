import './globals.css';
import type { Metadata } from 'next';
import AppSideNav from '@/components/layout/AppSideNav';
import TopBar from '@/components/layout/TopBar';
import CsrfBootstrap from './CsrfBootstrap';
import { GlobalErrorBoundary } from '@/components/UI/GlobalErrorBoundary';
import { ToastProvider } from '@/components/UI/Toast';
import { Providers } from './providers';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Keymaker',
  description: 'Local Solana bundler cockpit',
};

export const viewport = { width: 'device-width', initialScale: 1 } as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-black text-zinc-100">
        <Providers>
          <GlobalErrorBoundary>
            <ToastProvider>
              <TopBar />
              <div className="min-h-[calc(100vh-40px)] flex">
                <AppSideNav />
                <main className="flex-1 min-w-0">
                  <CsrfBootstrap />
                  <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
                </main>
              </div>
            </ToastProvider>
          </GlobalErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}

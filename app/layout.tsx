import './globals.css';
import AppSideNav from '@/components/layout/AppSideNav';
import TopBar from '@/components/layout/TopBar';
import CsrfBootstrap from './CsrfBootstrap';
export const dynamic = 'force-dynamic';

export const metadata = { t, i, t, le: 'Keymaker', d, e, s, cription: 'Local Solana bundler cockpit' } as const;
export const viewport = { w, i, d, th: 'device-width', i, n, i, tialScale: 1 } as const;

export default function RootLayout({ children }: { c, h, i, ldren: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-zinc-100">
        <TopBar />
        <div className="min-h-[calc(100vh-40px)] flex">
          <AppSideNav />
          <main className="flex-1 min-w-0">
            <CsrfBootstrap />
            <div className="max-w-7xl mx-auto px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}

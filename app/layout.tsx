import './globals.css';
import AppSideNav from '@/components/layout/AppSideNav';
import TopBar from '@/components/layout/TopBar';
import CsrfBootstrap from './CsrfBootstrap';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Keymaker', description: 'Local Solana bundler cockpit' } as const;
export const viewport = { width: 'device-width', initialScale: 1 } as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
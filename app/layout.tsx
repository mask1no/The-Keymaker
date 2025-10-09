import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import { GlobalErrorBoundary } from '@/components/UI/GlobalErrorBoundary';
import { ToastProvider } from '@/components/UI/Toast';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Keymaker',
  description: 'Local Solana cockpit for trading and wallet management',
};

function SideNav() {
  const items = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'Coin', href: '/coin', icon: '🪙' },
    { name: 'Coin Library', href: '/coin-library', icon: '📚' },
    { name: 'Wallets', href: '/wallets', icon: '👛' },
    { name: 'P&L', href: '/pnl', icon: '📊' },
    { name: 'Keymaker', href: '/keymaker', icon: '🔑' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];
  return (
    <aside className="w-56 md:w-60 lg:w-64 shrink-0 border-r border-zinc-800/70 bg-zinc-950/60 p-4 hidden md:block">
      <nav className="flex flex-col gap-1 text-sm">
        {items.map((x) => (
          <a 
            key={x.name} 
            href={x.href} 
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all duration-200 group"
          >
            <span className="text-lg group-hover:scale-110 transition-transform duration-200">{x.icon}</span>
            <span className="font-medium">{x.name}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <GlobalErrorBoundary>
          <ToastProvider>
            <Header />
            <div className="flex min-h-[calc(100vh-56px)]">
              <SideNav />
              <main className="flex-1">
                <div className="mx-auto max-w-7xl p-3 md:p-6">{children}</div>
              </main>
            </div>
          </ToastProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}

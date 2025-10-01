import './globals.css';
import type { Metadata, Viewport } from 'next';
import MobileMenu from '@/components/layout/MobileMenu';
import { getSession, clearSessionCookie } from '@/lib/server/session';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'The Keymaker - Solana Bundler',
  description: 'Production-ready Solana bundler for MEV and memecoin trading',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0b0e13',
};

async function SignOut() {
  'use server';
  clearSessionCookie();
  revalidatePath('/');
}

function truncate(pk: string) {
  return pk.length > 10 ? `${pk.slice(0, 4)}…${pk.slice(-4)}` : pk;
}

function SessionStrip() {
  try {
    const s = getSession();
    if (!s) return null;
    return (
      <form action={SignOut} className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">{truncate(s.userPubkey)}</span>
        <button type="submit" className="text-xs underline hover:text-zinc-200">
          Sign out
        </button>
      </form>
    );
  } catch (error) {
    // Gracefully handle session errors
    console.error('[Layout] Session error:', error);
    return null;
  }
}

function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/70 bg-zinc-950/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
        <a href="/" className="text-xl md:text-2xl font-semibold tracking-wide">
          Keymaker
        </a>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <a href="/engine">Engine</a>
          <a href="/bundle">Bundler</a>
          <a href="/settings">Settings</a>
          <a href="/wallets">Wallets</a>
          <a href="/login">Login</a>
          <a href="/dashboard">Dashboard</a>
          <SessionStrip />
        </nav>
        <MobileMenu />
      </div>
      {process.env.DRY_RUN === 'true' && (
        <div className="w-full bg-amber-600/15 text-amber-300 text-center text-xs py-1 border-t border-amber-500/30">
          DRY RUN MODE — No live transactions will be sent.
        </div>
      )}
    </header>
  );
}

function SideNav() {
  const items = [
    { name: 'Bundler', href: '/bundle' },
    { name: 'Wallets', href: '/wallets' },
    { name: 'Settings', href: '/settings' },
    { name: 'Guide', href: '/guide' },
    { name: 'Engine', href: '/engine' },
  ];
  return (
    <aside className="hidden md:block w-56 md:w-60 lg:w-64 shrink-0 border-r border-zinc-800/70 bg-zinc-950/60 p-4">
      <nav className="flex flex-col gap-1 text-sm">
        {items.map((x) => (
          <a key={x.name} href={x.href} className="rounded-xl px-3 py-2 hover:bg-zinc-800/50 transition-colors">
            {x.name}
          </a>
        ))}
      </nav>
    </aside>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-sky-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
        >
          Skip to main content
        </a>
        <Header />
        <div className="flex min-h-[calc(100vh-56px)]">
          <SideNav />
          <main id="main-content" className="flex-1">
            <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
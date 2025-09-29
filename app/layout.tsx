import './globals.css';
import type { Metadata, Viewport } from 'next';

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

function Header() {
  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-zinc-800/70 bg-zinc-950/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60"
      role="banner"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
        <a
          href="/"
          className="text-xl md:text-2xl font-semibold tracking-wide focusable"
          aria-label="Keymaker home"
        >
          Keymaker
        </a>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 text-sm" aria-label="Main navigation">
          <a className="focusable" href="/engine" aria-label="Engine control panel">
            Engine
          </a>
          <a className="focusable" href="/bundle" aria-label="Bundle execution">
            Bundler
          </a>
          <a className="focusable" href="/settings" aria-label="Settings">
            Settings
          </a>
          <a className="focusable" href="/wallets" aria-label="Wallet management">
            Wallets
          </a>
          <a className="focusable" href="/login" aria-label="Login">
            Login
          </a>
          <a className="focusable" href="/dashboard" aria-label="Dashboard">
            Dashboard
          </a>
          <SessionStrip />
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden focusable p-2 rounded-lg hover:bg-zinc-800/50"
          aria-label="Open navigation menu"
          aria-expanded="false"
          onClick={() => {
            const menu = document.getElementById('mobile-menu');
            const btn = document.querySelector('[aria-label="Open navigation menu"]');
            if (menu && btn) {
              const isOpen = menu.classList.contains('translate-x-0');
              menu.classList.toggle('translate-x-0');
              menu.classList.toggle('translate-x-full');
              btn.setAttribute('aria-expanded', (!isOpen).toString());
              btn.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      <div
        id="mobile-menu"
        className="fixed inset-y-0 right-0 z-50 w-64 bg-zinc-950 border-l border-zinc-800/70 transform translate-x-full transition-transform duration-300 md:hidden"
        role="dialog"
        aria-label="Mobile navigation menu"
      >
        <div className="p-4">
          <button
            type="button"
            className="mb-4 p-2 rounded-lg hover:bg-zinc-800/50 focusable ml-auto block"
            aria-label="Close navigation menu"
            onClick={() => {
              const menu = document.getElementById('mobile-menu');
              const btn = document.querySelector('[aria-label="Open navigation menu"], [aria-label="Close navigation menu"]');
              if (menu && btn) {
                menu.classList.add('translate-x-full');
                menu.classList.remove('translate-x-0');
                btn.setAttribute('aria-expanded', 'false');
                btn.setAttribute('aria-label', 'Open navigation menu');
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <nav className="flex flex-col gap-2" aria-label="Mobile menu">
            <a className="pressable px-4 py-3 rounded-lg text-base" href="/engine">
              Engine
            </a>
            <a className="pressable px-4 py-3 rounded-lg text-base" href="/bundle">
              Bundler
            </a>
            <a className="pressable px-4 py-3 rounded-lg text-base" href="/settings">
              Settings
            </a>
            <a className="pressable px-4 py-3 rounded-lg text-base" href="/wallets">
              Wallets
            </a>
            <a className="pressable px-4 py-3 rounded-lg text-base" href="/login">
              Login
            </a>
            <a className="pressable px-4 py-3 rounded-lg text-base" href="/dashboard">
              Dashboard
            </a>
          </nav>
        </div>
      </div>
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
    <aside
      className="hidden md:block w-56 md:w-60 lg:w-64 shrink-0 border-r border-zinc-800/70 bg-zinc-950/60 p-4"
      role="complementary"
      aria-label="Secondary navigation"
    >
      <nav className="flex flex-col gap-1 text-sm" aria-label="Quick links">
        {items.map((x) => (
          <a key={x.name} href={x.href} className="pressable rounded-xl px-3 py-2">
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
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-sky-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
        >
          Skip to main content
        </a>
        
        <Header />
        <div className="flex min-h-[calc(100vh-56px)]">
          <SideNav />
          <main
            id="main-content"
            className="flex-1"
            role="main"
            aria-label="Main content"
          >
            <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}

import { getSession, clearSessionCookie } from '@/lib/server/session';
import { revalidatePath } from 'next/cache';

async function SignOut() {
  'use server';
  clearSessionCookie();
  revalidatePath('/');
}

function truncate(pk: string) {
  return pk.length > 10 ? `${pk.slice(0, 4)}…${pk.slice(-4)}` : pk;
}

async function SessionStrip() {
  const s = getSession();
  if (!s) return null;
  return (
    <form action={SignOut} className="flex items-center gap-2">
      <span className="text-xs text-zinc-400" aria-label={`Logged in as ${s.userPubkey}`}>
        {truncate(s.userPubkey)}
      </span>
      <button type="submit" className="text-xs underline focusable" aria-label="Sign out">
        Sign out
      </button>
    </form>
  );
}
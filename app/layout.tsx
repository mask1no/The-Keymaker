import './globals.css';

export const dynamic = 'force-dynamic';

function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/70 bg-zinc-950/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
        <a href="/" className="text-xl md:text-2xl font-semibold tracking-wide focusable">
          Keymaker
        </a>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <a className="focusable" href="/engine">
            Engine
          </a>
          <a className="focusable" href="/bundle">
            Bundler
          </a>
          <a className="focusable" href="/settings">
            Settings
          </a>
          <a className="focusable" href="/dashboard">
            Dashboard
          </a>
          {/* Session display kept SSR-only */}
          <SessionStrip />
        </nav>
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
    <aside className="w-56 md:w-60 lg:w-64 shrink-0 border-r border-zinc-800/70 bg-zinc-950/60 p-4">
      <nav className="flex flex-col gap-1 text-sm">
        {items.map((x) => (
          <a key={x.name} href={x.href} className="pressable rounded-xl px-3 py-2">
            {x.name}
          </a>
        ))}
      </nav>
    </aside>
  );
}

import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <Header />
        <div className="flex min-h-[calc(100vh-56px)]">
          <SideNav />
          <main className="flex-1">
            <Providers>
              <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
            </Providers>
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
      <span className="text-xs text-zinc-400">{truncate(s.userPubkey)}</span>
      <button type="submit" className="text-xs underline">
        Sign out
      </button>
    </form>
  );
}

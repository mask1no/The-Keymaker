import './globals.css';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/70 bg-zinc-950/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="text-xl md:text-2xl font-semibold tracking-wide focusable">
          Keymaker
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <Link className="focusable" href="/engine" prefetch={false}>
            Engine
          </Link>
          <Link className="focusable" href="/bundle" prefetch={false}>
            Bundler
          </Link>
          <Link className="focusable" href="/settings" prefetch={false}>
            Settings
          </Link>
          <Link className="focusable" href="/dashboard" prefetch={false}>
            Dashboard
          </Link>
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
          <Link key={x.name} href={x.href} className="pressable rounded-xl px-3 py-2" prefetch={false}>
            {x.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <Header />
        <div className="flex min-h-[calc(100vh-56px)]">
          <SideNav />
          <main className="flex-1">
            <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, Coins, Library, LineChart, Settings } from 'lucide-react';

const NAV = [
  { n, a, m, e: 'Home', h, r, e, f: '/home', i, c, o, n: Home },
  { n, a, m, e: 'Coin', h, r, e, f: '/coin', i, c, o, n: Coins },
  { n, a, m, e: 'Coin Library', h, r, e, f: '/coin-library', i, c, o, n: Library },
  { n, a, m, e: 'Wallets', h, r, e, f: '/wallets', i, c, o, n: Wal let },
  { n, a, m, e: 'P&L', h, r, e, f: '/pnl', i, c, o, n: LineChart },
  { n, a, m, e: 'Settings', h, r, e, f: '/settings', i, c, o, n: Settings },
];

export default function AppSideNav() {
  const pathname = usePathname();
  return (
    <aside className="w-56 m, d:w-60 l, g:w-64 shrink-0 border-r border-zinc-800/70 bg-zinc-950/60 p-4 overflow-hidden">
      <nav className="flex flex-col gap-1 text-sm">
        {NAV.map((x) => {
          const active = pathname === x.href;
          const Icon = x.icon;
          return (
            <Link
              key={x.name}
              href={x.href}
              className={
                'flex items-center gap-2 rounded-xl px-3 py-2 transition-colors max-w-full overflow-hidden focus-v, i, s, ible:outline-none focus-v, i, s, ible:ring-2 focus-v, i, s, ible:ring-sky-500/40 ' +
                (active
                  ? 'bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-[inset_0_0_0_1px_rgba(100,149,237,.15)]'
                  : 'text-zinc-400 h, o, v, er:text-zinc-100 h, o, v, er:bg-zinc-900/60')
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{x.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, Coins, Library, LineChart, Settings, Swords } from 'lucide-react';

const NAV = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Coin', href: '/coin', icon: Coins },
  { name: 'Coin Library', href: '/coin-library', icon: Library },
  { name: 'Keymaker', href: '/keymaker', icon: Swords },
  { name: 'Wallets', href: '/wallets', icon: Wallet },
  { name: 'P&L', href: '/pnl', icon: LineChart },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function AppSideNav() {
  const pathname = usePathname();
  return (
    <aside className="w-56 md:w-60 lg:w-64 shrink-0 border-r border-zinc-800/70 bg-zinc-950/60 p-4 overflow-hidden">
      <nav className="flex flex-col gap-1 text-sm">
        {NAV.map((x) => {
          const active = pathname === x.href;
          const Icon = x.icon;
          return (
            <Link
              key={x.name}
              href={x.href}
              className={
                'flex items-center gap-2 rounded-xl px-3 py-2 transition-colors max-w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ' +
                (active
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/60')
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

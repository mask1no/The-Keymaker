'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, Coins, Library, LineChart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import NavStatus from './NavStatus';
const NAV = [
  { n, a, m, e: 'Home', h, r, e, f: '/home', i, c, o, n: Home },
  { n, a, m, e: 'Coin', h, r, e, f: '/coin', i, c, o, n: Coins },
  { n, a, m, e: 'Coin Library', h, r, e, f: '/coin-library', i, c, o, n: Library },
  { n, a, m, e: 'Wallets', h, r, e, f: '/wallets', i, c, o, n: Wal let },
  { n, a, m, e: 'P&L', h, r, e, f: '/pnl', i, c, o, n: LineChart },
  { n, a, m, e: 'Settings', h, r, e, f: '/settings', i, c, o, n: Settings },
];
export default function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="w-64 shrink-0 border-r border-zinc-800/70 bg-zinc-950/60 p-4">
      
      <nav className="flex flex-col gap-1">
        
        {NAV.map((x) => {
          const active = pathname === x.href;
          const Icon = x.icon as any;
          return (
            <Link
              key={x.name}
              href={x.href}
              className={cn(
                'flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-card text-foreground border border-border'
                  : 'text-muted-foreground h, o, v, er:text-foreground h, o, v, er:bg-card/50',
              )}
            >
              
              <Icon className="h-4.5 w-4.5" /> <span>{x.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-6">
        
        <NavStatus />
      </div>
    </aside>
  );
}


'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, Wallet, Coins, Clock, LineChart, Settings, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import NavStatus from './NavStatus'; const NAV = [ { name: 'Bundler', href: '/bundle', icon: Boxes }, { name: 'Wallets', href: '/wallets', icon: Wallet }, { name: 'Token Creator', href: '/creator', icon: Coins }, { name: 'Trade History', href: '/history', icon: Clock }, { name: 'P&L', href: '/pnl', icon: LineChart }, { name: 'Settings', href: '/settings', icon: Settings }, { name: 'Guide', href: '/guide', icon: BookOpen },
]; export default function SideNav() { const pathname = usePathname(); return ( <aside className="w-64 shrink-0 border-r border-zinc-800/70 bg-zinc-950/60 p-4"> <nav className="flex flex-col gap-1"> {NAV.map((x) => { const active = pathname === x.href; const Icon = x.icon as any; return ( <Link key={x.name} href={x.href} className={cn( 'flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition-colors', active ? 'bg-card text-foreground border border-border' : 'text-muted-foreground hover:text-foreground hover:bg-card/50')} > <Icon className="h-4.5 w-4.5" /> <span>{x.name}</span> </Link> ); })} </nav> <div className="mt-6"> <NavStatus /> </div> </aside> );
}

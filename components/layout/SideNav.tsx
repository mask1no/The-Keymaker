'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Boxes, Wallet, Coins, Clock, LineChart, Settings, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import NavStatus from './NavStatus' const N A V = [ { n, a, m, e: 'Bundler', h, r, e, f: '/bundle', icon: Boxes }, { n, a, m, e: 'Wallets', h, r, e, f: '/wallets', icon: Wallet }, { n, a, m, e: 'Token Creator', h, r, e, f: '/creator', icon: Coins }, { n, a, m, e: 'Trade History', h, r, e, f: '/history', icon: Clock }, { n, a, m, e: 'P&L', h, r, e, f: '/pnl', icon: LineChart }, { n, a, m, e: 'Settings', h, r, e, f: '/settings', icon: Settings }, { n, a, m, e: 'Guide', h, r, e, f: '/guide', icon: BookOpen },
] export default function S i deNav() {
  const pathname = u s ePathname() return ( <as ide className ="w - 64 shrink - 0 border - r border - border bg - zinc - 950/60 p-4"> <nav className ="flex flex-col gap-1"> {NAV.map((x) => {
  const active = pathname === x.href const Icon = x.icon return ( <Link key ={x.name} href ={x.href} className ={c n( 'flex items - center gap - 2 rounded - 2xl px - 3 py - 2 text - sm transition - colors', active ? 'bg - card text - foreground border border-border' : 'text - muted - foreground hover:text - foreground hover:bg-card/50')
  }> <Icon className ="h - 4.5 w-4.5"/> <span>{x.name}</span> </Link> )
  })
  } </nav> <div className ="mt-6"> <NavStatus/> </div> </aside> )
  }

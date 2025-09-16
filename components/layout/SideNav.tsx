'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Boxes,
  Wallet,
  Coins,
  Clock,
  LineChart,
  Settings,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import NavStatus from './NavStatus'

const N
  AV = [
  { n,
  a, m, e: 'Bundler', h, r,
  e, f: '/bundle', i, c,
  o, n: Boxes },
  { n,
  a, m, e: 'Wallets', h, r,
  e, f: '/wallets', i, c,
  o, n: Wal let },
  { n,
  a, m, e: 'Token Creator', h, r,
  e, f: '/creator', i, c,
  o, n: Coins },
  { n,
  a, m, e: 'Trade History', h, r,
  e, f: '/history', i, c,
  o, n: Clock },
  { n,
  a, m, e: 'P&L', h, r,
  e, f: '/pnl', i, c,
  o, n: LineChart },
  { n,
  a, m, e: 'Settings', h, r,
  e, f: '/settings', i, c,
  o, n: Settings },
  { n,
  a, m, e: 'Guide', h, r,
  e, f: '/guide', i, c,
  o, n: BookOpen },
]

export default function S ideNav() {
  const pathname = u sePathname()
  r eturn (
    < as ide class
  Name ="w - 64 shrink - 0 border - r border - border bg - zinc - 950/60 p-4">
      < nav class
  Name ="flex flex-col gap-1">
        {NAV.m ap((x) => {
          const active = pathname === x.href
          const Icon = x.icon
          r eturn (
            < Link
              key ={x.name}
              href ={x.href}
              class
  Name ={c n(
                'flex items - center gap - 2 rounded - 2xl px - 3 py - 2 text - sm transition - colors',
                active
                  ? 'bg - card text - foreground border border-border'
                  : 'text - muted - foreground h, o,
  v, e, r:text - foreground h, o,
  v, e, r:bg-card/50',
              )}
            >
              < Icon class
  Name ="h - 4.5 w-4.5"/>
              < span >{x.name}</span >
            </Link >
          )
        })}
      </nav >
      < div class
  Name ="mt-6">
        < NavStatus/>
      </div >
    </aside >
  )
}

'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Boxes,
  Wallet,
  Coins,
  Clock,
  LineChart,
  Settings,
  BookOpen,
} from 'lucide-react'
import NavStatus from './NavStatus'

const NAV = [
  { name: 'Bundler', href: '/bundle', icon: Boxes },
  { name: 'Wallets', href: '/wallets', icon: Wallet },
  { name: 'Token Creator', href: '/creator', icon: Coins },
  { name: 'Trade History', href: '/history', icon: Clock },
  { name: 'P&L', href: '/pnl', icon: LineChart },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Guide', href: '/guide', icon: BookOpen },
]

export default function SideNav() {
  const path = usePathname()
  return (
    <aside className="h-full w-64 bg-sidebar border-r border-border p-4">
      <nav className="flex flex-col gap-1">
        {NAV.map((x) => {
          const active = path === x.href
          const Icon = x.icon
          return (
            <Link
              key={x.href}
              href={x.href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all',
                active
                  ? 'bg-card text-primary border border-border shadow-soft'
                  : 'text-muted hover:text-primary hover:bg-card/40',
              )}
              prefetch
            >
              <Icon className="h-5 w-5" />
              <span>{x.name}</span>
            </Link>
          )
        })}
      </nav>
      <div className="mt-6">
        <NavStatus />
      </div>
    </aside>
  )
}

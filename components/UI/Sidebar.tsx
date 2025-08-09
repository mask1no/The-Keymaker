'use client'
import {
  Home,
  Zap,
  Wallet,
  Coins,
  Activity,
  BarChart2,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { TooltipProvider } from '@/components/UI/tooltip'
import { useKeymakerStore } from '@/lib/store'
import { StatusCards } from './StatusCards'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  tooltip?: string
}

const navItems: NavItem[] = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Bundle', href: '/bundle', icon: Zap },
  { name: 'Wallets', href: '/wallets', icon: Wallet },
  { name: 'SPL Creator', href: '/spl-creator', icon: Coins },
  { name: 'Trade History', href: '/trade-history', icon: Activity },
  { name: 'PNL', href: '/pnl', icon: BarChart2 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Guide', href: '/guide', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isExecuting } = useKeymakerStore()

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed w-64 h-screen bg-[#101418]/80 backdrop-blur border-r border-white/10 flex flex-col py-6">
        {/* Logo */}
        <div className="flex items-center px-4 h-10">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <span className="ml-3 text-xl font-bold text-white">Keymaker</span>
        </div>

        {/* Main Navigation */}
        <nav className="px-4 mt-8">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <div
                      className={`flex items-center h-10 px-4 rounded-lg transition-colors ${isActive ? 'bg-green-500/20 text-green-400' : 'text-white/80 hover:text-white hover:bg-white/5'}`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="ml-3">{item.name}</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Status Cards - 2x2 Bento */}
        <div className="mt-8">
          <StatusCards />
        </div>

        {/* Spacer to push content up */}
        <div className="flex-1" />

        {/* Live Status Badge */}
        {isExecuting && (
          <div className="px-3 mb-4">
            <div className="flex items-center justify-center h-10 px-3 bg-green-500/20 border border-green-500/40 rounded-lg">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="ml-2 text-xs font-medium text-green-400">
                LIVE
              </span>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <nav className="px-3">
          <ul className="space-y-2">
            {/* The bottomNavItems array and its map are removed as per the edit hint */}
          </ul>
        </nav>
      </aside>
    </TooltipProvider>
  )
}

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

const navigation = [
  {
    name: 'Bundler',
    href: '/bundle',
    icon: Boxes,
    description: 'Bundle transactions for execution',
  },
  {
    name: 'Wallets',
    href: '/wallets',
    icon: Wallet,
    description: 'Manage encrypted wallets',
  },
  {
    name: 'Token Creator',
    href: '/spl-creator',
    icon: Coins,
    description: 'Create tokens',
  },
  {
    name: 'Trade History',
    href: '/history',
    icon: Clock,
    description: 'View execution history',
  },
  {
    name: 'P&L',
    href: '/pnl',
    icon: LineChart,
    description: 'Profit & Loss analytics',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Application settings',
  },
  {
    name: 'Guide',
    href: '/guide',
    icon: BookOpen,
    description: 'User guide and glossary',
  },
]

interface SideNavProps {
  className?: string
}

export function SideNav({ className }: SideNavProps) {
  const pathname = usePathname()

  return (
    <div className={cn('flex h-full flex-col justify-between p-4', className)}>
      <nav className="flex flex-col gap-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'hover:bg-card/80 hover:shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-current={isActive ? 'page' : undefined}
              title={item.description}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>
      <NavStatus />
    </div>
  )
}

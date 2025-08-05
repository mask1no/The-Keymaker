'use client'
import { Home, Wallet, Zap, BarChart2, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Bundle', href: '/dashboard/bundle', icon: Zap },
  { name: 'Wallets', href: '/dashboard/wallets', icon: Wallet },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 px-2 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link key={item.name} href={item.href}>
              <motion.div
                className={`
                  flex flex-col items-center justify-center py-2 px-3 rounded-lg
                  ${isActive ? 'text-green-400' : 'text-white/60'}
                `}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.name}</span>
                {isActive && (
                  <motion.div
                    className="absolute -bottom-1 w-1 h-1 bg-green-400 rounded-full"
                    layoutId="activeMobile"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

'use client';
import { Home, Wallet, Zap, BarChart2, Coins, Activity, Settings, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/UI/tooltip';
import { useKeymakerStore } from '@/lib/store';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  tooltip?: string;
}

const navItems: NavItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home,
    tooltip: 'Overview and quick stats'
  },
  { 
    name: 'Bundle Engine', 
    href: '/dashboard/bundle', 
    icon: Zap,
    tooltip: 'Create and execute token bundles (⌘+Enter)'
  },
  { 
    name: 'Wallet Manager', 
    href: '/dashboard/wallets', 
    icon: Wallet,
    tooltip: 'Manage wallet groups and roles'
  },
  { 
    name: 'Token Creator', 
    href: '/dashboard/create', 
    icon: Coins,
    tooltip: 'Launch new tokens on multiple platforms'
  },
  { 
    name: 'Execution Log', 
    href: '/dashboard/logs', 
    icon: Activity,
    tooltip: 'Transaction history and P/L tracking'
  },
  { 
    name: 'Analytics', 
    href: '/dashboard/analytics', 
    icon: BarChart2,
    tooltip: 'Market insights and performance metrics'
  },
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings,
    tooltip: 'Configure API keys and preferences'
  },
];

const bottomNavItems: NavItem[] = [
  { 
    name: 'Help', 
    href: '/dashboard/help', 
    icon: HelpCircle,
    tooltip: 'Documentation and support'
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isExecuting } = useKeymakerStore();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="w-16 h-screen bg-black/40 backdrop-blur-md border-r border-white/10 flex flex-col justify-between py-6 transition-all duration-300 hover:w-64 group">
        {/* Logo */}
        <div className="px-3 mb-8">
          <Link href="/dashboard">
            <motion.div 
              className="flex items-center justify-center h-10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">K</span>
              </div>
              <span className="ml-3 text-xl font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                Keymaker
              </span>
            </motion.div>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={item.href}>
                        <motion.div
                          className={`
                            relative flex items-center h-10 px-3 rounded-lg transition-all
                            ${isActive 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'text-white/60 hover:text-white hover:bg-white/5'
                            }
                          `}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                            {item.name}
                          </span>
                          
                          {/* Live badge for Bundle Engine when executing */}
                          {item.href === '/dashboard/bundle' && isExecuting && (
                            <div className="absolute -top-1 -right-1 group-hover:right-2">
                              <span className="flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                              </span>
                            </div>
                          )}
                          
                          {isActive && (
                            <motion.div
                              className="absolute left-0 top-0 h-full w-1 bg-green-400 rounded-r"
                              layoutId="activeTab"
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                        </motion.div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="group-hover:hidden">
                      <p className="font-medium">{item.name}</p>
                      {item.tooltip && (
                        <p className="text-xs text-white/60 mt-1">{item.tooltip}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Live Status Badge */}
        {isExecuting && (
          <div className="px-3 mb-4">
            <div className="flex items-center justify-center h-10 px-3 bg-green-500/20 border border-green-500/40 rounded-lg">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="ml-2 text-xs font-medium text-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                LIVE
              </span>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <nav className="px-3">
          <ul className="space-y-2">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={item.href}>
                        <motion.div
                          className={`
                            relative flex items-center h-10 px-3 rounded-lg transition-all
                            ${isActive 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'text-white/60 hover:text-white hover:bg-white/5'
                            }
                          `}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                            {item.name}
                          </span>
                        </motion.div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="group-hover:hidden">
                      <p className="font-medium">{item.name}</p>
                      {item.tooltip && (
                        <p className="text-xs text-white/60 mt-1">{item.tooltip}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </TooltipProvider>
  );
} 
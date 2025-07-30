'use client';
import { Home, Wallet, Zap, BarChart2, Coins, Activity, Settings, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/UI/tooltip';

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
    tooltip: 'Performance metrics and insights'
  },
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings,
    tooltip: 'Configure API keys and preferences'
  }
];

export function Sidebar() {
  const pathname = usePathname();
  
  return (
    <motion.aside
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="hidden md:flex flex-col w-64 bg-black/40 backdrop-blur-xl border-r border-aqua/20"
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg"
          />
          <h2 className="text-xl font-bold bg-gradient-to-r from-aqua to-purple-500 bg-clip-text text-transparent">
            The Keymaker
          </h2>
        </div>
        
        <nav className="space-y-1">
          <TooltipProvider delayDuration={300}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200
                        ${isActive 
                          ? 'bg-aqua/20 text-aqua border border-aqua/30' 
                          : 'hover:bg-aqua/10 text-gray-300 hover:text-aqua border border-transparent'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-aqua' : ''}`} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {item.tooltip && (
                    <TooltipContent side="right">
                      <p>{item.tooltip}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>
      </div>
      
      <div className="mt-auto p-6">
        <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
          <h3 className="font-semibold text-sm mb-1">Need Help?</h3>
          <p className="text-xs text-gray-400 mb-3">
            Check our docs for guides and API references
          </p>
          <Link
            href="/docs"
            className="flex items-center gap-2 text-sm text-aqua hover:underline"
          >
            <HelpCircle className="w-4 h-4" />
            Documentation
          </Link>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          v1.0.0 • Mainnet
        </div>
      </div>
    </motion.aside>
  );
} 
'use client';
import { Home, Wallet, Send, BarChart2, Copy, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}
const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Bundler', href: '/dashboard/bundler', icon: Send },
  { name: 'Wallets', href: '/dashboard/wallets', icon: Wallet },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
  { name: 'Clone Token', href: '/dashboard/clone', icon: Copy },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];
export function Sidebar() {
  const pathname = usePathname();
  return (
    <motion.aside
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="hidden md:block w-64 bg-glass/30 backdrop-blur border-r border-white/10"
    >
      <div className="p-4">
        <h2 className="text-xl font-bold">The Keymaker</h2>
        <nav className="mt-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center p-2 rounded-xl ${pathname === item.href ? 'bg-aqua/20' : 'hover:bg-aqua/10'}`}
            >
              <item.icon className="w-5 h-5 mr-2" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </motion.aside>
  );
} 
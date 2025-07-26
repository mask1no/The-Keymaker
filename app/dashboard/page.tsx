'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Skeleton } from '@/components/UI/skeleton';
import { Card, CardContent } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import { 
  Wallet, 
  Zap, 
  Coins, 
  TrendingUp, 
  Activity,
  Users,
  Package,
  ArrowRight,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants';

interface QuickStats {
  totalWallets: number;
  activeGroups: number;
  totalBundles: number;
  totalPnL: number;
  solBalance: number;
}

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const [stats, setStats] = useState<QuickStats>({
    totalWallets: 0,
    activeGroups: 0,
    totalBundles: 0,
    totalPnL: 0,
    solBalance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Load wallet groups from localStorage
        const groups = JSON.parse(localStorage.getItem('walletGroups') || '{}');
        const totalWallets = Object.values(groups).reduce((sum: number, group: any) => 
          sum + (group.wallets?.length || 0), 0
        );
        
        // Load SOL balance if wallet connected
        let solBalance = 0;
        if (publicKey) {
          const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC);
          const balance = await connection.getBalance(publicKey);
          solBalance = balance / LAMPORTS_PER_SOL;
        }
        
        setStats({
          totalWallets,
          activeGroups: Object.keys(groups).length,
          totalBundles: parseInt(localStorage.getItem('totalBundles') || '0'),
          totalPnL: parseFloat(localStorage.getItem('totalPnL') || '0'),
          solBalance
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [publicKey]);

  const quickActions = [
    {
      title: 'Bundle Engine',
      description: 'Create and execute token bundles with Jito MEV',
      icon: Zap,
      href: '/dashboard/bundle',
      color: 'from-blue-500 to-purple-500',
      badge: 'Hot'
    },
    {
      title: 'Wallet Manager',
      description: 'Manage wallet groups and assign roles',
      icon: Wallet,
      href: '/dashboard/wallets',
      color: 'from-green-500 to-teal-500'
    },
    {
      title: 'Token Creator',
      description: 'Launch tokens on Pump.fun, Raydium & more',
      icon: Coins,
      href: '/dashboard/create',
      color: 'from-orange-500 to-red-500'
    },
    {
      title: 'Execution Log',
      description: 'Track transactions and P/L history',
      icon: Activity,
      href: '/dashboard/logs',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Sell Monitor',
      description: 'Automated sell conditions and monitoring',
      icon: TrendingUp,
      href: '/dashboard/sell-monitor',
      color: 'from-orange-500 to-red-500',
      badge: 'Auto'
    },
    {
      title: 'P&L Tracking',
      description: 'Real-time profit and loss analysis',
      icon: BarChart3,
      href: '/dashboard/pnl',
      color: 'from-teal-500 to-cyan-500',
      badge: 'Live'
    }
  ];

  const statsCards = [
    {
      title: 'Total Wallets',
      value: stats.totalWallets,
      icon: Users,
      change: '+12%',
      color: 'text-blue-500'
    },
    {
      title: 'Active Groups',
      value: stats.activeGroups,
      icon: Package,
      change: '+3',
      color: 'text-green-500'
    },
    {
      title: 'Total Bundles',
      value: stats.totalBundles,
      icon: Zap,
      change: '+24%',
      color: 'text-purple-500'
    },
    {
      title: 'Total P/L',
      value: `${stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(4)} SOL`,
      icon: stats.totalPnL >= 0 ? TrendingUp : TrendingUp,
      change: stats.totalPnL >= 0 ? '+' : '-',
      color: stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
    }
  ];

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-10 h-10 text-aqua" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-aqua to-purple-500 bg-clip-text text-transparent">
            The Keymaker
          </h1>
        </div>
        <p className="text-gray-400 text-lg">Production-Ready Solana Bundler & Token Launcher</p>
        
        {publicKey ? (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
              Connected
            </Badge>
            <span className="text-sm text-gray-400">
              Balance: {stats.solBalance.toFixed(4)} SOL
            </span>
          </div>
        ) : (
          <Badge className="mt-4 bg-red-500/20 text-red-500 border-red-500/30">
            Wallet Not Connected
          </Badge>
        )}
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-black/40 backdrop-blur-xl border-aqua/20 hover:border-aqua/40 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <Badge variant="outline" className={`${stat.color} border-current`}>
                    {stat.change}
                  </Badge>
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-24 mb-2" />
                ) : (
                  <h3 className="text-2xl font-bold mb-1">
                    {stat.value}
                  </h3>
                )}
                <p className="text-sm text-gray-400">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={action.href}>
                <Card className="bg-black/40 backdrop-blur-xl border-aqua/20 hover:border-aqua/40 transition-all group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${action.color} bg-opacity-20`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      {action.badge && (
                        <Badge className={`bg-gradient-to-r ${action.color} text-white border-0`}>
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-aqua transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      {action.description}
                    </p>
                    <div className="flex items-center text-aqua text-sm group-hover:gap-3 transition-all">
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:ml-0 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recent Activity</h2>
          <Link href="/dashboard/logs">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Activity className="w-8 h-8 mr-3" />
              <p>No recent activity. Start by creating a bundle or launching a token!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
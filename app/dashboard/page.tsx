'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeymakerStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Badge } from '@/components/UI/badge';
import {
  DollarSign,
  Wallet,
  Rocket,
  TrendingUp,
  PlayCircle,
  Users,
  FileText,
  BarChart3,
  Home
} from 'lucide-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

// Import all required components
import { ControlPanel } from '@/components/ControlCenter/ControlPanel';
import { WalletManager } from '@/components/WalletManager/WalletManager';
import { LogsPanel } from '@/components/ExecutionLog/LogsPanel';
import AnalyticsPanel from '@/components/Analytics/AnalyticsPanel';
import MemecoinCreator from '@/components/MemecoinCreator/MemecoinCreator';

type TabView = 'overview' | 'control' | 'wallets' | 'create' | 'logs' | 'analytics';

export default function DashboardPage() {
  const { wallets, totalInvested, totalReturned, tokenLaunchData } = useKeymakerStore();
  const [activeTab, setActiveTab] = useState<TabView>('overview');
  
  // Calculate stats
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0) / LAMPORTS_PER_SOL;
  const masterWallet = wallets.find(w => w.role === 'master');
  const sniperWallets = wallets.filter(w => w.role === 'sniper');
  const devWallets = wallets.filter(w => w.role === 'dev');
  const pnlPercentage = totalInvested > 0 ? ((totalReturned - totalInvested) / totalInvested) * 100 : 0;

  const stats = [
    {
      title: 'Total Balance',
      value: `${totalBalance.toFixed(2)} SOL`,
      icon: <DollarSign className="h-4 w-4" />,
      description: `Across ${wallets.length} wallets`,
      color: 'text-green-400'
    },
    {
      title: 'Master Wallet',
      value: masterWallet ? `${(masterWallet.balance / LAMPORTS_PER_SOL).toFixed(2)} SOL` : 'Not Set',
      icon: <Wallet className="h-4 w-4" />,
      description: masterWallet ? 'Ready' : 'Assign in Wallets',
      color: 'text-yellow-400'
    },
    {
      title: 'Sniper Wallets',
      value: `${sniperWallets.length}`,
      icon: <Users className="h-4 w-4" />,
      description: `${devWallets.length} dev wallets`,
      color: 'text-blue-400'
    },
    {
      title: 'Total PnL',
      value: pnlPercentage > 0 ? `+${pnlPercentage.toFixed(1)}%` : `${pnlPercentage.toFixed(1)}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      description: `$${Math.abs(totalReturned - totalInvested).toFixed(2)}`,
      color: pnlPercentage > 0 ? 'text-green-400' : 'text-red-400'
    }
  ];

  const tabs = [
    { id: 'overview' as TabView, label: 'Overview', icon: <Home className="h-4 w-4" /> },
    { id: 'control' as TabView, label: 'Control Center', icon: <PlayCircle className="h-4 w-4" /> },
    { id: 'wallets' as TabView, label: 'Wallets', icon: <Wallet className="h-4 w-4" /> },
    { id: 'create' as TabView, label: 'Create Token', icon: <Rocket className="h-4 w-4" /> },
    { id: 'logs' as TabView, label: 'Logs', icon: <FileText className="h-4 w-4" /> },
    { id: 'analytics' as TabView, label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                The Keymaker
              </h1>
              <p className="text-sm text-white/60">Solana Memecoin Orchestration Platform</p>
            </div>
            <div className="flex items-center gap-4">
              {tokenLaunchData?.mintAddress && (
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                  Token: {tokenLaunchData.symbol}
                </Badge>
              )}
              {masterWallet && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                  Master: {masterWallet.publicKey.slice(0, 8)}...
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-[73px] z-40">
        <div className="container mx-auto px-6">
          <div className="flex space-x-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-black/40 backdrop-blur-md border-white/10">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white/80">
                          {stat.title}
                        </CardTitle>
                        <div className={stat.color}>
                          {stat.icon}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${stat.color}`}>
                          {stat.value}
                        </div>
                        <p className="text-xs text-white/60 mt-1">
                          {stat.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <Card className="bg-black/40 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('control')}
                      className="p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all"
                    >
                      <PlayCircle className="h-8 w-8 mb-3 text-purple-400" />
                      <h3 className="font-medium">Launch Full Sequence</h3>
                      <p className="text-sm text-white/60 mt-1">
                        Execute the complete token launch flow
                      </p>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('wallets')}
                      className="p-6 bg-gradient-to-r from-green-600/20 to-teal-600/20 rounded-lg border border-green-500/20 hover:border-green-500/40 transition-all"
                    >
                      <Wallet className="h-8 w-8 mb-3 text-green-400" />
                      <h3 className="font-medium">Manage Wallets</h3>
                      <p className="text-sm text-white/60 mt-1">
                        Import and organize wallet groups
                      </p>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('create')}
                      className="p-6 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-all"
                    >
                      <Rocket className="h-8 w-8 mb-3 text-blue-400" />
                      <h3 className="font-medium">Create Token</h3>
                      <p className="text-sm text-white/60 mt-1">
                        Configure your next memecoin launch
                      </p>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card className="bg-black/40 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">RPC Connection</span>
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                        Connected
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Jito Bundle Support</span>
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                        Available
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Wallet Security</span>
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                        Encrypted
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'control' && (
            <motion.div
              key="control"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ControlPanel />
            </motion.div>
          )}

          {activeTab === 'wallets' && (
            <motion.div
              key="wallets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <WalletManager />
            </motion.div>
          )}

          {activeTab === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MemecoinCreator />
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <LogsPanel />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AnalyticsPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 
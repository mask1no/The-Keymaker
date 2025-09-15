'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKeymakerStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Badge } from '@/components/UI/badge'
import {
  DollarSign,
  Wallet,
  Rocket,
  TrendingUp,
  PlayCircle,
  Users,
  FileText,
  BarChart3,
  Home,
  Activity,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LAMPORTS_PER_SOL, Connection } from '@solana/web3.js'
import { useSystemStatus } from '@/hooks/useSystemStatus'
import { Skeleton } from '@/components/UI/skeleton'

// Import all required components
import { ControlPanel } from '@/components/ControlCenter/ControlPanel'
import WalletManager from '@/components/WalletManager/WalletManager'
import { LogsPanel } from '@/components/ExecutionLog/LogsPanel'
import AnalyticsPanel from '@/components/Analytics/AnalyticsPanel'
import MemecoinCreator from '@/components/MemecoinCreator/MemecoinCreator'
import { ActivityMonitor } from '@/components/ActivityMonitor/ActivityMonitor'
import { MarketCapCard } from '@/components/Dashboard/MarketCapCard'

type TabView =
  | 'overview'
  | 'control'
  | 'wallets'
  | 'create'
  | 'logs'
  | 'analytics'
  | 'activity'

export default function DashboardPage() {
  const { wallets, totalInvested, totalReturned, tokenLaunchData, rpcUrl } =
    useKeymakerStore()
  useSystemStatus()
  const [activeTab, setActiveTab] = useState<TabView>('overview')
  interface Trade {
    pnl: number
    token_address: string
    executed_at: string
  }
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Calculate stats
  const totalBalance =
    wallets.reduce((sum, w) => sum + w.balance, 0) / LAMPORTS_PER_SOL
  const masterWallet = wallets.find((w) => w.role === 'master')
  const sniperWallets = wallets.filter((w) => w.role === 'sniper')
  const devWallets = wallets.filter((w) => w.role === 'dev')
  const pnlPercentage =
    totalInvested > 0
      ? ((totalReturned - totalInvested) / totalInvested) * 100
      : 0

  // Fetch recent trades from database
  useEffect(() => {
    const fetchRecentTrades = async () => {
      try {
        const response = await fetch('/api/trades?limit=5')
        if (response.ok) {
          const data = await response.json()
          setRecentTrades(data.trades || [])
        }
      } catch (error) {
        console.error('Failed to fetch recent trades:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentTrades()
    const interval = setInterval(fetchRecentTrades, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Update wallet balances periodically
  useEffect(() => {
    const updateBalances = async () => {
      if (wallets.length === 0) return

      try {
        new Connection(rpcUrl)
        // This would normally update balances via the store
        // For now, balances are updated elsewhere
      } catch (error) {
        console.error('Failed to update balances:', error)
      }
    }

    updateBalances()
    const interval = setInterval(updateBalances, 10000) // Every 10 seconds

    return () => clearInterval(interval)
  }, [wallets, rpcUrl])

  const stats = [
    {
      title: 'Total Balance',
      value:
        wallets.length > 0 ? `${totalBalance.toFixed(2)} SOL` : 'No wallets',
      icon: <DollarSign className="h-4 w-4" />,
      description:
        wallets.length > 0
          ? `Across ${wallets.length} wallets`
          : 'Load wallets to begin',
      color: wallets.length > 0 ? 'text-green-400' : 'text-gray-400',
    },
    {
      title: 'Master Wallet',
      value: masterWallet
        ? `${(masterWallet.balance / LAMPORTS_PER_SOL).toFixed(2)} SOL`
        : 'Not Set',
      icon: <Wallet className="h-4 w-4" />,
      description: masterWallet ? 'Ready' : 'Assign in Wallets',
      color: 'text-yellow-400',
    },
    {
      title: 'Sniper Wallets',
      value: `${sniperWallets.length}`,
      icon: <Users className="h-4 w-4" />,
      description: `${devWallets.length} dev wallets`,
      color: 'text-blue-400',
    },
    {
      title: 'Total PnL',
      value:
        totalInvested > 0
          ? pnlPercentage > 0
            ? `+${pnlPercentage.toFixed(1)}%`
            : `${pnlPercentage.toFixed(1)}%`
          : 'No trades',
      icon: <TrendingUp className="h-4 w-4" />,
      description:
        totalInvested > 0
          ? `$${Math.abs(totalReturned - totalInvested).toFixed(2)}`
          : 'Start trading to see PnL',
      color:
        totalInvested > 0
          ? pnlPercentage > 0
            ? 'text-green-400'
            : 'text-red-400'
          : 'text-gray-400',
    },
  ]

  const tabs = [
    {
      id: 'overview' as TabView,
      label: 'Overview',
      icon: <Home className="h-4 w-4" />,
    },
    {
      id: 'control' as TabView,
      label: 'Control Center',
      icon: <PlayCircle className="h-4 w-4" />,
    },
    {
      id: 'wallets' as TabView,
      label: 'Wallets',
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      id: 'create' as TabView,
      label: 'Create Token',
      icon: <Rocket className="h-4 w-4" />,
    },
    {
      id: 'logs' as TabView,
      label: 'Logs',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: 'analytics' as TabView,
      label: 'Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      id: 'activity' as TabView,
      label: 'Activity',
      icon: <Activity className="h-4 w-4" />,
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl font-black bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent hover:from-green-400 hover:to-cyan-500 transition-all duration-500 cursor-default">
                Dashboard
              </h1>
              <p className="text-lg text-white/60 mt-2 tracking-wider">
                Solana Memecoin Orchestration Platform
              </p>
            </motion.div>
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {tokenLaunchData?.mintAddress && (
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-400 border-green-500/20 px-4 py-1.5"
                >
                  Token: {tokenLaunchData.symbol}
                </Badge>
              )}
              {masterWallet && (
                <Badge
                  variant="outline"
                  className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 px-4 py-1.5"
                >
                  Master: {masterWallet.publicKey.slice(0, 8)}...
                </Badge>
              )}
            </motion.div>
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
                  ${
                    activeTab === tab.id
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: index * 0.05,
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                    whileHover={{
                      scale: 1.03,
                      transition: { duration: 0.2 },
                    }}
                    className="group"
                  >
                    <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 h-full">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-white/60 group-hover:text-white/80 transition-colors">
                          {stat.title}
                        </CardTitle>
                        <motion.div
                          className={`${stat.color} group-hover:scale-110 transition-transform`}
                          whileHover={{ rotate: 15 }}
                        >
                          {stat.icon}
                        </motion.div>
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`text-2xl font-bold ${stat.color} group-hover:scale-105 transition-transform origin-left`}
                        >
                          {stat.value}
                        </div>
                        <p className="text-xs text-white/50 mt-1">
                          {stat.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-12 gap-6">
                {/* Market Cap Card */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4">
                  <MarketCapCard
                    mintAddress={tokenLaunchData?.mintAddress ?? ''}
                    tokenSymbol={tokenLaunchData?.symbol}
                  />
                </div>

                {/* Quick Actions */}
                <Card className="bg-black/40 backdrop-blur-md border-white/10 col-span-12 md:col-span-6 lg:col-span-8">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-12 gap-4">
                      <button
                        onClick={() => router.push('/dashboard/bundle')}
                        className="col-span-12 md:col-span-4 p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all"
                      >
                        <PlayCircle className="h-8 w-8 mb-3 text-purple-400" />
                        <h3 className="font-medium">Launch Full Sequence</h3>
                        <p className="text-sm text-white/60 mt-1">
                          Execute the complete token launch flow
                        </p>
                      </button>

                      <button
                        onClick={() => router.push('/dashboard/wallets')}
                        className="col-span-12 md:col-span-4 p-6 bg-gradient-to-r from-green-600/20 to-teal-600/20 rounded-2xl border border-green-500/20 hover:border-green-500/40 transition-all"
                      >
                        <Wallet className="h-8 w-8 mb-3 text-green-400" />
                        <h3 className="font-medium">Manage Wallets</h3>
                        <p className="text-sm text-white/60 mt-1">
                          Import and organize wallet groups
                        </p>
                      </button>

                      <button
                        onClick={() => router.push('/dashboard/create')}
                        className="col-span-12 md:col-span-4 p-6 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl border border-blue-500/20 hover:border-blue-500/40 transition-all"
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
              </div>

              {/* System Status removed: compact StatusCluster appears in Topbar */}

              {/* Recent Trades */}
              <Card className="bg-black/40 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle>Recent Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : recentTrades.length > 0 ? (
                    <div className="space-y-2">
                      {recentTrades.map((trade: Trade, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">
                              {trade.pnl >= 0 ? '+' : ''}
                              {trade.pnl.toFixed(2)}%
                            </Badge>
                            <span className="text-sm">
                              {trade.token_address.slice(0, 8)}...
                            </span>
                          </div>
                          <div className="text-sm text-white/60">
                            {new Date(trade.executed_at).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/60">No trades yet</p>
                  )}
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

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ActivityMonitor />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

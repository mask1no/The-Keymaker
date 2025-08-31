'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { Button } from '@/components/UI/button'
import { Badge } from '@/components/UI/badge'
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Zap,
  Clock,
  DollarSign,
  RefreshCw
} from 'lucide-react'
import useSWR from 'swr'

export default function PnlPage() {
  const [timeRange, setTimeRange] = useState('24h')
  const [refreshing, setRefreshing] = useState(false)

  const fetcher = (url: string) => fetch(url).then(res => res.json())
  const { data } = useSWR('/api/pnl?limit=100', fetcher, { refreshInterval: 5000 })
  const items = data?.items || []

  const handleRefresh = async () => {
    setRefreshing(true)
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setRefreshing(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            P&L Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Performance metrics and trading analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className="text-2xl font-bold text-green-400">+2.45 SOL</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-primary">87.3%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Latency</p>
                <p className="text-2xl font-bold text-amber-400">52ms</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tips</p>
                <p className="text-2xl font-bold text-primary">0.0234 SOL</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Land Rate vs Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Land Rate vs Tip
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Success rate correlation with tip amount
              </div>

              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No P&L data yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Execute trades to see your performance analytics here.
                    </p>
                  </div>
                ) : (
                  items.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-card/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="font-mono text-sm">{item.profit_loss?.toFixed(4) || '0.0000'} SOL</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: '85%' }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          85%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Optimal Range</span>
                  <Badge variant="outline" className="text-green-400 border-green-400/30">
                    0.000050 - 0.000075 SOL
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Latency vs Region */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Latency vs Region
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Regional performance and response times
              </div>

              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No regional data yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Execute bundles across different regions to see performance metrics.
                    </p>
                  </div>
                ) : (
                  items.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-card/30 border border-border/50">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs">
                        FFM
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-mono">45ms</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">94%</span>
                      </div>
                      <div className="flex-1">
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: '94%' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Best Performance</span>
                  <Badge variant="outline" className="text-green-400 border-green-400/30">
                    AMS (38ms)
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Performance Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm">Higher tips improve land rate by ~15%</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-sm">Amsterdam offers best latency</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm">Regular mode has highest success rate</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">💡 Use AMS region for best performance</p>
              <p className="mb-2">💰 Optimal tip range: 0.000050-0.000075 SOL</p>
              <p>⚡ Regular mode for consistent results</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Real-time Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Bundles</span>
              <Badge variant="secondary">3</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending</span>
              <Badge variant="outline">1</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Success Rate</span>
              <span className="text-sm font-medium text-green-400">87.3%</span>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
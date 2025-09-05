'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { Button } from '@/components/UI/button'
import {
  BarChart3,
  Clock,
  DollarSign,
  RefreshCw,
  TrendingUp
} from 'lucide-react'
import useSWR from 'swr'

export default function PnlPage() {
  const [timeRange, setTimeRange] = useState('24h')
  const [refreshing, setRefreshing] = useState(false)

  const fetcher = (url: string) => fetch(url).then(res => res.json())
  const { data } = useSWR('/api/pnl?limit=100', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: false
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetch('/api/pnl?limit=100').then(res => res.json())
    setRefreshing(false)
  }

  const items = data?.items || []
  const totalProfit = items.length > 0 ? items.reduce((sum: number, item: any) => sum + (item.profit || 0), 0) : 0
  const successRate = items.length > 0 ? (items.filter((item: any) => item.success).length / items.length * 100) : 0
  const avgLatency = items.length > 0 ? items.reduce((sum: number, item: any) => sum + (item.latency_ms || 0), 0) / items.length : 0
  const totalTips = items.length > 0 ? items.reduce((sum: number, item: any) => sum + (item.tip_lamports || 0) / 1_000_000_000, 0) : 0

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
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(4)} SOL
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-primary">{successRate.toFixed(1)}%</p>
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
                <p className="text-2xl font-bold text-amber-400">{avgLatency.toFixed(0)}ms</p>
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
                <p className="text-2xl font-bold text-primary">{totalTips.toFixed(4)} SOL</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trade History */}
      <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.slice(0, 10).map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <div>
                    <div className="font-medium">{item.bundle_id?.slice(0, 8)}...</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${item.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {item.profit >= 0 ? '+' : ''}{item.profit?.toFixed(4) || '0.0000'} SOL
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.latency_ms || 0}ms • {item.success ? '✓' : '✗'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No metrics yet. Start trading to see your P&L data.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
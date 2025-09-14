'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/UI/Card'
import { Button } from '@/components/UI/button'

export default function PnlPage() {
  const [refreshing, setRefreshing] = useState(false)
  const fetcher = (u: string) => fetch(u).then((r) => r.json())
  const { data, mutate } = useSWR('/api/pnl?limit=200', fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: false,
  })

  const items = data?.items || []
  const totalProfit = items.reduce(
    (s: number, i: any) => s + (Number(i.profit) || 0),
    0,
  )
  const successRate = items.length
    ? (items.filter((i: any) => i.success).length / items.length) * 100
    : 0
  const avgLatency = items.length
    ? items.reduce((s: number, i: any) => s + (i.latency_ms || 0), 0) /
      items.length
    : 0
  const totalTips = items.reduce(
    (s: number, i: any) => s + (i.tip_lamports || 0) / 1_000_000_000,
    0,
  )

  async function refresh() {
    setRefreshing(true)
    await mutate()
    setRefreshing(false)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>P&L</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div>Total Profit: {totalProfit.toFixed(4)} SOL</div>
          <div>Success Rate: {successRate.toFixed(1)}%</div>
          <div>Avg Latency: {avgLatency.toFixed(0)} ms</div>
          <div>Total Tips: {totalTips.toFixed(4)} SOL</div>
          <Button onClick={refresh} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

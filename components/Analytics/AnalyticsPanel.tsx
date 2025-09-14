'use client'
import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/UI/card'
import { Button } from '@/components/UI/button'
import { Skeleton } from '@/components/UI/skeleton'
import { exportToCsv } from '../../services/analyticsService'
import useSWR from 'swr'
import { Trade } from '@/lib/types'
import { useKeymakerStore } from '@/lib/store'
import { getPnLHistory } from '@/lib/clientLogger'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AnalyticsPanel() {
  const { tokenLaunchData } = useKeymakerStore()

  const { data: analyticsData, error } = useSWR(
    tokenLaunchData?.mintAddress
      ? `/api/analytics?tokenAddress=${tokenLaunchData.mintAddress}`
      : null,
    fetcher,
    { refreshInterval: 5000 }, // Refresh every 5 seconds
  )

  const handleExport = async () => {
    try {
      const res = await fetch('/api/trades?limit=200', { cache: 'no-store' })
      const { trades } = (await res.json()) as { trades: any[] }
      const rows: Trade[] = trades.map((t) => ({
        id: String(t.id ?? t.rowid ?? ''),
        tokenAddress: t.token_address ?? t.tokenAddress ?? '',
        amount: Number(t.sol_in ?? 0) + Number(t.sol_out ?? 0),
        price: 0,
        timestamp: t.executed_at ?? new Date().toISOString(),
        wallet: Array.isArray(t.wallets) ? t.wallets[0] : t.wallets,
        type: (Number(t.sol_out ?? 0) > 0 ? 'sell' : 'buy') as 'buy' | 'sell',
      }))
      await exportToCsv(rows)
    } catch (e) {
      console.error('CSV export failed', e)
    }
  }

  const isLoading = !analyticsData && !error

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <Button onClick={handleExport}>Export CSV</Button>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {isLoading ? (
          <Skeleton className="col-span-2 h-64" />
        ) : (
          <>
            <div>
              Live Price:{' '}
              {analyticsData?.price
                ? `$${analyticsData.price.toPrecision(6)}`
                : 'N/A'}
            </div>
            <div>
              Market Cap:{' '}
              {analyticsData?.marketCap
                ? `$${analyticsData.marketCap.toLocaleString()}`
                : 'N/A'}
            </div>
            <div className="col-span-2">
              <LineChart
                width={400}
                height={200}
                data={[{ time: 'now', price: analyticsData?.price || 0 }]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#16f2e3"
                  name="Live Price"
                />
              </LineChart>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

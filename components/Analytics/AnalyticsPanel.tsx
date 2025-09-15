'use client'
import React from 'react'
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
} from '@/components/UI/Card'
import { Skeleton } from '@/components/UI/skeleton'
import useSWR from 'swr'
import { useKeymakerStore } from '@/lib/store'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const LiveIndicator = () => (
  <span className="relative flex h-2 w-2 ml-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
  </span>
)

export default function AnalyticsPanel() {
  const { tokenLaunchData } = useKeymakerStore()

  const { data: analyticsData, error } = useSWR(
    tokenLaunchData?.mintAddress
      ? `/api/analytics?tokenAddress=${tokenLaunchData.mintAddress}`
      : null,
    fetcher,
    { refreshInterval: 5000 }, // Refresh every 5 seconds
  )

  const isLoading = !analyticsData && !error

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Analytics</CardTitle>
        <CardDescription>
          Real-time price and market cap for your launched token.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {isLoading ? (
          <Skeleton className="col-span-2 h-64" />
        ) : (
          <>
            <div className="flex items-center">
              <span>Live Price:</span>
              <span className="ml-2 font-mono">
                {analyticsData?.price
                  ? `$${analyticsData.price.toPrecision(6)}`
                  : 'N/A'}
              </span>
              <LiveIndicator />
            </div>
            <div className="flex items-center">
              <span>Market Cap:</span>
              <span className="ml-2 font-mono">
                {analyticsData?.marketCap
                  ? `$${analyticsData.marketcap.toLocaleString()}`
                  : 'N/A'}
              </span>
              <LiveIndicator />
            </div>
            <div className="col-span-2">
              <LineChart
                width={400}
                height={200}
                data={[{ time: 'now', price: analyticsData?.price || 0 }]}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--muted))"
                />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
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

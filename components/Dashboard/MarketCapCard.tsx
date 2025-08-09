'use client'
import React, { useEffect, useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { birdeyeService } from '@/services/birdeyeService'
// import { useSettingsStore } from '@/stores/useSettingsStore' - not needed
import { Skeleton } from '@/components/UI/skeleton'
// import { useI18n } from '@/services/i18nService';

interface TokenData {
  price: number
  priceChange24h: number
  fdv: number
  marketCap: number
  volume24h: number
  liquidityUSD?: number
  holders?: number
  priceHistory: { time: number; price: number }[]
}

interface MarketCapCardProps {
  tokenMint?: string
  tokenSymbol?: string
}

export function MarketCapCard({ tokenMint, tokenSymbol }: MarketCapCardProps) {
  const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta'
  // const { t } = useI18n();
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)

  // Auto-hide in devnet
  if (network === 'devnet') {
    return null
  }

  useEffect(() => {
    if (!tokenMint) {
      setLoading(false)
      return
    }

    const fetchInitialData = async () => {
      setLoading(true)
      const data = await birdeyeService.getTokenData(tokenMint)
      if (data) {
        setTokenData(data)
      }
      setLoading(false)
    }

    fetchInitialData()
    birdeyeService.subscribeToToken(tokenMint)

    const handlePriceUpdate = ({
      address,
      data,
    }: {
      address: string
      data: TokenData
    }) => {
      if (address === tokenMint) {
        setTokenData(data)
      }
    }

    const handleConnected = () => setConnected(true)
    const handleDisconnected = () => setConnected(false)

    birdeyeService.on('priceUpdate', handlePriceUpdate)
    birdeyeService.on('connected', handleConnected)
    birdeyeService.on('disconnected', handleDisconnected)

    return () => {
      birdeyeService.unsubscribeFromToken(tokenMint)
      birdeyeService.off('priceUpdate', handlePriceUpdate)
      birdeyeService.off('connected', handleConnected)
      birdeyeService.off('disconnected', handleDisconnected)
    }
  }, [tokenMint])

  // Prepare chart data (last 60 points, 5 min intervals)
  const chartData = useMemo(() => {
    if (!tokenData?.priceHistory || tokenData.priceHistory.length === 0) {
      return []
    }

    // Take last 60 points or all available
    const points = tokenData.priceHistory.slice(-60)

    return points.map((point, index) => ({
      index,
      price: point.price,
      time: new Date(point.time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }))
  }, [tokenData?.priceHistory])

  const priceChange = tokenData?.priceChange24h || 0
  const isPositive = priceChange >= 0

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-black/40 backdrop-blur-sm border border-aqua/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // No token selected
  if (!tokenMint) {
    return null
  }

  return (
    <div
      className="bg-black/40 backdrop-blur-sm border border-aqua/20 rounded-2xl p-6"
      role="region"
      aria-label="Market cap"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-aqua" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Market Data</h3>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
            aria-label={connected ? 'Connected' : 'Disconnected'}
          />
          <span className="text-xs text-gray-400">
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {tokenData ? (
        <div className="space-y-4">
          {/* Price Chart */}
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              >
                <XAxis dataKey="time" hide domain={['dataMin', 'dataMax']} />
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '8px',
                    padding: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            {/* FDV */}
            <div
              className="bg-white/5 rounded-lg p-3"
              aria-label={`FDV: ${formatCurrency(tokenData.fdv)}`}
            >
              <div className="flex items-center gap-1 mb-1">
                <DollarSign
                  className="w-3 h-3 text-gray-400"
                  aria-hidden="true"
                />
                <div className="text-xs text-gray-400">FDV</div>
              </div>
              <div className="font-semibold text-sm">
                {formatCurrency(tokenData.fdv)}
              </div>
            </div>

            {/* 24h Volume */}
            <div
              className="bg-white/5 rounded-lg p-3"
              aria-label={`24h Vol: ${formatCurrency(tokenData.volume24h)}`}
            >
              <div className="flex items-center gap-1 mb-1">
                <Activity
                  className="w-3 h-3 text-gray-400"
                  aria-hidden="true"
                />
                <div className="text-xs text-gray-400">24h Vol</div>
              </div>
              <div className="font-semibold text-sm">
                {formatCurrency(tokenData.volume24h)}
              </div>
            </div>

            {/* 24h Change */}
            <div
              className="bg-white/5 rounded-lg p-3"
              aria-label={`24h Change: ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`}
            >
              <div className="flex items-center gap-1 mb-1">
                {isPositive ? (
                  <TrendingUp
                    className="w-3 h-3 text-green-500"
                    aria-hidden="true"
                  />
                ) : (
                  <TrendingDown
                    className="w-3 h-3 text-red-500"
                    aria-hidden="true"
                  />
                )}
                <div className="text-xs text-gray-400">24h Δ</div>
              </div>
              <div
                className={`font-semibold text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}
              >
                {priceChange >= 0 ? '+' : ''}
                {priceChange.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="bg-white/5 rounded-lg p-3"
              aria-label={`Liquidity: ${formatCurrency(tokenData.liquidityUSD || 0)}`}
            >
              <div className="text-xs text-gray-400">Liquidity</div>
              <div className="font-semibold text-sm">
                {formatCurrency(tokenData.liquidityUSD || 0)}
              </div>
            </div>
            <div
              className="bg-white/5 rounded-lg p-3"
              aria-label={`Holders: ${(tokenData.holders || 0).toLocaleString()}`}
            >
              <div className="text-xs text-gray-400">Holders</div>
              <div className="font-semibold text-sm">
                {(tokenData.holders || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Token Info */}
          {tokenSymbol && (
            <div className="pt-3 border-t border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Token:</span>
                <span className="font-mono text-xs">{tokenSymbol}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-400 text-sm text-center py-8">
          No market data available
        </div>
      )}
    </div>
  )
}

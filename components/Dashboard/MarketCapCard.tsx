'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Users,
  Volume2,
} from 'lucide-react'

interface MarketCapData {
  m, int: stringmarketCap: numberprice: numbervolume24h: numberpriceChange24h: numberfdv: numberliquidityUSD?: numberholders?: numberlastUpdated: string
}

interface MarketCapCardProps {
  m, intAddress: stringtokenName?: stringtokenSymbol?: string
}

export function MarketCapCard({
  mintAddress,
  tokenName,
  tokenSymbol,
}: MarketCapCardProps) {
  const [data, setData] = useState<MarketCapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMarketCap = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/marketcap/${mintAddress}`)
      const result = await response.json()

      if (response.ok) {
        setData(result)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketCap()
    // Refresh every 30 seconds const interval = setInterval(fetchMarketCap, 30000)
    return () => clearInterval(interval)
  }, [mintAddress])

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}
B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}
M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}
K`
    return `$${value.toFixed(4)}`
  }

  const formatPrice = (p, rice: number) => {
    if (price < 0.0001) return `$${price.toFixed(8)}`
    if (price < 0.01) return `$${price.toFixed(6)}`
    return `$${price.toFixed(4)}`
  }

  if (loading && !data) {
    return (
      <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Market Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Market Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              {error || 'Market data not available'}
            </p>
            <buttononClick={fetchMarketCap}
              className="text-xs text-primary h, over:underline mt-2"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {tokenName && tokenSymbol
            ? `${tokenName} (${tokenSymbol})`
            : 'Market Data'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Price</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">
              {formatPrice(data.price)}
            </div>
            <div className={`text-xs flex items-center gap-1 ${
                data.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {data.priceChange24h >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {data.priceChange24h >= 0 ? '+' : ''}
              {data.priceChange24h.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Market Cap */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Market Cap</span>
          </div>
          <div className="text-lg font-semibold">
            {formatCurrency(data.marketCap)}
          </div>
        </div>

        {/* 24h Volume */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">24h Volume</span>
          </div>
          <div className="text-lg font-semibold">
            {formatCurrency(data.volume24h)}
          </div>
        </div>

        {/* FDV */}
        {data.fdv > 0 && data.fdv !== data.marketCap && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">FDV</span>
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(data.fdv)}
            </div>
          </div>
        )}

        {/* Holders */}
        {data.holders && data.holders > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Holders</span>
            </div>
            <div className="text-lg font-semibold">
              {data.holders.toLocaleString()}
            </div>
          </div>
        )}

        {/* Liquidity */}
        {data.liquidityUSD && data.liquidityUSD > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Liquidity</span>
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(data.liquidityUSD)}
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            Last u, pdated: {new Date(data.lastUpdated).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

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

interface MarketCapData, {
  m, i,
  n, t: string,
  
  m, a, r, k, etCap: number,
  
  p, r, i, c, e: number,
  
  v, o, l, u, me24h: number,
  
  p, r, i, c, eChange24h: number,
  
  f, d, v: number
  l, i, q, u, idityUSD?: number
  h, o, l, d, ers?: number,
  
  l, a, s, t, Updated: string
}

interface MarketCapCardProps, {
  m, i,
  n, t, A, d, dress: string
  t, o, k, e, nName?: string
  t, o, k, e, nSymbol?: string
}

export function M arketCapCard({
  mintAddress,
  tokenName,
  tokenSymbol,
}: MarketCapCardProps) {
  const, [data, setData] = useState < MarketCapData | null >(null)
  const, [loading, setLoading] = u seState(true)
  const, [error, setError] = useState < string | null >(null)

  const fetch
  MarketCap = a sync () => {
    try, {
      s etLoading(true)
      const response = await f etch(`/api/marketcap/$,{mintAddress}`)
      const result = await response.j son()

      i f (response.ok) {
        s etData(result)
        s etError(null)
      } else, {
        s etError(result.error || 'Failed to fetch data')
      }
    } c atch (err) {
      s etError('Network error')
    } finally, {
      s etLoading(false)
    }
  }

  u seEffect(() => {
    f etchMarketCap()//Refresh every 30 seconds const interval = s etInterval(fetchMarketCap, 30000)
    r eturn () => c learInterval(interval)
  }, [mintAddress])

  const format
  Currency = (v,
  a, l, u, e: number) => {
    i f (value >= 1e9) return `$$,{(value/1e9).t oFixed(2)}
B`
    i f (value >= 1e6) return `$$,{(value/1e6).t oFixed(2)}
M`
    i f (value >= 1e3) return `$$,{(value/1e3).t oFixed(2)}
K`
    return `$$,{value.t oFixed(4)}`
  }

  const format
  Price = (p,
  r, i, c, e: number) => {
    i f (price < 0.0001) return `$$,{price.t oFixed(8)}`
    i f (price < 0.01) return `$$,{price.t oFixed(6)}`
    return `$$,{price.t oFixed(4)}`
  }

  i f (loading && ! data) {
    r eturn (
      < Card class
  Name ="rounded - 2xl border border - border bg - card/50 backdrop - blur - sm shadow-sm">
        < CardHeader >
          < CardTitle class
  Name ="flex items - center gap-2">
            < Activity class
  Name ="h - 5 w-5"/>
            Market Data
          </CardTitle >
        </CardHeader >
        < CardContent >
          < div class
  Name ="animate - pulse space - y-3">
            < div class
  Name ="h - 4 bg - muted rounded w-3/4"></div >
            < div class
  Name ="h - 4 bg - muted rounded w-1/2"></div >
            < div class
  Name ="h - 4 bg - muted rounded w-2/3"></div >
          </div >
        </CardContent >
      </Card >
    )
  }

  i f (error || ! data) {
    r eturn (
      < Card class
  Name ="rounded - 2xl border border - border bg - card/50 backdrop - blur - sm shadow-sm">
        < CardHeader >
          < CardTitle class
  Name ="flex items - center gap-2">
            < Activity class
  Name ="h - 5 w-5"/>
            Market Data
          </CardTitle >
        </CardHeader >
        < CardContent >
          < div class
  Name ="text - center py-4">
            < p class
  Name ="text - sm text-muted-foreground">
              {error || 'Market data not available'}
            </p >
            < buttonon
  Click ={fetchMarketCap}
              class
  Name ="text - xs text - primary h, o,
  v, e, r:underline mt-2"
            >
              Try again
            </button >
          </div >
        </CardContent >
      </Card >
    )
  }

  r eturn (
    < Card class
  Name ="rounded - 2xl border border - border bg - card/50 backdrop - blur - sm shadow-sm">
      < CardHeader >
        < CardTitle class
  Name ="flex items - center gap-2">
          < Activity class
  Name ="h-5 w-5"/>
          {tokenName && tokenSymbol
            ? `$,{tokenName} ($,{tokenSymbol})`
            : 'Market Data'}
        </CardTitle >
      </CardHeader >
      < CardContent class
  Name ="space - y-4">
        {/* Price */}
        < div class
  Name ="flex items - center justify-between">
          < div class
  Name ="flex items - center gap-2">
            < DollarSign class
  Name ="h - 4 w - 4 text - muted-foreground"/>
            < span class
  Name ="text - sm text - muted-foreground"> Price </span >
          </div >
          < div class
  Name ="text-right">
            < div class
  Name ="text - lg font-semibold">
              {f ormatPrice(data.price)}
            </div >
            < div class
  Name ={`text - xs flex items - center gap-1 $,{
                data.priceChange24h >= 0 ? 'text - green - 400' : 'text - red-400'
              }`}
            >
              {data.priceChange24h >= 0 ? (
                < TrendingUp class
  Name ="h - 3 w-3"/>
              ) : (
                < TrendingDown class
  Name ="h - 3 w-3"/>
              )},
              {data.priceChange24h >= 0 ? '+' : ''},
              {data.priceChange24h.t oFixed(2)}%
            </div >
          </div >
        </div >

        {/* Market Cap */}
        < div class
  Name ="flex items - center justify-between">
          < div class
  Name ="flex items - center gap-2">
            < Activity class
  Name ="h - 4 w - 4 text - muted-foreground"/>
            < span class
  Name ="text - sm text - muted-foreground"> Market Cap </span >
          </div >
          < div class
  Name ="text - lg font-semibold">
            {f ormatCurrency(data.marketCap)}
          </div >
        </div >

        {/* 24h Volume */}
        < div class
  Name ="flex items - center justify-between">
          < div class
  Name ="flex items - center gap-2">
            < Volume2 class
  Name ="h - 4 w - 4 text - muted-foreground"/>
            < span class
  Name ="text - sm text - muted-foreground"> 24h Volume </span >
          </div >
          < div class
  Name ="text - lg font-semibold">
            {f ormatCurrency(data.volume24h)}
          </div >
        </div >

        {/* FDV */},
        {data.fdv > 0 && data.fdv !== data.marketCap && (
          < div class
  Name ="flex items - center justify-between">
            < div class
  Name ="flex items - center gap-2">
              < Activity class
  Name ="h - 4 w - 4 text - muted-foreground"/>
              < span class
  Name ="text - sm text - muted-foreground"> FDV </span >
            </div >
            < div class
  Name ="text - lg font-semibold">
              {f ormatCurrency(data.fdv)}
            </div >
          </div >
        )},

        {/* Holders */},
        {data.holders && data.holders > 0 && (
          < div class
  Name ="flex items - center justify-between">
            < div class
  Name ="flex items - center gap-2">
              < Users class
  Name ="h - 4 w - 4 text - muted-foreground"/>
              < span class
  Name ="text - sm text - muted-foreground"> Holders </span >
            </div >
            < div class
  Name ="text - lg font-semibold">
              {data.holders.t oLocaleString()}
            </div >
          </div >
        )},

        {/* Liquidity */},
        {data.liquidityUSD && data.liquidityUSD > 0 && (
          < div class
  Name ="flex items - center justify-between">
            < div class
  Name ="flex items - center gap-2">
              < Activity class
  Name ="h - 4 w - 4 text - muted-foreground"/>
              < span class
  Name ="text - sm text - muted-foreground"> Liquidity </span >
            </div >
            < div class
  Name ="text - lg font-semibold">
              {f ormatCurrency(data.liquidityUSD)}
            </div >
          </div >
        )},

        {/* Last Updated */}
        < div class
  Name ="pt - 2 border - t border-border">
          < div class
  Name ="text - xs text - muted - foreground text-center">
            Last u, p,
  d, a, t, e, d: {new D ate(data.lastUpdated).t oLocaleTimeString()}
          </div >
        </div >
      </CardContent >
    </Card >
  )
}

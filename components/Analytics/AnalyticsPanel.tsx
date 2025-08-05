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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { Button } from '@/components/UI/button'
import { Skeleton } from '@/components/UI/skeleton'
import { getLivePrices, exportToCsv } from '../../services/analyticsService'
import { useDebounce } from 'use-debounce'
import { Trade, PriceData } from '@/lib/types'
import { useKeymakerStore } from '@/lib/store'
import { getTokenPrice } from '@/services/sellService'
import { getPnLHistory } from '@/lib/clientLogger'

export default function AnalyticsPanel() {
  const [prices, setPrices] = useState<PriceData>({
    sol: 0,
    eth: 0,
    btc: 0,
    cake: 0,
  })
  const [priceHistory, setPriceHistory] = useState<
    { time: string; sol: number }[]
  >([])
  const [pnl, setPnl] = useState<{ [wallet: string]: number }>({})
  const [marketCap, setMarketCap] = useState(0)
  const [loading, setLoading] = useState(true)

  const { wallets, tokenLaunchData, totalInvested, totalReturned } =
    useKeymakerStore()

  const fetchData = async () => {
    setLoading(true)
    try {
      // Get live prices
      const livePrices = await getLivePrices()
      setPrices(livePrices)
      setPriceHistory((prev) => [
        ...prev.slice(-10),
        { time: new Date().toLocaleTimeString(), sol: livePrices.sol },
      ])

      // Get actual wallet PnL data
      const pnlData: { [wallet: string]: number } = {}
      const allPnL = await getPnLHistory()
      for (const wallet of wallets) {
        const walletPnL = allPnL.filter((p) => p.wallet === wallet.publicKey)
        if (walletPnL.length > 0) {
          pnlData[wallet.publicKey] = walletPnL[0].profit_loss
        }
      }
      setPnl(pnlData)

      // Get market cap if token is launched
      if (tokenLaunchData?.mintAddress) {
        const tokenInfo = await getTokenPrice(tokenLaunchData.mintAddress)
        if (tokenInfo) {
          setMarketCap(tokenInfo.marketCap)
        }
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Wrap fetchData in debounce
  const [debouncedFetch] = useDebounce(fetchData, 1000)

  useEffect(() => {
    debouncedFetch()
    const interval = setInterval(debouncedFetch, 30000)
    return () => clearInterval(interval)
  }, [debouncedFetch])

  const handleExport = async () => {
    // Fetch real trades from execution logs
    const trades: Trade[] = [] // Would need to implement fetching from execution logs
    await exportToCsv(trades)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <Button onClick={handleExport}>Export CSV</Button>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {loading ? (
          <Skeleton className="col-span-2 h-64" />
        ) : (
          <>
            <div>
              Live Prices: SOL ${prices.sol.toFixed(2)}, ETH $
              {prices.eth.toFixed(2)}, BTC ${prices.btc.toFixed(2)}
            </div>
            <div>Market Cap: ${marketCap.toLocaleString()}</div>
            <div>Total Invested: {totalInvested.toFixed(4)} SOL</div>
            <div>Total Returned: {totalReturned.toFixed(4)} SOL</div>
            <div>Net P&L: {(totalReturned - totalInvested).toFixed(4)} SOL</div>
            {Object.entries(pnl).length > 0 && (
              <div className="col-span-2">
                <h4 className="font-semibold mb-2">Wallet P&L</h4>
                {Object.entries(pnl).map(([wallet, profit]) => (
                  <div key={wallet} className="text-sm">
                    {wallet.slice(0, 8)}...{wallet.slice(-4)}:{' '}
                    {profit.toFixed(4)} SOL
                  </div>
                ))}
              </div>
            )}
            <div className="col-span-2">
              <LineChart width={400} height={200} data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sol" stroke="#16f2e3" />
              </LineChart>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

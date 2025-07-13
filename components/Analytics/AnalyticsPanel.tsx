'use client';
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getLivePrices, calculatePnL, exportToCsv } from '../../services/analyticsService';
import axios from 'axios';
import { Trade } from '@/lib/types';
import { useDebounce } from 'use-debounce';

export default function AnalyticsPanel() {
  const [prices, setPrices] = useState<{ sol: number, eth: number, btc: number, cake: number }>({ sol: 0, eth: 0, btc: 0, cake: 0 });
  const [priceHistory, setPriceHistory] = useState<{ time: string, sol: number }[]>([]);
  const [pnl, setPnl] = useState<{ [wallet: string]: number }>({});
  const [marketCap, setMarketCap] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const livePrices = await getLivePrices();
    setPrices(livePrices);
    setPriceHistory(prev => [...prev.slice(-10), { time: new Date().toLocaleTimeString(), sol: livePrices.sol }]);
    // Assume wallets list
    const wallets = ['wallet1', 'wallet2'];
    const pnlData: { [wallet: string]: number } = {};
    for (const w of wallets) {
      pnlData[w] = await calculatePnL(w);
    }
    setPnl(pnlData);
    // Fetch market cap from Birdeye (placeholder token)
    const res = await axios.get('https://public-api.birdeye.so/token/some_token', { headers: { 'X-API-KEY': process.env.NEXT_PUBLIC_BIRDEYE_API_KEY } });
    setMarketCap(res.data.marketCap);
    setLoading(false);
  };

  // Wrap fetchData in debounce
  const [debouncedFetch] = useDebounce(fetchData, 1000);

  useEffect(() => {
    debouncedFetch();
    const interval = setInterval(debouncedFetch, 30000);
    return () => clearInterval(interval);
  }, [debouncedFetch]);

  const handleExport = async () => {
    // Fetch trades from db
    const trades: Trade[] = await fetchTrades(); // placeholder
    await exportToCsv(trades);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <Button onClick={handleExport}>Export CSV</Button>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {loading ? <Skeleton className="col-span-2 h-64" /> : (
          <>
            <div>Live Prices: SOL ${prices.sol}, ETH ${prices.eth}, BTC ${prices.btc}, CAKE ${prices.cake}</div>
            <div>Market Cap: ${marketCap}</div>
            {Object.entries(pnl).map(([w, p]) => <div key={w}>PnL {w}: ${p}</div>)}
            <LineChart width={400} height={200} data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sol" stroke="#16f2e3" />
            </LineChart>
          </>
        )}
      </CardContent>
    </Card>
  );
} 
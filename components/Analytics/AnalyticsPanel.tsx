'use client';
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { Skeleton } from '@/components/UI/skeleton';
import { getLivePrices, exportToCsv } from '../../services/analyticsService';
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
      // TODO: Get actual wallet addresses from wallet service
      const pnlData: { [wallet: string]: number } = {};
      setPnl(pnlData);
      // TODO: Implement proper market cap fetching with real token address
      setMarketCap(0);
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
    // TODO: Implement trade fetching from database
    const trades: any[] = [];
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
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/Tabs';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { toast } from 'sonner';

interface PnLEntry {
  id: string;
  token: string;
  symbol: string;
  action: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: Date;
  wallet: string;
  profit?: number;
  loss?: number;
}

interface TokenSummary {
  symbol: string;
  name: string;
  totalBought: number;
  totalSold: number;
  currentHolding: number;
  avgBuyPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

export default function PnLPage() {
  const [entries, setEntries] = useState<PnLEntry[]>([]);
  const [summaries, setSummaries] = useState<TokenSummary[]>([]);
  const [filterWallet, setFilterWallet] = useState('');
  const [filterToken, setFilterToken] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [exportBusy, setExportBusy] = useState<'csv' | 'json' | null>(null);

  // Load P&L data from API
  useEffect(() => {
    const loadPnL = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/pnl`);
        if (response.ok) {
          const data = await response.json();
          // Fallback minimal mapping if server returns aggregates only
          if (Array.isArray(data?.entries) || Array.isArray(data?.summaries)) {
            setEntries(data.entries || []);
            setSummaries(data.summaries || []);
          } else {
            // Map aggregates to a minimal single-summary row
            const buys = Number(data?.buysLamports || 0) / 1e9;
            const sells = Number(data?.sellsLamports || 0) / 1e9;
            const fees = Number(data?.feesLamports || 0) / 1e9;
            const realized = Number(data?.realizedLamports || 0) / 1e9;
            const unrealized = Number(data?.unrealizedLamports || 0) / 1e9;
            setEntries([]);
            setSummaries([
              {
                symbol: 'ALL',
                name: 'Portfolio',
                totalBought: buys,
                totalSold: sells,
                currentHolding: Math.max(0, buys - sells),
                avgBuyPrice: 0,
                currentPrice: 0,
                unrealizedPnL: unrealized - fees,
                realizedPnL: realized - fees,
              },
            ]);
          }
        } else {
          // API not available yet, use empty arrays
          setEntries([]);
          setSummaries([]);
        }
      } catch (error) {
        console.error('Failed to load P&L data:', error);
        setEntries([]);
        setSummaries([]);
      }
    };
    loadPnL();
  }, []);

  async function handleExport(format: 'csv' | 'json') {
    try {
      setExportBusy(format);
      const url = `${process.env.NEXT_PUBLIC_API_BASE}/api/pnl${format === 'csv' ? '?format=csv' : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      const content = format === 'csv' ? String(data.csv || '') : JSON.stringify(data, null, 2);
      const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `pnl.${format}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error(e);
      toast.error('Failed to export P&L');
    } finally {
      setExportBusy(null);
    }
  }

  const filteredEntries = entries.filter((entry) => {
    const walletMatch =
      !filterWallet || entry.wallet.toLowerCase().includes(filterWallet.toLowerCase());
    const tokenMatch =
      !filterToken || entry.token.toLowerCase().includes(filterToken.toLowerCase());
    return walletMatch && tokenMatch;
  });

  const totalRealizedPnL = summaries.reduce((sum, s) => sum + s.realizedPnL, 0);
  const totalUnrealizedPnL = summaries.reduce((sum, s) => sum + s.unrealizedPnL, 0);
  const totalPnL = totalRealizedPnL + totalUnrealizedPnL;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">P&L Tracker</h1>
          <p className="text-zinc-400 mt-2">Monitor your trading performance and profits</p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className="border-blue-500 text-blue-400">
            {summaries.length} Tokens
          </Badge>
          <Badge variant="outline" className="border-green-500 text-green-400">
            {filteredEntries.length} Trades
          </Badge>
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exportBusy !== null}
            className="ml-2"
          >
            {exportBusy === 'csv' ? 'Exporting…' : 'Export CSV'}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={exportBusy !== null}
          >
            {exportBusy === 'json' ? 'Exporting…' : 'Export JSON'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-zinc-100">{totalPnL.toFixed(4)} SOL</div>
            <div className="text-sm text-zinc-400">Total P&L</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">
              {totalRealizedPnL.toFixed(4)} SOL
            </div>
            <div className="text-sm text-zinc-400">Realized P&L</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div
              className={`text-2xl font-bold ${totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {totalUnrealizedPnL.toFixed(4)} SOL
            </div>
            <div className="text-sm text-zinc-400">Unrealized P&L</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">
              {summaries.filter((s) => s.currentHolding > 0).length}
            </div>
            <div className="text-sm text-zinc-400">Active Positions</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
          <TabsTrigger value="overview" className="text-zinc-300">
            Overview
          </TabsTrigger>
          <TabsTrigger value="tokens" className="text-zinc-300">
            Token Summary
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-zinc-300">
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Top Performers</CardTitle>
                <CardDescription className="text-zinc-400">Best performing tokens</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summaries
                    .filter((s) => s.realizedPnL > 0)
                    .sort((a, b) => b.realizedPnL - a.realizedPnL)
                    .slice(0, 5)
                    .map((token) => (
                      <div
                        key={token.symbol}
                        className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-zinc-100">{token.symbol}</div>
                          <div className="text-sm text-zinc-400">{token.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-medium">
                            +{token.realizedPnL.toFixed(4)} SOL
                          </div>
                          <div className="text-xs text-zinc-500">
                            {(
                              (token.realizedPnL / (token.avgBuyPrice * token.totalSold)) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                    ))}
                  {summaries.filter((s) => s.realizedPnL > 0).length === 0 && (
                    <div className="text-center py-4 text-zinc-400">
                      <p>No profitable trades yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Active Positions */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Active Positions</CardTitle>
                <CardDescription className="text-zinc-400">Current holdings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summaries
                    .filter((s) => s.currentHolding > 0)
                    .map((token) => (
                      <div
                        key={token.symbol}
                        className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-zinc-100">{token.symbol}</div>
                          <div className="text-sm text-zinc-400">
                            {token.currentHolding.toLocaleString()} tokens
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-medium ${token.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {token.unrealizedPnL >= 0 ? '+' : ''}
                            {token.unrealizedPnL.toFixed(4)} SOL
                          </div>
                          <div className="text-xs text-zinc-500">
                            {token.currentPrice.toFixed(8)} SOL
                          </div>
                        </div>
                      </div>
                    ))}
                  {summaries.filter((s) => s.currentHolding > 0).length === 0 && (
                    <div className="text-center py-4 text-zinc-400">
                      <p>No active positions</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4 mt-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Token Performance</CardTitle>
              <CardDescription className="text-zinc-400">
                Detailed breakdown by token
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summaries.map((token) => (
                  <div key={token.symbol} className="p-4 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-zinc-100">{token.symbol}</h3>
                        <p className="text-sm text-zinc-400">{token.name}</p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${token.realizedPnL + token.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {(token.realizedPnL + token.unrealizedPnL).toFixed(4)} SOL
                        </div>
                        <div className="text-xs text-zinc-500">Total P&L</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-zinc-400">Total Bought</div>
                        <div className="text-zinc-100">{token.totalBought.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-zinc-400">Total Sold</div>
                        <div className="text-zinc-100">{token.totalSold.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-zinc-400">Current Holding</div>
                        <div className="text-zinc-100">{token.currentHolding.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-zinc-400">Avg Buy Price</div>
                        <div className="text-zinc-100">{token.avgBuyPrice.toFixed(8)} SOL</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4 mt-6">
          {/* Filters */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Transaction History</CardTitle>
              <CardDescription className="text-zinc-400">
                Filter and search your trades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="walletFilter" className="text-zinc-300">
                    Filter by Wallet
                  </Label>
                  <Input
                    id="walletFilter"
                    placeholder="Search wallets..."
                    value={filterWallet}
                    onChange={(e) => setFilterWallet(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
                  <Label htmlFor="tokenFilter" className="text-zinc-300">
                    Filter by Token
                  </Label>
                  <Input
                    id="tokenFilter"
                    placeholder="Search tokens..."
                    value={filterToken}
                    onChange={(e) => setFilterToken(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
                  <Label htmlFor="dateRange" className="text-zinc-300">
                    Date Range
                  </Label>
                  <select
                    id="dateRange"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md"
                  >
                    <option value="1d">Last 24 hours</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="all">All time</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction List */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-0">
              <div className="space-y-0">
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">
                    <p>No transactions found</p>
                    <p className="text-sm">Start trading to see your transaction history</p>
                  </div>
                ) : (
                  filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 border-b border-zinc-800 last:border-b-0"
                    >
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={entry.action === 'buy' ? 'default' : 'outline'}
                          className={
                            entry.action === 'buy' ? 'bg-green-600' : 'border-red-500 text-red-400'
                          }
                        >
                          {entry.action.toUpperCase()}
                        </Badge>
                        <div>
                          <div className="font-medium text-zinc-100">{entry.symbol}</div>
                          <div className="text-sm text-zinc-400">{entry.wallet}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-zinc-100">
                          {entry.amount.toLocaleString()} @ {entry.price.toFixed(8)} SOL
                        </div>
                        <div className="text-sm text-zinc-400">
                          {entry.timestamp.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-zinc-100">
                          {(entry.amount * entry.price).toFixed(4)} SOL
                        </div>
                        {entry.profit && entry.profit > 0 && (
                          <div className="text-sm text-green-400">
                            +{entry.profit.toFixed(4)} SOL
                          </div>
                        )}
                        {entry.loss && entry.loss > 0 && (
                          <div className="text-sm text-red-400">-{entry.loss.toFixed(4)} SOL</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

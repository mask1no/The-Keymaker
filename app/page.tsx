'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import Link from 'next/link';
import { useWalletBalances } from '@/hooks/useWalletBalances';

export default function HomePage() {
  const [walletCount, setWalletCount] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);
  const [volumeTaskCount, setVolumeTaskCount] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);

  // Mock wallet addresses for demonstration
  const mockWallets = [
    '11111111111111111111111111111112', // System Program
    '11111111111111111111111111111113', // Token Program
  ];

  const { balances, isLoading: balancesLoading, getTotalSolBalance } = useWalletBalances({
    wallets: mockWallets,
    refreshInterval: 30000, // 30 seconds
    enabled: true,
  });

  // Fetch stats on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch volume tasks count
        const volumeResponse = await fetch('/api/keymaker/volume-tasks');
        const volumeResult = await volumeResponse.json();
        if (volumeResult.success) {
          setVolumeTaskCount(volumeResult.tasks.length);
        }

        // Fetch token creations count
        const tokenResponse = await fetch('/api/coin-library');
        const tokenResult = await tokenResponse.json();
        if (tokenResult.success) {
          setTokenCount(tokenResult.templates.length);
        }

        // Mock wallet count (in real app, fetch from wallet groups)
        setWalletCount(mockWallets.length);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const totalSolBalance = getTotalSolBalance();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-3xl font-bold text-zinc-100">The Keymaker</h1>
          <p className="text-zinc-400 mt-2">Solana Mainnet Multi-Wallet Sniper with Jito Integration</p>
        </div>
        <Badge variant="outline" className="border-green-500 text-green-400">
          🟢 System Online
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">
              {balancesLoading ? '...' : walletCount}
            </div>
            <div className="text-sm text-zinc-400">Active Wallets</div>
            <div className="text-xs text-zinc-500 mt-1">
              Total: {totalSolBalance.toFixed(4)} SOL
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{tokenCount}</div>
            <div className="text-sm text-zinc-400">Tokens Created</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400">{volumeTaskCount}</div>
            <div className="text-sm text-zinc-400">Volume Tasks</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{totalPnL.toFixed(4)}</div>
            <div className="text-sm text-zinc-400">Total P&L (SOL)</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              🪙 Create Memecoin
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Deploy your token on pump.fun
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300 mb-4">
              Create and launch your memecoin with custom metadata, supply, and branding.
            </p>
            <Link href="/coin">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Create Token
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              📚 Coin Library
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Browse pre-made templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300 mb-4">
              Use proven memecoin templates to quickly launch successful tokens.
            </p>
            <Link href="/coin-library">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                Browse Templates
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              👛 Wallet Manager
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Organize your trading wallets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300 mb-4">
              Create wallet groups and manage up to 20 wallets per group for organized trading.
            </p>
            <Link href="/wallets">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                Manage Wallets
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              🔑 Keymaker
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Automated market making
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300 mb-4">
              Set up automated volume generation and market making strategies.
            </p>
            <Link href="/keymaker">
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                Setup Automation
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              📊 P&L Tracker
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Monitor your profits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300 mb-4">
              Track your trading performance and analyze profit/loss across all positions.
            </p>
            <Link href="/pnl">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                View P&L
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              ⚙️ Settings
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Configure your setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300 mb-4">
              Configure RPC endpoints, Jito settings, hotkeys, and trading parameters.
            </p>
            <Link href="/settings">
              <Button className="w-full bg-zinc-600 hover:bg-zinc-700 text-white">
                Open Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Recent Activity</CardTitle>
          <CardDescription className="text-zinc-400">
            Your latest trading and creation activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-zinc-400">
            <p>No recent activity</p>
            <p className="text-sm">Start by creating your first token or setting up wallets!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

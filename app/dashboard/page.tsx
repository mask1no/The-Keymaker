'use client';
import { ControlCenter } from '@/components/ControlCenter/ControlCenter';
import { useKeymakerStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { DollarSign, Wallet, Rocket, TrendingUp } from 'lucide-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export default function DashboardPage() {
  const { wallets, totalInvested, totalReturned, tokenLaunchData } = useKeymakerStore();
  
  // Calculate stats
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0) / LAMPORTS_PER_SOL;
  const masterWallet = wallets.find(w => w.role === 'master');
  const sniperWallets = wallets.filter(w => w.role === 'sniper');
  const pnlPercentage = totalInvested > 0 ? ((totalReturned - totalInvested) / totalInvested) * 100 : 0;

  const stats = [
    {
      title: 'Total Balance',
      value: `${totalBalance.toFixed(2)} SOL`,
      icon: <DollarSign className="h-4 w-4" />,
      description: `Across ${wallets.length} wallets`
    },
    {
      title: 'Master Wallet',
      value: masterWallet ? `${(masterWallet.balance / LAMPORTS_PER_SOL).toFixed(2)} SOL` : 'Not Set',
      icon: <Wallet className="h-4 w-4" />,
      description: masterWallet ? 'Ready' : 'Assign in Wallets'
    },
    {
      title: 'Token Config',
      value: tokenLaunchData ? tokenLaunchData.symbol : 'Not Set',
      icon: <Rocket className="h-4 w-4" />,
      description: tokenLaunchData ? `${tokenLaunchData.platform}` : 'Configure in Create'
    },
    {
      title: 'Total PnL',
      value: pnlPercentage > 0 ? `+${pnlPercentage.toFixed(1)}%` : `${pnlPercentage.toFixed(1)}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      description: `${sniperWallets.length} sniper wallets`
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Keymaker Dashboard</h1>
        <p className="text-muted-foreground">Orchestrate your memecoin operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className="text-muted-foreground">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Control Center */}
      <ControlCenter />
    </div>
  );
} 
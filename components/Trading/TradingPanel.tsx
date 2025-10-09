'use client';
import { useState } from 'react';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { toast } from 'sonner';

export function TradingPanel() {
  const [mint, setMint] = useState('');
  const [wallets, setWallets] = useState('');
  const [solAmount, setSolAmount] = useState('0.1');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    if (!mint || !wallets || !password) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const walletList = wallets.split(',').map((w) => w.trim());

      const response = await fetch('/api/engine/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mint,
          walletPubkeys: walletList,
          perWalletSol: parseFloat(solAmount),
          slippageBps: 300,
          impactCapPct: 5,
          password,
          dryRun: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Buy completed: ${data.summary.succeeded}/${data.summary.total} succeeded`);
      } else {
        toast.error(data.error || 'Buy failed');
      }
    } catch (error) {
      toast.error('Buy request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async (percent: number | 'all') => {
    if (!mint || !wallets || !password) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const walletList = wallets.split(',').map((w) => w.trim());
      const endpoint = percent === 'all' ? '/api/engine/sellAll' : '/api/engine/sell';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mint,
          walletPubkeys: walletList,
          sellPctOrAmount: percent,
          slippageBps: 300,
          password,
          dryRun: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Sell completed: ${data.summary.succeeded}/${data.summary.total} succeeded`);
      } else {
        toast.error(data.error || 'Sell failed');
      }
    } catch (error) {
      toast.error('Sell request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Multi-Wallet Trading</CardTitle>
        <CardDescription>Buy and sell tokens across multiple wallets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="mint">Token Mint Address</Label>
          <Input
            id="mint"
            placeholder="Enter token mint address"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="wallets">Wallet Addresses (comma-separated)</Label>
          <Input
            id="wallets"
            placeholder="wallet1,wallet2,wallet3"
            value={wallets}
            onChange={(e) => setWallets(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="amount">SOL Per Wallet (for buy)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={solAmount}
            onChange={(e) => setSolAmount(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="password">Wallet Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter password to decrypt wallets"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleBuy} disabled={loading} className="flex-1">
            {loading ? 'Processing...' : 'Buy'}
          </Button>

          <Button
            onClick={() => handleSell(50)}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            Sell 50%
          </Button>

          <Button
            onClick={() => handleSell(100)}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            Sell 100%
          </Button>

          <Button
            onClick={() => handleSell('all')}
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            Sell All Positions
          </Button>
        </div>

        <div className="text-xs text-zinc-400 pt-2">
          <p>• Uses Jupiter V6 for swaps (or pump.fun curve for non-migrated tokens)</p>
          <p>• 3% slippage, 5% price impact cap by default</p>
          <p>• Transactions are idempotent (duplicate clicks won't double-send)</p>
        </div>
      </CardContent>
    </Card>
  );
}


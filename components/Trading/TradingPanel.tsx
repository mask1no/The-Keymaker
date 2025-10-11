'use client';

import { useState } from 'react';
import { Button } from '@/components/UI/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Textarea } from '@/components/UI/Textarea';
import { toast } from 'sonner';

interface TradingPanelProps {
  onTrade: (data: {
    mint: string;
    walletPubkeys: string[];
    perWalletSol: number;
    slippageBps: number;
    impactCapPct: number;
    password: string;
    dryRun: boolean;
  }) => void;
  isLoading?: boolean;
}

export function TradingPanel({ onTrade, isLoading = false }: TradingPanelProps) {
  const [formData, setFormData] = useState({
    mint: '',
    walletPubkeys: '',
    perWalletSol: 0.1,
    slippageBps: 300,
    impactCapPct: 5,
    password: '',
    dryRun: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.mint) {
      toast.error('Mint address is required');
      return;
    }

    if (!formData.walletPubkeys) {
      toast.error('Wallet addresses are required');
      return;
    }

    if (!formData.password) {
      toast.error('Password is required');
      return;
    }

    const walletPubkeys = formData.walletPubkeys
      .split(',')
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);

    if (walletPubkeys.length === 0) {
      toast.error('At least one wallet address is required');
      return;
    }

    onTrade({
      mint: formData.mint,
      walletPubkeys,
      perWalletSol: formData.perWalletSol,
      slippageBps: formData.slippageBps,
      impactCapPct: formData.impactCapPct,
      password: formData.password,
      dryRun: formData.dryRun,
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Trading Panel</CardTitle>
        <CardDescription>Execute multi-wallet trades with advanced settings</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="mint">Mint Address</Label>
            <Input
              id="mint"
              type="text"
              value={formData.mint}
              onChange={(e) => setFormData({ ...formData, mint: e.target.value })}
              placeholder="Enter token mint address"
              required
            />
          </div>

          <div>
            <Label htmlFor="wallets">Wallet Addresses</Label>
            <Textarea
              id="wallets"
              value={formData.walletPubkeys}
              onChange={(e) => setFormData({ ...formData, walletPubkeys: e.target.value })}
              placeholder="Enter wallet addresses separated by commas"
              rows={3}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate multiple wallet addresses with commas
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="perWalletSol">SOL per Wallet</Label>
              <Input
                id="perWalletSol"
                type="number"
                value={formData.perWalletSol}
                onChange={(e) =>
                  setFormData({ ...formData, perWalletSol: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.1"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <Label htmlFor="slippageBps">Slippage (bps)</Label>
              <Input
                id="slippageBps"
                type="number"
                value={formData.slippageBps}
                onChange={(e) =>
                  setFormData({ ...formData, slippageBps: parseInt(e.target.value) || 300 })
                }
                placeholder="300"
                min="1"
                max="10000"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.slippageBps / 100}% slippage tolerance
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="impactCapPct">Price Impact Cap (%)</Label>
            <Input
              id="impactCapPct"
              type="number"
              value={formData.impactCapPct}
              onChange={(e) =>
                setFormData({ ...formData, impactCapPct: parseFloat(e.target.value) || 5 })
              }
              placeholder="5"
              step="0.1"
              min="0"
              max="50"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Maximum price impact allowed (0-50%)</p>
          </div>

          <div>
            <Label htmlFor="password">Wallet Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter wallet password"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dryRun"
              checked={formData.dryRun}
              onChange={(e) => setFormData({ ...formData, dryRun: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="dryRun">Dry Run (Simulation Only)</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button type="submit" variant="default" className="w-full" disabled={isLoading}>
              {isLoading ? 'Executing...' : 'Buy Tokens'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={isLoading}
              onClick={() => {
                // Handle sell logic
                toast.info('Sell functionality coming soon');
              }}
            >
              Sell All Positions
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

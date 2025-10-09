'use client';

import { useState } from 'react';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';

interface TokenFormProps {
  onSubmit: (data: { name: string; symbol: string; supply: number; decimals: number }) => void;
  isLoading?: boolean;
}

export function TokenForm({ onSubmit, isLoading = false }: TokenFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    supply: 1000000,
    decimals: 9,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Token</CardTitle>
        <CardDescription>Enter your token details below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Token Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., My Token"
              required
            />
          </div>

          <div>
            <Label htmlFor="symbol">Token Symbol</Label>
            <Input
              id="symbol"
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              placeholder="e.g., MTK"
              required
            />
          </div>

          <div>
            <Label htmlFor="supply">Supply</Label>
            <Input
              id="supply"
              type="number"
              value={formData.supply}
              onChange={(e) => setFormData({ ...formData, supply: parseInt(e.target.value) || 0 })}
              placeholder="1000000"
              required
            />
          </div>

          <div>
            <Label htmlFor="decimals">Decimals</Label>
            <Input
              id="decimals"
              type="number"
              value={formData.decimals}
              onChange={(e) => setFormData({ ...formData, decimals: parseInt(e.target.value) || 9 })}
              placeholder="9"
              min="0"
              max="18"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Token'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
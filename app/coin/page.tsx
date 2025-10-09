'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Textarea } from '@/components/UI/Textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/Tabs';
import { toast } from 'sonner';

export default function CoinPage() {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    image: '',
    supply: 1000000,
    decimals: 9,
  });

  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/coin/create/pumpfun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          image: formData.image,
          supply: formData.supply,
          decimals: formData.decimals,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create token');
      }

      if (result.success) {
        toast.success('Token creation transaction ready! Please sign the transaction in your wallet.');
        
        // TODO: Handle wallet signing and transaction submission
        // For now, we'll just show the mint address
        toast.info(`Mint Address: ${result.mintAddress}`);
        
        // Reset form
        setFormData({
          name: '',
          symbol: '',
          description: '',
          image: '',
          supply: 1000000,
          decimals: 9,
        });
      } else {
        throw new Error(result.message || 'Token creation failed');
      }
    } catch (error) {
      console.error('Token creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create token');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Create Memecoin</h1>
          <p className="text-zinc-400 mt-2">Deploy your token on pump.fun</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Token Details</CardTitle>
              <CardDescription className="text-zinc-400">
                Fill in the details for your new memecoin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
                    <TabsTrigger value="basic" className="text-zinc-300">Basic Info</TabsTrigger>
                    <TabsTrigger value="advanced" className="text-zinc-300">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-zinc-300">Token Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Doge Killer"
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="symbol" className="text-zinc-300">Symbol</Label>
                        <Input
                          id="symbol"
                          value={formData.symbol}
                          onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                          placeholder="e.g., DOGEK"
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-zinc-300">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe your memecoin..."
                        rows={3}
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                      />
                    </div>

                    <div>
                      <Label htmlFor="image" className="text-zinc-300">Image URL</Label>
                      <Input
                        id="image"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://example.com/image.png"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="supply" className="text-zinc-300">Total Supply</Label>
                        <Input
                          id="supply"
                          type="number"
                          value={formData.supply}
                          onChange={(e) => setFormData({ ...formData, supply: parseInt(e.target.value) || 0 })}
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="decimals" className="text-zinc-300">Decimals</Label>
                        <Input
                          id="decimals"
                          type="number"
                          value={formData.decimals}
                          onChange={(e) => setFormData({ ...formData, decimals: parseInt(e.target.value) || 9 })}
                          min="0"
                          max="18"
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button 
                  type="submit" 
                  disabled={isCreating || !formData.name || !formData.symbol}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isCreating ? 'Creating Token...' : 'Create Token on pump.fun'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview Card */}
        <div className="lg:col-span-1">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.image && (
                  <div className="w-full h-32 bg-zinc-800 rounded-lg flex items-center justify-center">
                    <img 
                      src={formData.image} 
                      alt="Token preview" 
                      className="max-w-full max-h-full object-contain rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">
                    {formData.name || 'Token Name'}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {formData.symbol || 'SYMBOL'}
                  </p>
                  {formData.description && (
                    <p className="text-sm text-zinc-300 mt-2">
                      {formData.description}
                    </p>
                  )}
                </div>
                <div className="text-xs text-zinc-500">
                  <p>Supply: {formData.supply.toLocaleString()}</p>
                  <p>Decimals: {formData.decimals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

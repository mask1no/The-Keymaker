'use client';
import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { birdeyeService } from '@/services/birdeyeService';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useControlStore } from '@/stores/useControlStore';
import { Sparkline } from './Sparkline';

interface TokenData {
  price: number;
  priceChange24h: number;
  fdv: number;
  marketCap: number;
  volume24h: number;
  priceHistory: { time: number; price: number }[];
}

export function MarketCapCard() {
  const { network } = useSettingsStore();
  const { tokenLaunchData } = useControlStore();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  // Hide in devnet
  if (network === 'devnet') {
    return null;
  }

  useEffect(() => {
    if (!tokenLaunchData?.mint) {
      return;
    }

    const fetchInitialData = async () => {
      setLoading(true);
      const data = await birdeyeService.getTokenData(tokenLaunchData.mint);
      if (data) {
        setTokenData(data);
      }
      setLoading(false);
    };

    fetchInitialData();
    birdeyeService.subscribeToToken(tokenLaunchData.mint);

    const handlePriceUpdate = ({ address, data }: { address: string; data: TokenData }) => {
      if (address === tokenLaunchData.mint) {
        setTokenData(data);
      }
    };

    const handleConnected = () => setConnected(true);
    const handleDisconnected = () => setConnected(false);

    birdeyeService.on('priceUpdate', handlePriceUpdate);
    birdeyeService.on('connected', handleConnected);
    birdeyeService.on('disconnected', handleDisconnected);

    return () => {
      birdeyeService.unsubscribeFromToken(tokenLaunchData.mint);
      birdeyeService.off('priceUpdate', handlePriceUpdate);
      birdeyeService.off('connected', handleConnected);
      birdeyeService.off('disconnected', handleDisconnected);
    };
  }, [tokenLaunchData?.mint]);

  if (!tokenLaunchData?.mint || loading) {
    return (
      <div className="bg-black/40 backdrop-blur-sm border border-aqua/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-aqua" />
          <h3 className="text-lg font-semibold">Market Data</h3>
        </div>
        <div className="text-gray-400 text-sm">
          {loading ? 'Loading market data...' : 'Launch a token to view market data'}
        </div>
      </div>
    );
  }

  const priceChange = tokenData?.priceChange24h || 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-aqua/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-aqua" />
          <h3 className="text-lg font-semibold">Market Data</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-xs text-gray-400">{connected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {tokenData ? (
        <div className="space-y-4">
          {/* Price Section */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(tokenData.price)}
                </div>
                <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{Math.abs(priceChange).toFixed(2)}%</span>
                </div>
              </div>
              <div className="w-32 h-12">
                <Sparkline 
                  data={tokenData.priceHistory} 
                  color={isPositive ? '#10b981' : '#ef4444'} 
                />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Market Cap</div>
              <div className="font-semibold">{formatCurrency(tokenData.marketCap)}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">FDV</div>
              <div className="font-semibold">{formatCurrency(tokenData.fdv)}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 col-span-2">
              <div className="text-xs text-gray-400 mb-1">24h Volume</div>
              <div className="font-semibold">{formatCurrency(tokenData.volume24h)}</div>
            </div>
          </div>

          {/* Token Info */}
          <div className="pt-3 border-t border-gray-700">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Token:</span>
              <span className="font-mono text-xs">{tokenData.symbol || tokenLaunchData.name}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-400 text-sm">
          No market data available
        </div>
      )}
    </div>
  );
}
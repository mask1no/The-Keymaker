'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Input } from '@/components/UI/input';
import { Button } from '@/components/UI/button';
import { Label } from '@/components/UI/label';
import { Badge } from '@/components/UI/badge';
import { TrendingUp, TrendingDown, Clock, DollarSign, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { type SellConditions, checkSellConditions } from '@/services/sellService';
import { logger } from '@/lib/logger';

interface TokenHolding {
  tokenAddress: string;
  tokenName: string;
  amount: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  marketCap: number;
}

export function SellMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [holdings, setHoldings] = useState<TokenHolding[]>([]);
  // Conditions are set when monitoring starts
  
  const [profitInput, setProfitInput] = useState('100');
  const [lossInput, setLossInput] = useState('50');
  const [timeDelayInput, setTimeDelayInput] = useState('180');
  const [marketCapInput, setMarketCapInput] = useState('1000000');
  
  const [monitorInterval, setMonitorInterval] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Load holdings from localStorage or API
    const loadHoldings = () => {
      const stored = localStorage.getItem('tokenHoldings');
      if (stored) {
        setHoldings(JSON.parse(stored));
      }
    };
    loadHoldings();
  }, []);
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (monitorInterval) {
        clearInterval(monitorInterval);
      }
    };
  }, [monitorInterval]);
  
  const startMonitoring = () => {
    if (holdings.length === 0) {
      return toast.error('No holdings to monitor');
    }
    
    const updatedConditions: SellConditions = {
      minPnlPercent: parseFloat(profitInput) || undefined,
      maxLossPercent: parseFloat(lossInput) ? -parseFloat(lossInput) : undefined,
      minHoldTime: parseFloat(timeDelayInput) || undefined,
    };

    
    setIsMonitoring(true);
    toast.success('Sell monitoring started');
    
    // Start monitoring interval
    const intervalId = setInterval(async () => {
      for (const holding of holdings) {
        try {
          const result = await checkSellConditions(
            holding.tokenAddress,
            updatedConditions,
            holding.entryPrice,
            Date.now() - (updatedConditions.minHoldTime || 0) * 60000 // Convert minutes to ms
          );
          
          if (result.shouldSell) {
            toast.success(`Sell signal: ${result.reason}`, {
              duration: 10000,
              icon: '🔔',
            });
            
            // Here you would trigger the actual sell
            logger.info('Sell signal triggered', { 
              holding: holding.tokenAddress, 
              reason: result.reason 
            });
          }
        } catch (error) {
          logger.error('Error checking sell conditions', { error, holding: holding.tokenAddress });
        }
      }
    }, 30000); // Check every 30 seconds
    
    setMonitorInterval(intervalId);
  };
  
  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (monitorInterval) {
      clearInterval(monitorInterval);
      setMonitorInterval(null);
    }
    toast.success('Sell monitoring stopped');
  };
  
  const addHolding = (holding: TokenHolding) => {
    const updated = [...holdings, holding];
    setHoldings(updated);
    localStorage.setItem('tokenHoldings', JSON.stringify(updated));
  };
  
  const removeHolding = (tokenAddress: string) => {
    const updated = holdings.filter(h => h.tokenAddress !== tokenAddress);
    setHoldings(updated);
    localStorage.setItem('tokenHoldings', JSON.stringify(updated));
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-black/40 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-aqua" />
              Sell Monitor
            </div>
            <Badge variant={isMonitoring ? 'default' : 'secondary'}>
              {isMonitoring ? 'Active' : 'Inactive'}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Sell Conditions */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/80">Sell Conditions</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs">
                  <DollarSign className="h-3 w-3" />
                  Market Cap Threshold
                </Label>
                <Input
                  type="number"
                  value={marketCapInput}
                  onChange={(e) => setMarketCapInput(e.target.value)}
                  placeholder="1000000"
                  className="bg-white/5"
                  disabled={isMonitoring}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  Profit Target (%)
                </Label>
                <Input
                  type="number"
                  value={profitInput}
                  onChange={(e) => setProfitInput(e.target.value)}
                  placeholder="100"
                  className="bg-white/5"
                  disabled={isMonitoring}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs">
                  <TrendingDown className="h-3 w-3" />
                  Stop Loss (%)
                </Label>
                <Input
                  type="number"
                  value={lossInput}
                  onChange={(e) => setLossInput(e.target.value)}
                  placeholder="50"
                  className="bg-white/5"
                  disabled={isMonitoring}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3" />
                  Time Delay (min)
                </Label>
                <Input
                  type="number"
                  value={timeDelayInput}
                  onChange={(e) => setTimeDelayInput(e.target.value)}
                  placeholder="180"
                  className="bg-white/5"
                  disabled={isMonitoring}
                />
              </div>
            </div>
          </div>
          
          {/* Holdings List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-white/80">Token Holdings ({holdings.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {holdings.map((holding) => (
                <div key={holding.tokenAddress} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{holding.tokenName}</p>
                    <p className="text-xs text-white/60">{holding.tokenAddress.slice(0, 8)}...</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${holding.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {holding.pnl >= 0 ? '+' : ''}{holding.pnl.toFixed(2)}%
                    </p>
                    <p className="text-xs text-white/60">${holding.marketCap.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Control Buttons */}
          <div className="flex gap-2">
            {!isMonitoring ? (
              <Button 
                onClick={startMonitoring}
                className="flex-1"
                disabled={holdings.length === 0}
              >
                Start Monitoring
              </Button>
            ) : (
              <Button 
                onClick={stopMonitoring}
                variant="destructive"
                className="flex-1"
              >
                Stop Monitoring
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 
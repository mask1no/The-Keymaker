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
  const [conditions, setConditions] = useState<SellConditions>({
    minPnlPercent: 100, // 100% gain
    maxLossPercent: -50, // 50% loss
    minHoldTime: 180, // 3 minutes
  });
  
  const [marketCapInput, setMarketCapInput] = useState('1000000');
  const [profitInput, setProfitInput] = useState('100');
  const [lossInput, setLossInput] = useState('50');
  const [timeDelayInput, setTimeDelayInput] = useState('180');
  
  useEffect(() => {
    // Load holdings from localStorage or database
    const loadHoldings = () => {
      const stored = localStorage.getItem('tokenHoldings');
      if (stored) {
        setHoldings(JSON.parse(stored));
      }
    };
    loadHoldings();
  }, []);
  
  const startMonitoring = () => {
    if (holdings.length === 0) {
      return toast.error('No holdings to monitor');
    }
    
    const updatedConditions: SellConditions = {
      minPnlPercent: parseFloat(profitInput) || undefined,
      maxLossPercent: parseFloat(lossInput) ? -parseFloat(lossInput) : undefined,
      minHoldTime: parseFloat(timeDelayInput) || undefined,
    };
    setConditions(updatedConditions);
    
    setIsMonitoring(true);
    toast.success('Sell monitoring started');
    
    // Start monitoring with callback
    const cleanup = monitorAndSell(
      holdings,
      conditions,
      30000, // Check every 30 seconds
      (holding, reason) => {
        toast.success(`Sell signal: ${reason}`, {
          duration: 10000,
          icon: '🔔',
        });
        
        // Here you would trigger the actual sell
        // For now, just log it
        logger.info('Sell signal triggered', { holding, reason });
      }
    );
    
    // Store cleanup function
    (window as Window & { __sellMonitorCleanup?: () => void }).__sellMonitorCleanup = cleanup;
  };
  
  const stopMonitoring = () => {
    setIsMonitoring(false);
    
    // Call cleanup function if exists
    const cleanup = (window as Window & { __sellMonitorCleanup?: () => void }).__sellMonitorCleanup;
    if (cleanup) {
      cleanup();
      delete (window as Window & { __sellMonitorCleanup?: () => void }).__sellMonitorCleanup;
    }
    
    toast.success('Sell monitoring stopped');
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Sell Monitor
            </span>
            <Badge variant={isMonitoring ? "default" : "outline"}>
              {isMonitoring ? 'Active' : 'Inactive'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Market Cap Threshold
              </Label>
              <Input
                type="number"
                value={marketCapInput}
                onChange={(e) => setMarketCapInput(e.target.value)}
                placeholder="1000000"
                disabled={isMonitoring}
                className="bg-black/50 border-aqua/30"
              />
              <p className="text-xs text-gray-400 mt-1">Sell when market cap reaches this value</p>
            </div>
            
            <div>
              <Label className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Profit Target (%)
              </Label>
              <Input
                type="number"
                value={profitInput}
                onChange={(e) => setProfitInput(e.target.value)}
                placeholder="100"
                disabled={isMonitoring}
                className="bg-black/50 border-aqua/30"
              />
              <p className="text-xs text-gray-400 mt-1">Sell when profit reaches this percentage</p>
            </div>
            
            <div>
              <Label className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                Stop Loss (%)
              </Label>
              <Input
                type="number"
                value={lossInput}
                onChange={(e) => setLossInput(e.target.value)}
                placeholder="50"
                disabled={isMonitoring}
                className="bg-black/50 border-aqua/30"
              />
              <p className="text-xs text-gray-400 mt-1">Sell when loss reaches this percentage</p>
            </div>
            
            <div>
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time Delay (seconds)
              </Label>
              <Input
                type="number"
                value={timeDelayInput}
                onChange={(e) => setTimeDelayInput(e.target.value)}
                placeholder="180"
                disabled={isMonitoring}
                className="bg-black/50 border-aqua/30"
              />
              <p className="text-xs text-gray-400 mt-1">Sell after holding for this duration</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-400">
              Monitoring {holdings.length} positions
            </div>
            
            <Button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              variant={isMonitoring ? "destructive" : "default"}
              className={isMonitoring ? "" : "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"}
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 
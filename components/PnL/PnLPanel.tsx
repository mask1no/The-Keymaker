'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/UI/table';
import { Skeleton } from '@/components/UI/skeleton';
import { TrendingUp, TrendingDown, Download, RefreshCw, DollarSign, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getAllWalletsPnL, 
  getSessionPnL, 
  exportPnLData,
  type WalletPnL
} from '@/services/pnlService';

export function PnLPanel() {
  const [walletPnL, setWalletPnL] = useState<WalletPnL[]>([]);
  const [sessionData, setSessionData] = useState({
    totalPnL: 0,
    pnlPercentage: 0,
    totalVolume: 0,
    profitableWallets: 0,
    totalWallets: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const loadPnLData = async () => {
    try {
      setRefreshing(true);
      const [wallets, session] = await Promise.all([
        getAllWalletsPnL(),
        getSessionPnL()
      ]);
      
      setWalletPnL(wallets.sort((a, b) => b.netPnL - a.netPnL));
      setSessionData(session);
    } catch (error) {
      toast.error('Failed to load P&L data');
      console.error('PnL loading error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    loadPnLData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadPnLData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const data = await exportPnLData(format);
      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pnl-report-${Date.now()}.${format}`;
      a.click();
      toast.success('P&L data exported successfully');
    } catch (error) {
      toast.error('Failed to export P&L data');
    }
  };
  
  const formatSOL = (amount: number) => {
    const formatted = amount.toFixed(4);
    return amount >= 0 ? `+${formatted}` : formatted;
  };
  
  const formatPercentage = (percentage: number) => {
    const formatted = percentage.toFixed(2);
    return percentage >= 0 ? `+${formatted}%` : `${formatted}%`;
  };
  
  const getColorClass = (value: number) => {
    return value >= 0 ? 'text-green-500' : 'text-red-500';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Session Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <Badge variant="outline" className={getColorClass(sessionData.totalPnL)}>
                24h
              </Badge>
            </div>
            <h3 className={`text-2xl font-bold ${getColorClass(sessionData.totalPnL)}`}>
              {formatSOL(sessionData.totalPnL)} SOL
            </h3>
            <p className="text-sm text-gray-400">Session P&L</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              {sessionData.pnlPercentage >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
            <h3 className={`text-2xl font-bold ${getColorClass(sessionData.pnlPercentage)}`}>
              {formatPercentage(sessionData.pnlPercentage)}
            </h3>
            <p className="text-sm text-gray-400">Return %</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold">
              {sessionData.totalVolume.toFixed(2)} SOL
            </h3>
            <p className="text-sm text-gray-400">Total Volume</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-green-500">
              {sessionData.profitableWallets}
            </h3>
            <p className="text-sm text-gray-400">Profitable Wallets</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold">
              {sessionData.totalWallets}
            </h3>
            <p className="text-sm text-gray-400">Active Wallets</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Wallet P&L Table */}
      <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Wallet P&L Breakdown
            </span>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => loadPnLData()}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport('json')}>
                <Download className="w-4 h-4 mr-1" />
                JSON
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport('csv')}>
                <Download className="w-4 h-4 mr-1" />
                CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : walletPnL.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No trading activity yet. Start trading to see P&L data!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wallet</TableHead>
                    <TableHead className="text-right">Invested</TableHead>
                    <TableHead className="text-right">Returned</TableHead>
                    <TableHead className="text-right">Gas Fees</TableHead>
                    <TableHead className="text-right">Jito Tips</TableHead>
                    <TableHead className="text-right">Net P&L</TableHead>
                    <TableHead className="text-right">P&L %</TableHead>
                    <TableHead className="text-right">Trades</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {walletPnL.map((wallet) => (
                    <TableRow key={wallet.wallet}>
                      <TableCell className="font-mono text-xs">
                        {wallet.wallet.slice(0, 8)}...{wallet.wallet.slice(-8)}
                      </TableCell>
                      <TableCell className="text-right">
                        {wallet.totalInvested.toFixed(4)} SOL
                      </TableCell>
                      <TableCell className="text-right">
                        {wallet.totalReturned.toFixed(4)} SOL
                      </TableCell>
                      <TableCell className="text-right text-yellow-500">
                        {wallet.totalGasFees.toFixed(4)} SOL
                      </TableCell>
                      <TableCell className="text-right text-purple-400">
                        {wallet.totalJitoTips.toFixed(4)} SOL
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${getColorClass(wallet.netPnL)}`}>
                        {formatSOL(wallet.netPnL)} SOL
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${getColorClass(wallet.pnlPercentage)}`}>
                        {formatPercentage(wallet.pnlPercentage)}
                      </TableCell>
                      <TableCell className="text-right">
                        {wallet.trades}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 
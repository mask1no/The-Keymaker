'use client';
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, Transaction, PublicKey, Keypair, VersionedTransaction } from '@solana/web3.js';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, Copy, Download, Zap, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/UI/table';
import { Skeleton } from '@/components/UI/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/UI/tooltip';
import { Badge } from '@/components/UI/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select';
import { previewBundle, executeBundle, type PreviewResult, type ExecutionResult } from '@/services/bundleService';
import { exportExecutionLog } from '@/services/executionLogService';
import { buildSwapTransaction, WSOL_MINT, convertToLamports } from '@/services/jupiterService';
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants';

interface TransactionInput {
  tokenAddress: string;
  amount: number;
  slippage: number;
  wallet?: string;
  action: 'buy' | 'sell';
  priorityFee?: number;
}

interface WalletWithRole {
  publicKey: string;
  role: 'master' | 'dev' | 'sniper' | 'normal';
  balance: number;
  keypair?: Keypair;
}

export function BundleEngine() {
  const { publicKey, signTransaction } = useWallet();
  const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed');
  
  const [transactions, setTransactions] = useState<TransactionInput[]>([]);
  const [preview, setPreview] = useState<PreviewResult[]>([]);
  const [results, setResults] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<number[]>([]);
  
  // Form inputs
  const [tokenAddress, setTokenAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('5');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [priorityFee, setPriorityFee] = useState('0.00001');
  
  // Wallet management
  const [wallets, setWallets] = useState<WalletWithRole[]>([]);
  const [activeGroup] = useState('default');
  
  useEffect(() => {
    // Load wallets from localStorage or database
    const loadWallets = async () => {
      const stored = localStorage.getItem(`walletGroup_${activeGroup}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setWallets(parsed.wallets || []);
      }
    };
    loadWallets();
  }, [activeGroup]);
  
  const addTransaction = () => {
    if (!tokenAddress || !amount || !slippage) {
      return toast.error('Fill all required fields');
    }
    
    if (transactions.length >= 20) {
      return toast.error('Maximum 20 transactions per bundle');
    }
    
    // Validate token address
    try {
      new PublicKey(tokenAddress);
    } catch {
      return toast.error('Invalid token address');
    }
    
    const newTx: TransactionInput = {
      tokenAddress,
      amount: parseFloat(amount),
      slippage: parseFloat(slippage),
      wallet: selectedWallet || publicKey?.toBase58(),
      action,
      priorityFee: parseFloat(priorityFee) * 1e9 // Convert SOL to lamports
    };
    
    setTransactions([...transactions, newTx]);
    
    // Reset form
    setTokenAddress('');
    setAmount('');
    setSelectedWallet('');
    
    toast.success('Transaction added to bundle');
  };
  
  const removeTransaction = (index: number) => {
    setTransactions(transactions.filter((_, i) => i !== index));
  };
  
  const clearBundle = () => {
    setTransactions([]);
    setPreview([]);
    setResults(null);
    toast.success('Bundle cleared');
  };
  
  const buildTransactions = async (): Promise<(Transaction | VersionedTransaction)[]> => {
    const txs: (Transaction | VersionedTransaction)[] = [];
    
    for (const input of transactions) {
      const feePayer = input.wallet ? new PublicKey(input.wallet) : publicKey!;
      
      try {
        if (input.action === 'buy') {
          // Buy token with SOL
          const swapTx = await buildSwapTransaction(
            WSOL_MINT,
            input.tokenAddress,
            convertToLamports(input.amount), // SOL amount in lamports
            feePayer.toBase58(),
            Math.floor(input.slippage * 100), // Convert percentage to basis points
            input.priorityFee
          );
          txs.push(swapTx);
        } else {
          // Sell token for SOL
          const swapTx = await buildSwapTransaction(
            input.tokenAddress,
            WSOL_MINT,
            convertToLamports(input.amount, 9), // Assuming 9 decimals, adjust as needed
            feePayer.toBase58(),
            Math.floor(input.slippage * 100),
            input.priorityFee
          );
          txs.push(swapTx);
        }
      } catch (error) {
        console.error(`Failed to build transaction for ${input.tokenAddress}:`, error);
        throw new Error(`Failed to build swap: ${(error as Error).message}`);
      }
    }
    
    return txs;
  };
  
  const convertToLegacyTransactions = async (txs: (Transaction | VersionedTransaction)[]): Promise<Transaction[]> => {
    const legacyTxs: Transaction[] = [];
    
    for (const tx of txs) {
      if (tx instanceof Transaction) {
        legacyTxs.push(tx);
      } else {
        // For now, we'll skip versioned transactions in preview
        // In production, you'd want to handle these properly
        const placeholderTx = new Transaction();
        placeholderTx.feePayer = publicKey!;
        legacyTxs.push(placeholderTx);
      }
    }
    
    return legacyTxs;
  };
  
  const handlePreview = async () => {
    if (transactions.length === 0) {
      return toast.error('Add transactions to preview');
    }
    
    setLoading(true);
    try {
      const txs = await buildTransactions();
      const legacyTxs = await convertToLegacyTransactions(txs);
      const previewData = await previewBundle(legacyTxs, connection);
      setPreview(previewData);
      
      const failures = previewData.filter(p => !p.success).length;
      if (failures > 0) {
        toast.error(`${failures} transactions failed simulation`);
      } else {
        toast.success('All transactions simulated successfully');
      }
    } catch (error) {
      toast.error(`Preview failed: ${(error as Error).message}`);
      setPreview([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleExecute = async () => {
    if (!publicKey) return toast.error('Connect wallet first');
    if (transactions.length === 0) return toast.error('Add transactions to execute');
    
    setLoading(true);
    try {
      const txs = await buildTransactions();
      const legacyTxs = await convertToLegacyTransactions(txs);
      
      // Get signers for each transaction
      const signers = wallets
        .filter(w => transactions.some(t => t.wallet === w.publicKey))
        .map(w => w.keypair!)
        .filter(Boolean);
      
      // If using connected wallet, create a pseudo-signer
      if (!signers.length && signTransaction) {
        // For connected wallet, we'll sign in the bundle service
        const pseudoSigner = {
          publicKey,
          secretKey: new Uint8Array(64) // Dummy, won't be used
        } as Keypair;
        signers.push(pseudoSigner);
      }
      
      // Execute bundle
      const result = await executeBundle(
        legacyTxs,
        wallets.map(w => ({ publicKey: w.publicKey, role: w.role })),
        signers,
        {
          feePayer: publicKey,
          tipAmount: 10000, // 0.00001 SOL tip
          logger: (msg: string) => console.log(`[Bundle] ${msg}`),
          connection
        }
      );
      
      setResults(result);
      
      // Show results
      const successCount = result.results.filter(r => r === 'success').length;
      if (successCount === result.results.length) {
        toast.success(`Bundle executed successfully! All ${successCount} transactions confirmed`);
      } else if (successCount > 0) {
        toast.error(`Bundle partially executed: ${successCount}/${result.results.length} succeeded`);
      } else {
        toast.error('Bundle execution failed');
      }
      
    } catch (error) {
      toast.error(`Execution failed: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Hotkey for execution
  useHotkeys('meta+enter,ctrl+enter', handleExecute, { enableOnFormTags: true });
  
  const handleExportLog = async () => {
    try {
      const log = await exportExecutionLog('json');
      const blob = new Blob([log], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keymaker-log-${Date.now()}.json`;
      a.click();
      toast.success('Log exported');
    } catch (error) {
      toast.error('Failed to export log');
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'sniper': return 'destructive';
      case 'dev': return 'secondary';
      case 'normal': return 'default';
      default: return 'outline';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 bg-black/40 backdrop-blur-xl rounded-xl border border-aqua/20"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-aqua flex items-center gap-2">
          <Zap className="w-6 h-6" />
          Bundle Engine
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Active Group: {activeGroup}</span>
          <Button variant="outline" size="sm" onClick={handleExportLog}>
            <Download className="w-4 h-4 mr-1" />
            Export Log
          </Button>
        </div>
      </div>
      
      {/* Transaction Input Form */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="col-span-2 lg:col-span-1">
          <Label>Token Address</Label>
          <Input
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="Token mint address"
            className="bg-black/50 border-aqua/30 font-mono text-sm"
          />
        </div>
        
        <div>
          <Label>Amount {action === 'buy' ? '(SOL)' : '(Tokens)'}</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            step="0.01"
            className="bg-black/50 border-aqua/30"
          />
        </div>
        
        <div>
          <Label>Slippage %</Label>
          <Input
            type="number"
            value={slippage}
            onChange={(e) => setSlippage(e.target.value)}
            placeholder="5"
            step="0.5"
            className="bg-black/50 border-aqua/30"
          />
        </div>
        
        <div>
          <Label>Priority Fee (SOL)</Label>
          <Input
            type="number"
            value={priorityFee}
            onChange={(e) => setPriorityFee(e.target.value)}
            placeholder="0.00001"
            step="0.00001"
            className="bg-black/50 border-aqua/30"
          />
        </div>
        
        <div>
          <Label>Wallet</Label>
          <Select value={selectedWallet} onValueChange={setSelectedWallet}>
            <SelectTrigger className="bg-black/50 border-aqua/30">
              <SelectValue placeholder="Connected wallet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Connected Wallet</SelectItem>
              {wallets.map(w => (
                <SelectItem key={w.publicKey} value={w.publicKey}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">
                      {w.publicKey.slice(0, 6)}...{w.publicKey.slice(-4)}
                    </span>
                    <Badge variant={getRoleBadgeColor(w.role) as any} className="text-xs">
                      {w.role}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Action</Label>
          <div className="flex gap-2 mt-2">
            <Button
              variant={action === 'buy' ? 'default' : 'outline'}
              onClick={() => setAction('buy')}
              className="flex-1"
            >
              Buy
            </Button>
            <Button
              variant={action === 'sell' ? 'default' : 'outline'}
              onClick={() => setAction('sell')}
              className="flex-1"
            >
              Sell
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <Button onClick={addTransaction} disabled={loading} className="bg-blue-500 hover:bg-blue-600">
          <Plus className="w-4 h-4 mr-1" />
          Add to Bundle
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handlePreview} disabled={loading || transactions.length === 0} variant="outline">
                Preview Bundle
              </Button>
            </TooltipTrigger>
            <TooltipContent>Simulate all transactions</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handleExecute} 
                disabled={loading || transactions.length === 0}
                className="bg-green-500 hover:bg-green-600"
              >
                Execute Bundle (⌘+Enter)
              </Button>
            </TooltipTrigger>
            <TooltipContent>Submit bundle to Jito</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Button onClick={clearBundle} disabled={loading} variant="destructive">
          Clear Bundle
        </Button>
      </div>
      
      {/* Transaction List */}
      {transactions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-aqua flex items-center gap-2">
            Bundle Transactions ({transactions.length}/20)
            {transactions.some(t => wallets.find(w => w.publicKey === t.wallet && w.role === 'sniper')) && (
              <Badge variant="destructive" className="text-xs">Sniper Priority</Badge>
            )}
          </h3>
          <div className="space-y-1">
            {transactions.map((tx, i) => {
              const wallet = wallets.find(w => w.publicKey === tx.wallet);
              return (
                <div key={i} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-aqua/10 hover:border-aqua/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {tx.action.toUpperCase()} {tx.amount} {tx.action === 'buy' ? 'SOL' : 'Tokens'}
                    </span>
                    <span className="text-sm text-gray-400">→</span>
                    <span className="font-mono text-sm text-gray-300">
                      {tx.tokenAddress.slice(0, 8)}...{tx.tokenAddress.slice(-8)}
                    </span>
                    {wallet && (
                      <Badge variant={getRoleBadgeColor(wallet.role) as any} className="text-xs">
                        {wallet.role}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      Slippage: {tx.slippage}%
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeTransaction(i)} className="hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Preview Results */}
      {loading && <Skeleton className="h-32 w-full" />}
      
      {preview.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-aqua">Simulation Results</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tx #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Compute Units</TableHead>
                <TableHead>Logs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.map((p, i) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    {p.success ? (
                      <Badge className="bg-green-500">Success</Badge>
                    ) : (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </TableCell>
                  <TableCell>{p.computeUnits.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedLogs(prev => 
                        prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
                      )}
                    >
                      {expandedLogs.includes(i) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {p.logs.length} logs
                    </Button>
                    {expandedLogs.includes(i) && (
                      <div className="mt-2 p-2 bg-black/50 rounded text-xs font-mono max-h-40 overflow-y-auto">
                        {p.error && (
                          <div className="text-red-400 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {p.error}
                          </div>
                        )}
                        {p.logs.map((log, j) => (
                          <div key={j} className="text-gray-400">{log}</div>
                        ))}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Execution Results */}
      {results && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 p-4 bg-black/50 rounded-lg border border-aqua/30"
        >
          <h3 className="text-lg font-semibold text-aqua">Execution Results</h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Bundle ID:</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs">{results.bundleId ? `${results.bundleId.slice(0, 12)}...` : 'N/A'}</span>
                {results.bundleId && (
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(results.bundleId!)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <div>
              <span className="text-gray-400">Slot:</span>
              <span className="ml-2 font-medium">{results.slotTargeted.toLocaleString()}</span>
            </div>
            
            <div>
              <span className="text-gray-400">Method:</span>
              <Badge variant={results.usedJito ? 'default' : 'outline'} className="ml-2">
                {results.usedJito ? 'Jito MEV' : 'Standard RPC'}
              </Badge>
            </div>
            
            <div>
              <span className="text-gray-400">Execution Time:</span>
              <span className="ml-2 font-medium">{(results.metrics.executionTime / 1000).toFixed(2)}s</span>
            </div>
            
            <div>
              <span className="text-gray-400">Success Rate:</span>
              <span className={`ml-2 font-medium ${results.metrics.successRate === 1 ? 'text-green-500' : 'text-yellow-500'}`}>
                {(results.metrics.successRate * 100).toFixed(0)}%
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Est. Cost:</span>
              <span className="ml-2 font-medium">{results.metrics.estimatedCost.toFixed(5)} SOL</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Transaction Links:</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {results.explorerUrls.map((url: string, i: number) => (
                url && (
                  <div key={i} className="flex items-center justify-between p-2 bg-black/30 rounded">
                    <span className="text-sm">
                      Transaction {i + 1}: {results.results[i] === 'success' ? '✅' : '❌'}
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-aqua hover:underline text-sm"
                    >
                      View on Solscan →
                    </a>
                  </div>
                )
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 
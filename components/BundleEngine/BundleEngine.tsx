'use client';
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, Transaction, SystemProgram, PublicKey, Keypair } from '@solana/web3.js';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, Copy, Download, Zap } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/UI/table';
import { Skeleton } from '@/components/UI/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/UI/tooltip';
import { previewBundle, executeBundle, type PreviewResult, type ExecutionResult } from '@/services/bundleService';
import { exportExecutionLog } from '@/services/executionLogService';
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants';

interface TransactionInput {
  tokenAddress: string;
  amount: number;
  slippage: number;
  wallet?: string;
  action: 'buy' | 'sell';
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
  
  // Wallet management
  const [wallets, setWallets] = useState<WalletWithRole[]>([]);
  const [activeGroup] = useState('default');
  
  useEffect(() => {
    // Load wallets from localStorage or database
    const loadWallets = async () => {
      const stored = localStorage.getItem(`walletGroup_${activeGroup}`);
      if (stored) {
        setWallets(JSON.parse(stored));
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
    
    const newTx: TransactionInput = {
      tokenAddress,
      amount: parseFloat(amount),
      slippage: parseFloat(slippage),
      wallet: selectedWallet || publicKey?.toBase58(),
      action
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
  
  const buildTransactions = async (): Promise<Transaction[]> => {
    const txs: Transaction[] = [];
    
    for (const input of transactions) {
      const tx = new Transaction();
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      
      // Set fee payer
      const feePayer = input.wallet ? new PublicKey(input.wallet) : publicKey!;
      tx.feePayer = feePayer;
      
      // Build transaction based on action
      if (input.action === 'buy') {
        // Simplified buy transaction - in production, use Jupiter or Raydium SDK
        tx.add(
          SystemProgram.transfer({
            fromPubkey: feePayer,
            toPubkey: new PublicKey(input.tokenAddress),
            lamports: Math.floor(input.amount * 1e9)
          })
        );
      } else {
        // Simplified sell transaction
        tx.add(
          SystemProgram.transfer({
            fromPubkey: feePayer,
            toPubkey: publicKey!,
            lamports: Math.floor(input.amount * 1e9)
          })
        );
      }
      
      txs.push(tx);
    }
    
    return txs;
  };
  
  const handlePreview = async () => {
    if (transactions.length === 0) {
      return toast.error('Add transactions to preview');
    }
    
    setLoading(true);
    try {
      const txs = await buildTransactions();
      const previewData = await previewBundle(txs, connection);
      setPreview(previewData);
      
      const failures = previewData.filter(p => !p.success).length;
      if (failures > 0) {
        toast.error(`${failures} transactions failed simulation`);
      } else {
        toast.success('All transactions simulated successfully');
      }
    } catch (error) {
      toast.error(`Preview failed: ${(error as Error).message}`);
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
      
      // Get signers for each transaction
      const signers = wallets
        .filter(w => transactions.some(t => t.wallet === w.publicKey))
        .map(w => w.keypair!)
        .filter(Boolean);
      
      // If using connected wallet, add it as signer
      if (!signers.length && signTransaction) {
        signers.push({ publicKey, secretKey: new Uint8Array(64) } as any);
      }
      
      // Execute bundle
      const result = await executeBundle(
        txs,
        wallets.map(w => ({ publicKey: w.publicKey, role: w.role })),
        signers,
        {
          feePayer: publicKey,
          logger: undefined,
          connection
        }
      );
      
      setResults(result);
      
      // Show results
      const successCount = result.results.filter(r => r === 'success').length;
      if (successCount === result.results.length) {
        toast.success(`Bundle executed successfully! All ${successCount} transactions confirmed`);
      } else {
        toast.error(`Bundle partially executed: ${successCount}/${result.results.length} succeeded`);
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Token Address</Label>
          <Input
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="Token mint address"
            className="bg-black/50 border-aqua/30"
          />
        </div>
        
        <div>
          <Label>Amount (SOL)</Label>
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
      
      <div className="flex gap-2">
        <Button onClick={addTransaction} disabled={loading} className="bg-blue-500 hover:bg-blue-600">
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
          <h3 className="text-lg font-semibold text-aqua">Bundle Transactions ({transactions.length}/20)</h3>
          <div className="space-y-1">
            {transactions.map((tx, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-black/30 rounded border border-aqua/10">
                <span className="text-sm">
                  {tx.action.toUpperCase()} {tx.amount} SOL → {tx.tokenAddress.slice(0, 8)}...
                </span>
                <Button size="sm" variant="ghost" onClick={() => removeTransaction(i)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Preview Results */}
      {loading && <Skeleton className="h-20 w-full" />}
      
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
                  <TableCell>{p.success ? '✅ Success' : '❌ Failed'}</TableCell>
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
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Bundle ID:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{results.bundleId || 'N/A'}</span>
                {results.bundleId && (
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(results.bundleId!)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <div>
              <span className="text-gray-400">Slot:</span>
              <span className="ml-2">{results.slotTargeted}</span>
            </div>
            
            <div>
              <span className="text-gray-400">Method:</span>
              <span className="ml-2">{results.usedJito ? 'Jito MEV' : 'Standard RPC'}</span>
            </div>
            
            <div>
              <span className="text-gray-400">Execution Time:</span>
              <span className="ml-2">{results.metrics.executionTime}ms</span>
            </div>
            
            <div>
              <span className="text-gray-400">Success Rate:</span>
              <span className="ml-2">{(results.metrics.successRate * 100).toFixed(0)}%</span>
            </div>
            
            <div>
              <span className="text-gray-400">Est. Cost:</span>
              <span className="ml-2">{results.metrics.estimatedCost.toFixed(4)} SOL</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Transaction Links:</h4>
            {results.explorerUrls.map((url: string, i: number) => (
              url && (
                <div key={i} className="flex items-center justify-between">
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
        </motion.div>
      )}
    </motion.div>
  );
} 
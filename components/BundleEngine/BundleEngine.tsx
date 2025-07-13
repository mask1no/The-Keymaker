'use client';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { executeBundle, previewBundle, PreviewResult } from '@/services/bundleService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useHotkeys } from 'react-hotkeys-hook';
import { ChevronDown, ChevronUp } from 'lucide-react';
interface Transaction {
  tokenAddress: string;
  amount: number;
  slippage: number;
}
export function BundleEngine() {
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [preview, setPreview] = useState<PreviewResult[]>([]);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [prioritizeSniper, setPrioritizeSniper] = useState(true);
  const [tokenAddress, setTokenAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('5');
  const [expandedLogs, setExpandedLogs] = useState<number[]>([]);
  const addTransaction = () => {
    if (!publicKey) return toast.error('Connect wallet first');
    if (!tokenAddress || !amount || !slippage) return toast.error('Fill all fields');
    setTransactions([...transactions, { tokenAddress, amount: parseFloat(amount), slippage: parseFloat(slippage) }]);
    setTokenAddress(''); setAmount(''); setSlippage('5');
    toast.success('Transaction added');
  };
  const handlePreview = async () => {
    setLoading(true);
    try {
      const previewData: PreviewResult[] = await previewBundle(transactions);
      setPreview(previewData);
      toast.success('Preview generated');
    } catch (error) {
      toast.error(`Preview failed: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  const handleExecute = async () => {
    if (!publicKey) return toast.error('Connect wallet first');
    setLoading(true);
    try {
      const result = await executeBundle(transactions, prioritizeSniper);
      setResults(result);
      toast.success('Bundle executed');
    } catch (error) {
      toast.error(`Execution failed: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  useHotkeys('meta+enter,ctrl+enter', handleExecute, { enableOnFormTags: true });
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label>Token Address</Label>
          <Input value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} placeholder="Enter token address" />
        </div>
        <div>
          <Label>Amount (SOL)</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.1–10" />
        </div>
        <div>
          <Label>Slippage (%)</Label>
          <Input type="number" value={slippage} onChange={(e) => setSlippage(e.target.value)} placeholder="1–10" />
        </div>
      </div>
      <div className="flex space-x-2">
        <Button onClick={addTransaction} disabled={!tokenAddress || !amount || !slippage || loading} className="bg-blue-500 hover:bg-blue-600">Add Transaction</Button>
        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button onClick={handlePreview} disabled={transactions.length === 0 || loading} variant="secondary">Preview</Button></TooltipTrigger><TooltipContent>Preview bundle simulation</TooltipContent></Tooltip></TooltipProvider>
        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button onClick={handleExecute} disabled={transactions.length === 0 || loading} variant="success">Execute</Button></TooltipTrigger><TooltipContent>Execute the bundle</TooltipContent></Tooltip></TooltipProvider>
        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button onClick={() => setTransactions([])} disabled={transactions.length === 0 || loading} variant="destructive">Clear</Button></TooltipTrigger><TooltipContent>Clear all transactions</TooltipContent></Tooltip></TooltipProvider>
        <div className="flex items-center space-x-2">
          <Switch checked={prioritizeSniper} onCheckedChange={setPrioritizeSniper} />
          <Label>Prioritize Sniper</Label>
        </div>
      </div>
      {loading && <Skeleton className="h-20 w-full" />}
      {preview.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Logs</TableHead>
              <TableHead>Compute Units</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.map((p, i) => (
              <TableRow key={i}>
                <TableCell>{p.success ? '✅' : '❌'}</TableCell>
                <TableCell>
                  <Button variant="ghost" onClick={() => setExpandedLogs(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}>
                    {expandedLogs.includes(i) ? <ChevronUp /> : <ChevronDown />} Logs ({p.logs.length})
                  </Button>
                  {expandedLogs.includes(i) && <ul>{p.logs.map((log, j) => <li key={j}>{log}</li>)}</ul>}
                </TableCell>
                <TableCell>{p.computeUnits}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {results && (
        <div className="space-y-2">
          <p>Slot: {results.slotTargeted}</p>
          <p>Jito: {results.usedJito ? 'Used' : 'Fallback'}</p>
          <p>Execution Time: {results.metrics.executionTime}ms</p>
          <p>Success Rate: {results.metrics.successRate * 100}%</p>
          <div>
            {results.explorerUrls.map((url, i) => url && <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-aqua hover:underline">Tx {i+1}</a>)}
          </div>
        </div>
      )}
    </motion.div>
  );
} 
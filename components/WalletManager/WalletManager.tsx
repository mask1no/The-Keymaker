'use client';
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import toast from 'react-hot-toast';
import { createWallet, fundWallets, sendSol } from '../../services/walletService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { NEXT_PUBLIC_HELIUS_RPC } from '../../constants';

type Wallet = { publicKey: string; role: 'master' | 'dev' | 'sniper' | 'normal'; balance: number; createdAt: string; encryptedPrivateKey: string };

export default function WalletManager() {
  const { wallet } = useWallet();
  const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'master' | 'dev' | 'sniper' | 'normal'>('normal');
  const [minSol, setMinSol] = useState(0.8);
  const [maxSol, setMaxSol] = useState(1.2);
  const [fromWallet, setFromWallet] = useState('');
  const [toWallet, setToWallet] = useState('');
  const [sendAmount, setSendAmount] = useState(0.1);
  const [exportKey, setExportKey] = useState('');
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch wallets from SQLite (assume endpoint or direct query)
    const fetchWallets = async () => {
      setLoading(true);
      // Placeholder: fetch from db
      // const res = await axios.get('/api/wallets');
      // setWallets(res.data);
      setLoading(false);
    };
    fetchWallets();
  }, []);

  const handleCreate = async () => {
    try {
      const newWallet = await createWallet(password, role);
      setWallets([...wallets, { ...newWallet, balance: 0, createdAt: new Date().toISOString(), role }]);
      toast.success('Wallet created');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleFund = async () => {
    if (!wallet) return toast.error('Master wallet not connected');
    try {
      const sigs = await fundWallets(wallet.adapter, wallets.map(w => w.publicKey), minSol, maxSol, connection);
      toast.success(`Funded ${sigs.length} wallets`);
    } catch (error) {
      toast.error('Funding failed');
    }
  };

  const handleSend = async () => {
    if (!wallet) return toast.error('From wallet not connected');
    try {
      const sig = await sendSol(wallet.adapter, toWallet, sendAmount, connection);
      toast.success(`Sent: https://solscan.io/tx/${sig}?cluster=devnet`);
    } catch (error) {
      toast.error('Send failed');
    }
  };

  const handleExport = async (pk: string) => {
    if (!captchaChecked) return toast.error('Complete CAPTCHA');
    // Decrypt and show/export
    toast.success(`Exported key for ${pk}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <Input type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} placeholder="Password" />
        <Select onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="master">Master</SelectItem>
            <SelectItem value="dev">Dev</SelectItem>
            <SelectItem value="sniper">Sniper</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleCreate}>Create Wallet</Button>
        <Input type="number" value={minSol} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinSol(parseFloat(e.target.value))} placeholder="Min SOL" />
        <Input type="number" value={maxSol} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxSol(parseFloat(e.target.value))} placeholder="Max SOL" />
        <Button onClick={handleFund}>Fund Wallets</Button>
        <Input value={fromWallet} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromWallet(e.target.value)} placeholder="From Wallet" />
        <Input value={toWallet} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToWallet(e.target.value)} placeholder="To Wallet" />
        <Input type="number" value={sendAmount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSendAmount(parseFloat(e.target.value))} placeholder="Amount" />
        <Button onClick={handleSend}>Send SOL</Button>
        {loading ? <Skeleton className="h-64 w-full" /> : (
          wallets.map(w => (
            <Card key={w.publicKey} className="mt-4">
              <CardContent>
                <p>PK: {w.publicKey}</p>
                <p>Balance: {w.balance} SOL</p>
                <Select defaultValue={w.role} onValueChange={newRole => {/* Update role */}}>
                  <SelectTrigger>
                    <SelectValue placeholder={w.role} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="master">Master</SelectItem>
                    <SelectItem value="dev">Dev</SelectItem>
                    <SelectItem value="sniper">Sniper</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Export Key</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Export Private Key</DialogTitle>
                    </DialogHeader>
                    <Input type="password" placeholder="Password" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExportKey(e.target.value)} />
                    <Checkbox checked={captchaChecked} onCheckedChange={setCaptchaChecked}>I'm not a robot</Checkbox>
                    <Button onClick={() => handleExport(w.publicKey)}>Export</Button>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
} 
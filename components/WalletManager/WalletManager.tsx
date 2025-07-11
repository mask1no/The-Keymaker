import React from 'react';
import { useState } from 'react';
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore
import { Button } from '@/components/ui/button';
// @ts-ignore
import { Input } from '@/components/ui/input';
// @ts-ignore
import { Select } from '@/components/ui/select';
import { createWallet, fundWallets, sendSol } from '../../services/walletService';
import { WalletProps } from '../../lib/types';

export default React.memo(function WalletManager() {
  const [wallets, setWallets] = useState<WalletProps[]>([]);
  const [minSol, setMinSol] = useState(0.8);
  const [maxSol, setMaxSol] = useState(1.2);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState(0.1);

  const handleCreateWallet = async () => {
    const newWallet = await createWallet('password');
    setWallets([...wallets, newWallet]);
  };

  const handleFund = async () => {
    const walletAddrs = wallets.map(w => w.publicKey);
    await fundWallets('masterKey', walletAddrs, minSol, maxSol);
  };

  const handleSend = async () => {
    await sendSol(from, to, amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleCreateWallet}>Create Wallet</Button>
        <div>
          {wallets.map((w: WalletProps, i: number) => (
            <div key={i}>{w.publicKey} - Balance: {w.balance} SOL - Role: <Select value={w.role}><option>normal</option><option>sniper</option></Select></div>
          ))}
        </div>
        <div>
          <Input type="number" value={minSol} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinSol(parseFloat(e.target.value))} placeholder="Min SOL" />
          <Input type="number" value={maxSol} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxSol(parseFloat(e.target.value))} placeholder="Max SOL" />
          <Button onClick={handleFund}>Fund Wallets</Button>
        </div>
        <div>
          <Input value={from} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)} placeholder="From" />
          <Input value={to} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)} placeholder="To" />
          <Input type="number" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(parseFloat(e.target.value))} placeholder="Amount" />
          <Button onClick={handleSend}>Send SOL</Button>
        </div>
      </CardContent>
    </Card>
  );
}); 
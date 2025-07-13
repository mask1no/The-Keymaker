'use client';
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { createToken as raydiumCreate } from '../../services/raydiumService';
import { createToken as pumpfunCreate } from '../../services/pumpfunService';
import { createToken as letsbonkCreate } from '../../services/letsbonkService';
import { createToken as moonshotCreate } from '../../services/moonshotService';

export default function TokenForm() {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [supply, setSupply] = useState(1000000000);
  const [image, setImage] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');
  const [x, setX] = useState('');
  const [platform, setPlatform] = useState('Raydium');

  const metadata = { name, ticker, supply, image, telegram, website, x };

  const handleDeploy = async () => {
    try {
      let tokenAddr;
      switch (platform) {
        case 'Raydium': tokenAddr = await raydiumCreate(name, ticker, supply, metadata); break;
        case 'Pump.fun': tokenAddr = await pumpfunCreate(name, ticker, supply, metadata); break;
        case 'LetsBonk.fun': tokenAddr = await letsbonkCreate(name, ticker, supply, metadata); break;
        case 'Moonshot': tokenAddr = await moonshotCreate(name, ticker, supply, metadata); break;
      }
      toast.success(`Token deployed: ${tokenAddr}`);
    } catch (error) {
      toast.error('Deployment failed');
    }
  };

  const handlePreview = () => {
    toast(`Preview: ${name} (${ticker}), Supply: ${supply}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Memecoin</CardTitle>
      </CardHeader>
      <CardContent>
        <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Name" />
        <Input value={ticker} onChange={e => setTicker(e.target.value)} placeholder="Ticker" />
        <Input type="number" value={supply} onChange={e => setSupply(parseInt(e.target.value))} placeholder="Supply" />
        <Input value={image} onChange={e => setImage(e.target.value)} placeholder="Image URL" />
        <Input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="Telegram" />
        <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website" />
        <Input value={x} onChange={e => setX(e.target.value)} placeholder="X.com" />
        <Select onValueChange={setPlatform}>
          <SelectTrigger>
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Raydium">Raydium</SelectItem>
            <SelectItem value="Pump.fun">Pump.fun</SelectItem>
            <SelectItem value="LetsBonk.fun">LetsBonk.fun</SelectItem>
            <SelectItem value="Moonshot">Moonshot</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handlePreview}>Preview Token</Button>
        <Button onClick={handleDeploy}>Deploy Token</Button>
      </CardContent>
    </Card>
  );
} 
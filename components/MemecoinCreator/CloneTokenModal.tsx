'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/UI/dialog';
import { Input } from '@/components/UI/input';
import { Button } from '@/components/UI/button';
import toast from 'react-hot-toast';
import { cloneToken } from '../../services/platformService';

export default function CloneTokenModal({ platform }: { platform: string }) {
  const [tokenAddr, setTokenAddr] = useState('');

  const handleClone = async () => {
    if (!tokenAddr || tokenAddr.length !== 44) return toast.error('Invalid token address');
    try {
      const metadata = await cloneToken(platform, tokenAddr);
      toast.success(`Cloned token: ${metadata.name}`);
    } catch (error) {
      toast.error('Cloning failed');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Clone Token</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone Memecoin</DialogTitle>
        </DialogHeader>
        <Input value={tokenAddr} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTokenAddr(e.target.value)} placeholder="Token Address" />
        <Button onClick={handleClone}>Clone</Button>
      </DialogContent>
    </Dialog>
  );
} 
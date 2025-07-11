import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cloneToken } from '../../services/platformService';
import { useState } from 'react';

export default function CloneTokenModal({ platform }) {
  const [tokenAddr, setTokenAddr] = useState('');

  const handleClone = async () => {
    await cloneToken(platform, tokenAddr);
  };

  return (
    <Dialog>
      <DialogTrigger>Clone Token</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone Token</DialogTitle>
        </DialogHeader>
        <Input value={tokenAddr} onChange={e => setTokenAddr(e.target.value)} placeholder="Token Address" />
        <Button onClick={handleClone}>Clone</Button>
      </DialogContent>
    </Dialog>
  );
} 
'use client';
import { useEffect, useState } from 'react';
import { Radio, Server, Zap } from 'lucide-react';
import { useHealth } from '@/hooks/useHealth';
const Chip = ({ ok, label, Icon }: { o, k: boolean; l, a, b, el: string; I, c, o, n: any }) => (
  <div className="flex items-center gap-2 rounded-xl border px-2 py-1 text-xs bg-card">
    
    <Icon className="h-3.5 w-3.5 opacity-90" />
    <span className={ok ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
  </div>
);
export default function NavStatus() {
  const [net, setNet] = useState<'MAINNET' | 'DEVNET' | 'UNKNOWN'>('UNKNOWN');
  const { health } = useHealth();
  const h = health || null;
  useEffect(() => {
    const rpcUrl = (process.env.NEXT_PUBLIC_HELIUS_RPC || '').toLowerCase();
    setNet(rpcUrl.includes('devnet') ? 'DEVNET' : rpcUrl ? 'MAINNET' : 'UNKNOWN');
  }, []);
  const rpcOk = h?.rpc?.light === 'green';
  const jitoOk = h?.jito?.light === 'green';
  const wsOk = h?.ws?.light === 'green';
  return (
    <div className="grid grid-cols-2 gap-2">
      <Chip ok={rpcOk} label="RPC" Icon={Server} />
      <Chip ok={wsOk} label="WS" Icon={Radio} />
      <Chip ok={jitoOk} label="JITO" Icon={Zap} />
      <Chip ok label={net} Icon={Server} />
    </div>
  );
}


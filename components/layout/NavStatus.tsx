'use client';
import { useEffect, useState } from 'react';
import { Radio, Server, Zap } from 'lucide-react';
const Chip = ({ ok, label, Icon }: { ok: boolean; label: string; Icon: any }) => (
  <div className="flex items-center gap-2 rounded-xl border px-2 py-1 text-xs bg-card">
    {' '}
    <Icon className="h-3.5 w-3.5 opacity-90" />{' '}
    <span className={ok ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>{' '}
  </div>
);
export default function NavStatus() {
  const [rpc, setRpc] = useState(false);
  const [ws, setWs] = useState(false);
  const [jito, setJito] = useState(false);
  const [net, setNet] = useState<'MAINNET' | 'DEVNET' | 'UNKNOWN'>('UNKNOWN');
  useEffect(() => {
    const rpcUrl = (process.env.NEXT_PUBLIC_HELIUS_RPC || '').toLowerCase();
    setNet(rpcUrl.includes('devnet') ? 'DEVNET' : rpcUrl ? 'MAINNET' : 'UNKNOWN');
    fetch('/api/jito/tipfloor', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => {
        setRpc(true);
        setJito(true);
      })
      .catch(() => {
        setRpc(false);
        setJito(false);
      });
    const wsUrl = (process.env.NEXT_PUBLIC_HELIUS_WS || '').trim();
    if (!wsUrl) return setWs(false);
    try {
      const s = new WebSocket(wsUrl);
      let opened = false;
      s.onopen = () => {
        opened = true;
        setWs(true);
        s.close();
      };
      s.onerror = () => {
        if (!opened) setWs(false);
      };
    } catch {
      setWs(false);
    }
  }, []);
  return (
    <div className="grid grid-cols-2 gap-2">
      {' '}
      <Chip ok={rpc} label="RPC" Icon={Server} /> <Chip ok={ws} label="WebSocket" Icon={Radio} />{' '}
      <Chip ok={jito} label="JITO" Icon={Zap} /> <Chip ok label={net} Icon={Server} />{' '}
    </div>
  );
}

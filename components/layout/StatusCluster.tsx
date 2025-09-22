'use client';
import { useEffect, useState } from 'react';
import { Radio, Server, Zap, Activity } from 'lucide-react';
import { useHealth } from '@/hooks/useHealth';

function Chip({ ok, label, Icon }: { ok: boolean; label: string; Icon: any }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-zinc-800/70 bg-zinc-900/40 px-2 py-1 text-xs max-w-full overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label={`${label} ${ok ? 'healthy' : 'down'}`}
    >
      <Icon className={'h-3.5 w-3.5 shrink-0 ' + (ok ? 'text-zinc-300' : 'text-zinc-500')} />
      <span className={(ok ? 'text-zinc-200' : 'text-zinc-500') + ' truncate'}>{label}</span>
    </div>
  );
}

export default function StatusCluster() {
  const [ws, setWs] = useState(false);
  const [net, setNet] = useState<'MAINNET' | 'DEVNET' | 'UNKNOWN'>('UNKNOWN');
  const { health } = useHealth();

  useEffect(() => {
    const rpcUrl = (process.env.NEXT_PUBLIC_HELIUS_RPC || '').toLowerCase();
    setNet(rpcUrl.includes('devnet') ? 'DEVNET' : rpcUrl ? 'MAINNET' : 'UNKNOWN');
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

  const rpcOk = !!health && health.checks.rpc.status === 'healthy';
  const jitoOk = !!health && health.checks.jito.status === 'healthy';

  return (
    <div className="grid grid-cols-2 gap-2">
      <Chip ok={rpcOk} label="RPC" Icon={Server} />
      <Chip ok={ws} label="WebSocket" Icon={Radio} />
      <Chip ok={jitoOk} label="JITO" Icon={Zap} />
      <Chip ok label={net} Icon={Activity} />
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { Radio, Server, Zap, Activity } from 'lucide-react';
import { useHealth } from '@/hooks/useHealth';

function Light({ light, label, Icon, meta }: { light: 'green' | 'amber' | 'red' | undefined; label: string; Icon: any; meta?: string }) {
  const ok = light === 'green';
  const color = light === 'green' ? 'text-emerald-400' : light === 'amber' ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800/70 bg-zinc-900/40 px-3 py-2 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={'h-3.5 w-3.5 shrink-0 ' + color} />
        <span className={(ok ? 'text-zinc-200' : 'text-zinc-400') + ' truncate'}>{label}</span>
      </div>
      {meta && <span className="text-[10px] text-zinc-500 ml-2 whitespace-nowrap">{meta}</span>}
    </div>
  );
}

export default function StatusCluster() {
  const [wsLight, setWsLight] = useState<'green' | 'amber' | 'red'>('red');
  const [net, setNet] = useState<'MAINNET' | 'DEVNET' | 'UNKNOWN'>('UNKNOWN');
  const { health } = useHealth();

  useEffect(() => {
    const rpcUrl = (process.env.NEXT_PUBLIC_HELIUS_RPC || '').toLowerCase();
    setNet(rpcUrl.includes('devnet') ? 'DEVNET' : rpcUrl ? 'MAINNET' : 'UNKNOWN');
    const wsUrl = (process.env.NEXT_PUBLIC_HELIUS_WS || '').trim();
    if (!wsUrl) return setWsLight('red');
    let attempt = 0;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      try {
        const s = new WebSocket(wsUrl);
        let opened = false;
        s.onopen = () => {
          opened = true;
          attempt = 0;
          setWsLight('green');
          s.close();
        };
        s.onerror = () => {
          if (!opened) setWsLight('red');
        };
        s.onclose = () => {
          if (stopped) return;
          // exponential backoff with jitter up to 30s
          attempt += 1;
          const base = Math.min(30_000, 500 * 2 ** attempt);
          const jitter = Math.floor(Math.random() * 300);
          const delay = Math.min(30_000, base + jitter);
          setTimeout(connect, delay);
        };
      } catch {
        setWsLight('red');
        attempt += 1;
        const base = Math.min(30_000, 500 * 2 ** attempt);
        const jitter = Math.floor(Math.random() * 300);
        const delay = Math.min(30_000, base + jitter);
        setTimeout(connect, delay);
      }
    };
    connect();
    return () => {
      stopped = true;
    };
  }, []);

  const rpc = health?.rpc;
  const jito = health?.jito;
  const sm = health?.sm;

  return (
    <div className="grid grid-cols-2 gap-2">
      <Light light={rpc?.light} label="RPC" Icon={Server} meta={rpc?.latencyMs ? `${rpc.latencyMs}
ms` : undefined} />
      <Light light={wsLight} label="WS" Icon={Radio} />
      <Light light={jito?.light} label="JITO" Icon={Zap} meta={jito?.latencyMs ? `${jito.latencyMs}
ms` : undefined} />
      <Light light={sm?.light} label={net} Icon={Activity} />
    </div>
  );
}


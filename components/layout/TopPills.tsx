'use client';
import { useEffect, useState } from 'react';
import BadgePill from '@/components/ui/BadgePill';

type Ui = { mode: 'JITO_BUNDLE' | 'RPC_FANOUT'; dryRun?: boolean; cluster?: 'mainnet-beta' | 'devnet' };

export default function TopPills(): JSX.Element {
  const [ui, setUi] = useState<Ui>({ mode: 'JITO_BUNDLE', dryRun: true, cluster: 'mainnet-beta' });
  const [armedUntil, setArmedUntil] = useState<string>('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await fetch('/api/ui/settings', { cache: 'no-store' }).then((r) => r.json());
        if (!alive) return;
        setUi({ mode: u.mode || 'JITO_BUNDLE', dryRun: !!u.dryRun, cluster: u.cluster || 'mainnet-beta' });
      } catch {}
      try {
        const st = await fetch('/api/ops/status', { cache: 'no-store' }).then((r) => r.json());
        if (!alive) return;
        if (st.armed && st.armedUntil) setArmedUntil(new Date(st.armedUntil).toLocaleTimeString());
        else setArmedUntil('');
      } catch {}
    })();
    const id = setInterval(() => {
      void fetch('/api/ops/status', { cache: 'no-store' })
        .then((r) => r.json())
        .then((st) => setArmedUntil(st.armed && st.armedUntil ? new Date(st.armedUntil).toLocaleTimeString() : ''))
        .catch(() => {});
    }, 10000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="hidden md:flex items-center gap-2 ml-auto">
      <BadgePill tone="accent">Execution: {ui.mode}</BadgePill>
      <BadgePill tone={armedUntil ? 'success' : 'muted'}>ARMED {armedUntil ? `until ${armedUntil}` : '(disarmed)'}</BadgePill>
      <button
        className="focus:outline-none"
        onClick={async () => {
          const next = !ui.dryRun;
          setUi({ ...ui, dryRun: next });
          await fetch('/api/ui/settings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dryRun: next }) });
        }}
        aria-label={`Toggle dry-run (currently ${ui.dryRun ? 'on' : 'off'})`}
      >
        <BadgePill tone={ui.dryRun ? 'warn' : 'danger'}>DryRun: {ui.dryRun ? 'ON' : 'OFF'}</BadgePill>
      </button>
      <button
        className="focus:outline-none"
        onClick={async () => {
          const next = ui.cluster === 'mainnet-beta' ? 'devnet' : 'mainnet-beta';
          setUi({ ...ui, cluster: next });
          await fetch('/api/ui/settings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cluster: next }) });
        }}
        aria-label={`Switch cluster (currently ${ui.cluster})`}
      >
        <BadgePill>Cluster: {ui.cluster}</BadgePill>
      </button>
    </div>
  );
}



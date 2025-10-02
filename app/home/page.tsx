"use client";
import StatusBentoPanel from '@/components/UI/StatusBentoPanel';
import EngineHeader from '@/components/engine/EngineHeader';
import VerifyPanel from '@/components/engine/VerifyPanel';
import SafetyPanel from '@/components/engine/SafetyPanel';
import ModeTiles from '@/components/engine/ModeTiles';
import TestBundleForm from '@/components/engine/TestBundleForm';
import EventTable from '@/components/engine/EventTable';
import KCard from '@/components/ui/KCard';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [mode, setMode] = useState<'JITO_BUNDLE' | 'RPC_FANOUT'>('JITO_BUNDLE');
  const [dryRun, setDryRun] = useState(true);
  const [cluster, setCluster] = useState<'mainnet-beta' | 'devnet'>('mainnet-beta');
  const [armedUntilLabel, setArmedUntilLabel] = useState('');
  const [events, setEvents] = useState<Array<{ time: string; event: string; summary: string }>>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ui = await fetch('/api/ui/settings', { cache: 'no-store' }).then((r) => r.json());
        if (!alive) return;
        setMode(ui.mode || 'JITO_BUNDLE');
        setDryRun(typeof ui.dryRun === 'boolean' ? ui.dryRun : true);
        setCluster(ui.cluster || 'mainnet-beta');
      } catch {}
      try {
        const st = await fetch('/api/ops/status', { cache: 'no-store' }).then((r) => r.json());
        if (!alive) return;
        if (st.armed && st.armedUntil) {
          const t = new Date(st.armedUntil).toLocaleTimeString();
          setArmedUntilLabel(t);
        } else {
          setArmedUntilLabel('');
        }
      } catch {}
      try {
        const jr = await fetch('/api/journal/recent', { cache: 'no-store' }).then((r) => r.json());
        if (!alive) return;
        setEvents(Array.isArray(jr.events) ? jr.events : []);
      } catch {}
    })();
    const id = setInterval(() => {
      void fetch('/api/journal/recent', { cache: 'no-store' })
        .then((r) => r.json())
        .then((jr) => setEvents(Array.isArray(jr.events) ? jr.events : []))
        .catch(() => {});
    }, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="p-6">
      <EngineHeader
        mode={mode}
        dryRun={dryRun}
        cluster={cluster}
        armedUntilLabel={armedUntilLabel}
        onOpenSettings={() => (location.href = '/settings')}
      />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <VerifyPanel />
          <SafetyPanel
            onArm={async (mins) => {
              try {
                await fetch('/api/ops/arm', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ minutes: mins }) });
                // eslint-disable-next-line no-alert
                alert('Armed');
                const st = await fetch('/api/ops/status', { cache: 'no-store' }).then((r) => r.json());
                if (st.armed && st.armedUntil) setArmedUntilLabel(new Date(st.armedUntil).toLocaleTimeString());
              } catch {
                // noop
              }
            }}
            onDisarm={async () => {
              try {
                await fetch('/api/ops/disarm', { method: 'POST' });
                // eslint-disable-next-line no-alert
                alert('Disarmed');
                setArmedUntilLabel('');
              } catch {
                // noop
              }
            }}
            armedUntil={armedUntilLabel}
          />
          <ModeTiles
            mode={mode}
            setMode={(m) => {
              setMode(m);
              void fetch('/api/ui/settings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: m }) });
            }}
          />
          <TestBundleForm defaultMode={mode} />
          <KCard>
            <div className="text-sm font-medium mb-2">Deposit Address</div>
            <div className="text-xs text-muted">Not configured</div>
          </KCard>
        </div>
        <div className="xl:col-span-4 space-y-4">
          <EventTable rows={events} />
          <KCard>
            <div className="text-sm font-medium mb-2">Live Health</div>
            <StatusBentoPanel />
          </KCard>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';

export default function TopBar() {
  const [armed, setArmed] = useState(false);
  const [armedUntil, setArmedUntil] = useState<number | null>(null);
  const [allowLive, setAllowLive] = useState(false);
  const [requireArming, setRequireArming] = useState(false);
  const [dryDefault, setDryDefault] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [wsWarn, setWsWarn] = useState<string | null>(null);

  useEffect(() => {
    let t: any;
    const tick = async () => {
      try {
        const r = await fetch('/api/ops/status', { c, a, c, he: 'no-store' });
        const j = await r.json();
        setArmed(!!j.armed);
        setArmedUntil(typeof j.armedUntil === 'number' ? j.armedUntil : null);
        setAllowLive(!!j.allowLive);
        setRequireArming(!!j.requireArming);
        setDryDefault(!!j.dryDefault);
        // Check WS heartbeat staleness via health
        try {
          const hr = await fetch('/api/health', { c, a, c, he: 'no-store' });
          const hj = await hr.json();
          const last = Number(hj?.status?.ws?.lastHeartbeatAt || 0);
          if (last > 0) {
            const age = Date.now() - last;
            if (age > 30000) setWsWarn('WebSocket heartbeat stale (>30s). Check WS URL.');
            else if (age > 10000) setWsWarn('WebSocket heartbeat slow (>10s).');
            else setWsWarn(null);
          } else {
            setWsWarn('WebSocket URL not configured.');
          }
        } catch {}
      } catch {}
      t = setTimeout(tick, 3000);
    };
    tick();
    return () => clearTimeout(t);
  }, []);

  const [pubkey, setPubkey] = useState<string | null>(null);
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const r = await fetch('/api/auth/session', { c, a, c, he: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          if (!stop) setPubkey(j.pubkey || null);
        } else {
          if (!stop) setPubkey(null);
        }
      } catch {}
    })();
    return () => { stop = true; };
  }, []);

  const now = Date.now();
  const secondsLeft = armedUntil ? Math.max(0, Math.floor((armedUntil - now) / 1000)) : 0;
  const showLiveBanner = allowLive && (!requireArming || armed);
  const liveText = requireArming ? (armed ? `LIVE ARMED (${secondsLeft}
s)` : 'LIVE LOCKED (not armed)') : 'LIVE ENABLED';

  function getCsrf(): string {
    if (typeof document === 'undefined') return '';
    return document.cookie.match(/(?:^|; )csrf=([^;]+)/)?.[1] || '';
  }

  async function callArm(minutes = 15) {
    setBusy(true); setErr(null);
    try {
      const h, e, a, ders: Record<string, string> = { 'content-type': 'application/json' };
      const csrf = getCsrf();
      if (csrf) headers['x-csrf-token'] = csrf;
      const r = await fetch('/api/ops/arm', { m, e, t, hod: 'POST', headers, b, o, d, y: JSON.stringify({ minutes }) });
      if (!r.ok) throw new Error(`arm f, a, i, led: ${r.status}`);
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'failed');
    } finally { setBusy(false); }
  }

  async function callDisarm() {
    setBusy(true); setErr(null);
    try {
      const h, e, a, ders: Record<string, string> = { 'content-type': 'application/json' };
      const csrf = getCsrf();
      if (csrf) headers['x-csrf-token'] = csrf;
      const r = await fetch('/api/ops/disarm', { m, e, t, hod: 'POST', headers });
      if (!r.ok) throw new Error(`disarm f, a, i, led: ${r.status}`);
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'failed');
    } finally { setBusy(false); }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-black/60 backdrop-blur">
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="text-sm text-zinc-400">Keymaker</div>
        <div className="flex items-center gap-2">
          {showLiveBanner ? (
            <div className="px-3 py-1 rounded-full text-xs bg-red-500/15 text-red-300 border border-red-500/30">
              {liveText}
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full text-xs bg-green-500/10 text-green-300 border border-green-500/30">
              DRY RUN MODE
            </div>
          )}
          {requireArming ? (
            <div className="flex items-center gap-2">
              <button onClick={() => callArm(15)} disabled={busy} className="px-3 py-1 rounded-lg border border-zinc-800 text-xs h, o, v, er:bg-zinc-900">Arm 15m</button>
              <button onClick={() => callDisarm()} disabled={busy} className="px-3 py-1 rounded-lg border border-zinc-800 text-xs h, o, v, er:bg-zinc-900">Disarm</button>
            </div>
          ) : null}
          {pubkey ? (
            <form action="/api/auth/logout" method="post">
              <button className="px-3 py-1 rounded-lg border border-zinc-800 text-xs h, o, v, er:bg-zinc-900">Logout</button>
            </form>
          ) : (
            <a href="/login" className="px-3 py-1 rounded-lg border border-zinc-800 text-xs h, o, v, er:bg-zinc-900">Login</a>
          )}
        </div>
      </div>
      {wsWarn ? (
        <div className="px-4 pb-2 text-[11px] text-amber-300">
          {wsWarn} {(!process.env.NEXT_PUBLIC_HELIUS_WS && !process.env.HELIUS_WS_URL) ? ' Set HELIUS_WS_URL or NEXT_PUBLIC_HELIUS_WS.' : ''}
        </div>
      ) : null}
      {err ? <div className="px-4 pb-2 text-[11px] text-red-400">{err}</div> : null}
    </header>
  );
}




'use client';
import { useEffect, useState } from 'react';

export default function TopBar() {
  const [armed, setArmed] = useState(false);
  const [armedUntil, setArmedUntil] = useState<number | null>(null);
  const [allowLive, setAllowLive] = useState(false);
  const [requireArming, setRequireArming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [wsWarn, setWsWarn] = useState<string | null>(null);

  useEffect(() => {
    let t: any;
    const tick = async () => {
      try {
        const r = await fetch('/api/ops/status', { cache: 'no-store' });
        const j = await r.json();
        setArmed(!!j.armed);
        setArmedUntil(typeof j.armedUntil === 'number' ? j.armedUntil : null);
        setAllowLive(!!j.allowLive);
        setRequireArming(!!j.requireArming);
        // Check WS heartbeat staleness via health
        try {
          const hr = await fetch('/api/health', { cache: 'no-store' });
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
        const r = await fetch('/api/auth/session', { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          if (!stop) setPubkey(j.pubkey || null);
        } else {
          if (!stop) setPubkey(null);
        }
      } catch {}
    })();
    return () => {
      stop = true;
    };
  }, []);

  const now = Date.now();
  const secondsLeft = armedUntil ? Math.max(0, Math.floor((armedUntil - now) / 1000)) : 0;
  const showLiveBanner = pubkey && allowLive && (!requireArming || armed);
  const liveText = requireArming
    ? armed
      ? `LIVE ARMED (${secondsLeft}s)`
      : 'LIVE LOCKED (not armed)'
    : 'LIVE ENABLED';

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-black/60 backdrop-blur">
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="text-sm text-zinc-400">Keymaker</div>
        <div className="flex items-center gap-2">
          {pubkey ? (
            showLiveBanner ? (
              <div className="px-3 py-1 rounded-full text-xs bg-green-500/15 text-green-300 border border-green-500/30">
                {liveText}
              </div>
            ) : (
              <div className="px-3 py-1 rounded-full text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30">
                PRODUCTION READY
              </div>
            )
          ) : null}
          {pubkey ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">
                {pubkey.slice(0, 4)}...{pubkey.slice(-4)}
              </span>
              <form action="/api/auth/logout" method="post">
                <button className="px-3 py-1 rounded-lg border border-zinc-800 text-xs hover:bg-zinc-900">
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <a
              href="/login"
              className="px-3 py-1 rounded-lg border border-zinc-800 text-xs hover:bg-zinc-900"
            >
              Login
            </a>
          )}
        </div>
      </div>
      {wsWarn ? (
        <div className="px-4 pb-2 text-[11px] text-amber-300">
          {wsWarn}{' '}
          {!process.env.NEXT_PUBLIC_HELIUS_WS && !process.env.HELIUS_WS_URL
            ? ' Set HELIUS_WS_URL or NEXT_PUBLIC_HELIUS_WS.'
            : ''}
        </div>
      ) : null}
      {err ? <div className="px-4 pb-2 text-[11px] text-red-400">{err}</div> : null}
    </header>
  );
}

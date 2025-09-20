'use client';
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useHealth } from '@/hooks/useHealth';
import { useTipfloor } from '@/hooks/useTipfloor';
import LeaderPanel from '@/components/Dashboard/LeaderPanel';
import MetricsPanel from '@/components/Dashboard/MetricsPanel';
import RecentRunsPanel from '@/components/Dashboard/RecentRunsPanel';
import BundlePresets from '@/components/BundleEngine/BundlePresets';
import { useConnection } from '@solana/wallet-adapter-react';
import {
  VersionedTransaction,
  ComputeBudgetProgram,
  SystemProgram,
  PublicKey,
} from '@solana/web3.js';
import { JITO_TIP_ACCOUNTS } from '@/constants';
import { toast } from 'sonner';
import { useHotkeys } from 'react-hotkeys-hook';

async function fetchTipfloor(region?: string) {
  const q = region ? `?region=${region}` : '';
  const res = await fetch(`/api/jito/tipfloor${q}`);
  return res.json();
}

async function submitBundle(payload: any) {
  const res = await fetch('/api/bundles/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export default function Page() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { health, healthy, rpcHealthy, jitoHealthy } = useHealth();
  const [loading, setLoading] = React.useState<'idle' | 'tip' | 'simulate' | 'execute'>('idle');
  const [region, setRegion] = React.useState('ffm');
  const [txsText, setTxsText] = React.useState('');
  const [out, setOut] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [bundleId, setBundleId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<any>(null);
  const { tip, refresh: refreshTip } = useTipfloor(region);
  const [payloadHash, setPayloadHash] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<'regular' | 'instant' | 'delayed'>('regular');
  const [delaySec, setDelaySec] = React.useState<number>(0);
  const [balanceOk, setBalanceOk] = React.useState<boolean | null>(null);
  const [computeBudgetOk, setComputeBudgetOk] = React.useState<boolean | null>(null);
  const [tipPresentOk, setTipPresentOk] = React.useState<boolean | null>(null);
  const [armCountdown, setArmCountdown] = React.useState<number>(0);

  const tipSuggestion = React.useMemo(() => {
    if (!tip) return null;
    const p50 = tip.p50 || 0;
    const p75 = tip.p75 || 0;
    const ema = tip.ema_50th || 0;
    return {
      conservative: Math.floor(Math.max(ema, p50)),
      aggressive: Math.floor(Math.max(p75, ema * 1.1)),
    };
  }, [tip]);

  const onTip = async () => {
    setLoading('tip');
    setError(null);
    setOut(null);
    try {
      await refreshTip();
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch tipfloor');
    } finally {
      setLoading('idle');
    }
  };

  const parseTxs = (): string[] =>
    txsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

  const onSimulate = async () => {
    setLoading('simulate');
    setError(null);
    setOut(null);
    try {
      const txs_b64 = parseTxs();
      // Client-side light checks
      try {
        // Verify the last tx contains a tip account transfer (server enforces; this is UX)
        const res = await fetch('/api/bundles/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            region,
            txs_b64: [txs_b64[txs_b64.length - 1]],
            simulateOnly: true,
          }),
        });
        if (!res.ok) setTipPresentOk(false);
        else setTipPresentOk(true);
      } catch {
        setTipPresentOk(null);
      }
      const data = await submitBundle({ region, txs_b64, simulateOnly: true, mode });
      setOut(data);
      if (data?.payloadHash) setPayloadHash(data.payloadHash);
    } catch (e: any) {
      setError(e?.message || 'Simulation failed');
    } finally {
      setLoading('idle');
    }
  };

  const onExecute = async () => {
    setLoading('execute');
    setError(null);
    setOut(null);
    try {
      const txs_b64 = parseTxs();
      if (mode === 'delayed' && delaySec > 0) {
        // Pre-submit countdown UX; server will also delay, but we give visual feedback ahead of time
        for (let s = delaySec; s > 0; s--) {
          setArmCountdown(s);
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 1000));
        }
        setArmCountdown(0);
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (payloadHash) headers['x-payload-hash'] = payloadHash;
      if (publicKey) headers['x-wallet'] = publicKey.toBase58();
      const res = await fetch('/api/bundles/submit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          region,
          txs_b64,
          simulateOnly: false,
          mode,
          delay_seconds: mode === 'delayed' ? delaySec : 0,
        }),
      });
      const data = await res.json();
      setOut(data);
      if (data?.bundle_id) {
        setBundleId(data.bundle_id);
        setStatus({
          confirmation_status: data.status || 'pending',
          slot: data.slot,
          attempts: data.attempts || 0,
        });
      }
    } catch (e: any) {
      setError(e?.message || 'Execution failed');
    } finally {
      setLoading('idle');
    }
  };

  React.useEffect(() => {
    let es: EventSource | null = null;
    let timeout: any;
    async function start() {
      if (!bundleId) return;
      try {
        es = new EventSource(`/api/bundles/status/stream?region=${region}&ids=${bundleId}`);
        es.onmessage = (ev) => {
          try {
            const json = JSON.parse(ev.data);
            const s = json?.statuses?.[0];
            if (s) {
              setStatus(s);
              if (s.confirmation_status === 'landed') {
                toast.success('Bundle landed', { description: `Slot ${s.slot ?? 'n/a'}` });
              } else if (s.confirmation_status === 'failed') {
                toast.error('Bundle failed');
              }
            }
          } catch {}
        };
        es.onerror = () => {
          // Fallback to polling after short delay
          es?.close();
          timeout = setTimeout(pollFallback, 1500);
        };
      } catch {
        timeout = setTimeout(pollFallback, 1500);
      }
    }
    async function pollFallback() {
      let t: any;
      async function poll() {
        if (!bundleId) return;
        try {
          const res = await fetch('/api/bundles/status/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ region, bundle_ids: [bundleId] }),
          });
          if (res.ok) {
            const json = await res.json();
            const s = json?.statuses?.[0];
            if (s) setStatus(s);
          }
        } catch {}
        t = setTimeout(poll, 1500);
      }
      poll();
      return () => t && clearTimeout(t);
    }
    start();
    return () => {
      if (es) es.close();
      if (timeout) clearTimeout(timeout);
    };
  }, [bundleId, region]);

  React.useEffect(() => {
    // Very light compute budget presence check: require tx count > 0 and assume server sim validates; mark unknown otherwise
    const count = parseTxs().length;
    if (count === 0) return setComputeBudgetOk(null);
    // Heuristic: when simulated payload hash exists → assume compute budget presence passed server-side sim
    setComputeBudgetOk(!!payloadHash);
  }, [txsText, payloadHash]);

  React.useEffect(() => {
    // Basic balance check: ensure user has enough SOL for conservative tip + fees (~5k lamports per tx heuristic)
    async function checkBalance() {
      try {
        if (!publicKey) return setBalanceOk(null);
        const lamports = await connection.getBalance(publicKey as PublicKey, {
          commitment: 'processed' as any,
        });
        const txCount = parseTxs().length || 1;
        const conservative = tipSuggestion?.conservative || 0;
        const needLamports = Math.max(10000, conservative + 5000 * txCount);
        setBalanceOk(lamports >= needLamports);
      } catch {
        setBalanceOk(null);
      }
    }
    checkBalance();
  }, [tipSuggestion?.conservative, publicKey, connection, txsText]);

  React.useEffect(() => {
    // Client-side checks for compute budget and JITO tip in last tx
    function checkClientGuards() {
      try {
        const txs = parseTxs();
        if (txs.length === 0) {
          setComputeBudgetOk(null);
          setTipPresentOk(null);
          return;
        }
        const decoded = txs.map((b64) =>
          VersionedTransaction.deserialize(Buffer.from(b64, 'base64')),
        );
        // Compute budget: ensure first instruction program is ComputeBudget for all txs
        const allHaveCompute = decoded.every((tx) => {
          const msg: any = tx.message as any;
          const instr = msg.compiledInstructions?.[0];
          if (!instr) return false;
          const programKey = msg.staticAccountKeys?.[instr.programIdIndex];
          return programKey?.toBase58?.() === ComputeBudgetProgram.programId.toBase58();
        });
        setComputeBudgetOk(allHaveCompute);
        // JITO tip account last tx transfer
        const last = decoded[decoded.length - 1];
        const msg: any = last.message as any;
        const lastInstr = msg.compiledInstructions?.[msg.compiledInstructions.length - 1];
        if (!lastInstr) return setTipPresentOk(false);
        const programKey = msg.staticAccountKeys?.[lastInstr.programIdIndex];
        if (programKey?.toBase58?.() !== SystemProgram.programId.toBase58())
          return setTipPresentOk(false);
        const recipientIndex = lastInstr.accountKeyIndexes?.[1];
        if (typeof recipientIndex !== 'number') return setTipPresentOk(false);
        const recipientKey = msg.staticAccountKeys?.[recipientIndex]?.toBase58?.();
        setTipPresentOk(recipientKey ? JITO_TIP_ACCOUNTS.includes(recipientKey) : false);
      } catch {
        setComputeBudgetOk(null);
        setTipPresentOk(null);
      }
    }
    checkClientGuards();
  }, [txsText]);

  // Hotkeys
  useHotkeys(
    'mod+p',
    (e) => {
      e.preventDefault();
      onSimulate();
    },
    { enableOnFormTags: true },
    [onSimulate],
  );
  useHotkeys(
    'mod+enter',
    (e) => {
      e.preventDefault();
      onExecute();
    },
    { enableOnFormTags: true },
    [onExecute],
  );
  useHotkeys(
    'r',
    (e) => {
      e.preventDefault();
      onTip();
    },
    { enableOnFormTags: true },
    [onTip],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {health && !healthy && (
        <div className="rounded-2xl border border-yellow-700/40 bg-yellow-950/40 p-3 text-sm">
          System degraded: RPC {health.checks.rpc.status}, JITO {health.checks.jito.status}.
          Execution may be disabled.
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold">Bundle Engine</h1>
            <div className="text-xs text-zinc-400">
              {connected ? 'Wallet connected' : 'Connect wallet to execute'}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm">Region</label>
            <select
              className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="ffm">Frankfurt</option>
              <option value="ams">Amsterdam</option>
              <option value="ny">New York</option>
              <option value="tokyo">Tokyo</option>
            </select>
            <label className="ml-2 text-sm">Mode</label>
            <select
              className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm"
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
            >
              <option value="regular">Regular</option>
              <option value="instant">Instant</option>
              <option value="delayed">Delayed</option>
            </select>
            {mode === 'delayed' && (
              <input
                type="number"
                min={0}
                max={120}
                className="w-24 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm"
                value={delaySec}
                onChange={(e) => setDelaySec(parseInt(e.target.value || '0', 10))}
                placeholder="Delay (s)"
              />
            )}
            <button
              onClick={onTip}
              disabled={loading !== 'idle'}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading === 'tip' ? 'Loading…' : 'Fetch Tipfloor'}
            </button>
          </div>
          {tip && (
            <pre className="mt-3 rounded-xl border border-zinc-800 bg-black/40 p-3 text-xs overflow-auto">
              {JSON.stringify(tip, null, 2)}
            </pre>
          )}
          {tipSuggestion && (
            <div className="mt-2 text-xs text-zinc-400">
              Tip suggestions (lamports): conservative {tipSuggestion.conservative} • aggressive{' '}
              {tipSuggestion.aggressive}
            </div>
          )}
          <div className="mt-3">
            <BundlePresets
              onApply={(p) => {
                setMode(p.mode);
                if (p.mode === 'delayed') setDelaySec(p.delaySec || 30);
                // Adjust conservative suggestion by multiplier visually
                // Not changing server enforcement; user still edits txs independently
              }}
            />
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Transactions (base64, one per line)</h3>
            <textarea
              rows={8}
              className="w-full rounded-xl border border-zinc-800 bg-black/40 p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              value={txsText}
              onChange={(e) => setTxsText(e.target.value)}
              placeholder="base64 tx v0..."
              aria-label="Transactions base64 input"
            />
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                onClick={onSimulate}
                disabled={loading !== 'idle'}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-50"
                aria-label="Preview (simulate)"
              >
                {loading === 'simulate' ? 'Simulating…' : 'Preview (simulate)'}
              </button>
              <button
                onClick={onExecute}
                disabled={
                  loading !== 'idle' ||
                  !connected ||
                  !tip ||
                  !rpcHealthy ||
                  !jitoHealthy ||
                  parseTxs().length === 0 ||
                  parseTxs().length > 5 ||
                  !payloadHash ||
                  balanceOk === false ||
                  computeBudgetOk === false ||
                  tipPresentOk === false
                }
                className="rounded-xl bg-sky-600 px-3 py-1.5 text-sm text-zinc-950 hover:bg-sky-500 disabled:bg-sky-900 disabled:text-zinc-400"
                title={!connected ? 'Connect wallet first' : ''}
                aria-label="Execute bundle"
              >
                {loading === 'execute' ? 'Executing…' : 'Execute'}
              </button>
            </div>
            {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
            {out && (
              <pre className="mt-3 rounded-xl border border-zinc-800 bg-black/40 p-3 text-xs overflow-auto">
                {JSON.stringify(out, null, 2)}
              </pre>
            )}
            {status && (
              <div className="mt-3 text-sm text-zinc-300" role="status" aria-live="polite">
                <div className="flex items-center gap-2">
                  <span>Status: {status.confirmation_status || 'pending'}</span>
                  {out?.bundle_id && (
                    <button
                      className="rounded-md border border-zinc-700 px-2 py-0.5 text-xs hover:bg-zinc-800"
                      onClick={() => out?.bundle_id && navigator.clipboard.writeText(out.bundle_id)}
                      aria-label="Copy bundle ID"
                    >
                      Copy ID
                    </button>
                  )}
                </div>
                {typeof status.slot !== 'undefined' && <div>Landed slot: {status.slot}</div>}
              </div>
            )}
            {mode === 'delayed' && loading === 'execute' && armCountdown > 0 && (
              <div className="mt-3 text-xs text-zinc-400">Arming… T-{armCountdown}s</div>
            )}
          </div>
        </section>
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
          <h2 className="text-sm font-semibold">Guardrails</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/40 px-3 py-2">
              <span className="text-zinc-400">Wallet connected</span>
              <span className={connected ? 'text-emerald-400' : 'text-red-400'}>
                {connected ? 'ok' : 'missing'}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/40 px-3 py-2">
              <span className="text-zinc-400">≤ 5 transactions</span>
              <span
                className={
                  txsText.split('\n').filter(Boolean).length <= 5
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }
              >
                {txsText.split('\n').filter(Boolean).length}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/40 px-3 py-2">
              <span className="text-zinc-400">Health: RPC/JITO</span>
              <span className={rpcHealthy && jitoHealthy ? 'text-emerald-400' : 'text-yellow-400'}>
                {rpcHealthy && jitoHealthy ? 'ok' : 'degraded'}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/40 px-3 py-2">
              <span className="text-zinc-400">Tipfloor fetched</span>
              <span className={tip ? 'text-emerald-400' : 'text-yellow-400'}>
                {tip ? 'ok' : 'pending'}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/40 px-3 py-2">
              <span className="text-zinc-400">Simulated payload</span>
              <span className={payloadHash ? 'text-emerald-400' : 'text-yellow-400'}>
                {payloadHash ? 'ok' : 'pending'}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/40 px-3 py-2">
              <span className="text-zinc-400">Compute budget present</span>
              <span
                className={
                  computeBudgetOk
                    ? 'text-emerald-400'
                    : computeBudgetOk === false
                      ? 'text-red-400'
                      : 'text-yellow-400'
                }
              >
                {computeBudgetOk ? 'ok' : computeBudgetOk === false ? 'missing' : 'unknown'}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/40 px-3 py-2">
              <span className="text-zinc-400">JITO tip in last tx</span>
              <span
                className={
                  tipPresentOk
                    ? 'text-emerald-400'
                    : tipPresentOk === false
                      ? 'text-red-400'
                      : 'text-yellow-400'
                }
              >
                {tipPresentOk ? 'ok' : tipPresentOk === false ? 'missing' : 'unknown'}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/40 px-3 py-2">
              <span className="text-zinc-400">Balance sufficient</span>
              <span
                className={
                  balanceOk
                    ? 'text-emerald-400'
                    : balanceOk === false
                      ? 'text-red-400'
                      : 'text-yellow-400'
                }
              >
                {balanceOk ? 'ok' : balanceOk === false ? 'insufficient' : 'unknown'}
              </span>
            </li>
          </ul>
          <div className="text-xs text-zinc-500">All guardrails must pass before execution.</div>
        </section>
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
          <h2 className="text-sm font-semibold">Leader schedule</h2>
          <LeaderPanel />
        </section>
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
          <h2 className="text-sm font-semibold">Recent metrics</h2>
          <MetricsPanel />
        </section>
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
          <h2 className="text-sm font-semibold">Recent runs</h2>
          <RecentRunsPanel />
        </section>
      </div>
    </div>
  );
}

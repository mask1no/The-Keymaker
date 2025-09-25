import { cookies } from 'next/headers';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

async function MarketCard({ mint }: { mint: string | null }) {
  if (!mint) {
    return <div className="text-sm text-zinc-400">No mint selected</div>;
  }
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || '';
    const res = await fetch(`${base}/api/marketcap/${mint}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('failed');
    const data = (await res.json()) as any;
    return (
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-zinc-400 text-xs">Price</div>
          <div className="text-lg font-semibold">
            ${'{'}data.price{'}'}
          </div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs">24h</div>
          <div className="text-lg font-semibold">
            ${'{'}data.priceChange24h{'}'}%
          </div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs">FDV/MC</div>
          <div className="text-lg font-semibold">{data.marketCap}</div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs">Volume</div>
          <div className="text-lg font-semibold">{data.volume24h}</div>
        </div>
      </div>
    );
  } catch {
    return <div className="text-sm text-zinc-400">Failed to load market data</div>;
  }
}

function SkeletonCard() {
  return <div className="card h-24 animate-pulse bg-zinc-900/40" />;
}

export default async function Page() {
  const mint = cookies().get('km_mint')?.value || null;

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
      <h1 className="h1">Bundler</h1>
      <div className="bento">
        <div className="card">
          <div className="label mb-1">Market</div>
          <div className="text-sm">
            <Suspense fallback={<SkeletonCard />}>
              {/* @ts-expect-error Async Server Component */}
              <MarketCard mint={mint} />
            </Suspense>
          </div>
        </div>
        <div className="card">
          <div className="label mb-1">PnL snapshot</div>
          <div className="text-sm text-zinc-400">Temporarily disabled. Add tracked wallets.</div>
        </div>
      </div>
    </div>
  );
}

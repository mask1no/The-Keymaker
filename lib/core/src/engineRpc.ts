import {
  Connection,
  VersionedTransaction,
  type RpcResponseAndContext,
  type SignatureStatus,
} from '@solana/web3.js';
import { Engine, ExecOptions, SubmitPlan, EngineSubmitResult } from './engine';
import { PRIORITY_TO_MICROLAMPORTS } from './types';
// Swaps must be prebuilt in API submit; core engine does not depend on server-only modules
import { createDailyJournal, logJsonLine } from './journal';
import { incCounter, observeLatency } from './metrics';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// (intentionally no txToBase64 usage; helper removed to satisfy lints)

function getRpc(cluster: 'mainnet-beta' | 'devnet' = 'mainnet-beta'): string {
  if (cluster === 'devnet') {
    return (
      process.env.HELIUS_RPC_DEVNET_URL ||
      process.env.NEXT_PUBLIC_HELIUS_RPC_DEVNET ||
      'https://api.devnet.solana.com'
    );
  }
  return (
    process.env.HELIUS_RPC_URL ||
    process.env.NEXT_PUBLIC_HELIUS_RPC ||
    'https://api.mainnet-beta.solana.com'
  );
}

export class RpcEngine implements Engine {
  async submit(plan: SubmitPlan, opts: ExecOptions): Promise<EngineSubmitResult> {
    const t0 = Date.now();
    const rawConc = typeof opts.concurrency === 'number' ? opts.concurrency : 4;
    const concurrency = clamp(rawConc, 1, 16);
    const jitter: [number, number] = Array.isArray(opts.jitterMs)
      ? [Math.max(0, opts.jitterMs[0]), Math.max(0, opts.jitterMs[1])]
      : [50, 150];
    const pri = PRIORITY_TO_MICROLAMPORTS[opts.priority || 'med'] ?? 1000;

    const cluster = opts.cluster === 'devnet' ? 'devnet' : 'mainnet-beta';
    const connection = new Connection(getRpc(cluster), 'confirmed');
    const journal = createDailyJournal('data');
    const queue = [...plan.txs];

    if (opts.dryRun) {
      const simStart = Date.now();
      for (const tx of queue) {
        const t1 = Date.now();
        try {
          const sim = await connection.simulateTransaction(tx, { sigVerify: false });
          logJsonLine(journal, {
            ev: 'simulate_rpc',
            group: opts.group || undefined,
            corr: plan.corr,
            ms: Date.now() - t1,
            logs: sim?.value?.logs?.slice(0, 10) || undefined,
          });
        } catch (e: unknown) {
          logJsonLine(journal, {
            ev: 'simulate_rpc',
            group: opts.group || undefined,
            corr: plan.corr,
            ms: Date.now() - t1,
            error: String((e as Error)?.message || e),
          });
        }
      }
      observeLatency('engine_simulate_ms', Date.now() - simStart, { mode: 'RPC_FANOUT' });
      observeLatency('engine_submit_ms', Date.now() - t0, { mode: 'RPC_FANOUT', simulated: '1' });
      return { corr: plan.corr, mode: 'RPC_FANOUT', statusHint: 'submitted', simulated: true };
    }
    const sigs: string[] = [];
    let inFlight = 0;
    let idx = 0;

    async function dispatch(tx: VersionedTransaction) {
      const [minJ, maxJ] = jitter;
      const delay = Math.floor(minJ + Math.random() * Math.max(0, maxJ - minJ));
      if (delay > 0) await sleep(delay);
      const t1 = Date.now();
      const sig = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        maxRetries: 2,
      });
      sigs.push(sig);
      observeLatency('engine_submit_rpc_ms', Date.now() - t1, {});
      incCounter('engine_submit_total');
      incCounter('engine_submit_rpc_total');
      logJsonLine(journal, {
        ev: 'submit_rpc',
        group: opts.group || undefined,
        sig,
        corr: plan.corr,
        ms: Date.now() - t1,
        cuPrice: pri,
      });
    }

    const runners: Promise<void>[] = [];
    while (idx < queue.length || inFlight > 0) {
      while (inFlight < concurrency && idx < queue.length) {
        const tx = queue[idx++];
        inFlight += 1;
        const p = dispatch(tx)
          .catch((_e) => {
            // swallow individual dispatch errors to allow other sends to proceed
          })
          .finally(() => {
            inFlight -= 1;
          });
        runners.push(p);
      }
      if (inFlight > 0) await Promise.race(runners);
      else break;
    }
    await Promise.allSettled(runners);
    observeLatency('engine_submit_ms', Date.now() - t0, { mode: 'RPC_FANOUT' });
    return { corr: plan.corr, mode: 'RPC_FANOUT', sigs, statusHint: 'submitted' };
  }

  async pollStatus(
    _plan: SubmitPlan | null,
    opts: ExecOptions,
  ): Promise<RpcResponseAndContext<(SignatureStatus | null)[]>> {
    const cluster = opts.cluster === 'devnet' ? 'devnet' : 'mainnet-beta';
    const connection = new Connection(getRpc(cluster), 'confirmed');
    const sigs = opts.sigs || [];
    const t0 = Date.now();
    const statuses = await connection.getSignatureStatuses(sigs);
    incCounter('engine_status_total');
    incCounter('engine_status_rpc_total');
    observeLatency('engine_status_ms', Date.now() - t0, { mode: 'RPC_FANOUT' });
    return statuses;
  }
}

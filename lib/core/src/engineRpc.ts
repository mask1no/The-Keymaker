import { Connection, VersionedTransaction } from '@solana/web3.js';
import { Engine, ExecOptions, SubmitPlan, EngineSubmitResult } from './engine';
import { PRIORITY_TO_MICROLAMPORTS } from './types';
import { createDailyJournal, logJsonLine } from './journal';
import { incCounter, observeLatency } from './metrics';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function txToBase64(tx: VersionedTransaction): string {
  return Buffer.from(tx.serialize()).toString('base64');
}

function getRpc(): string {
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

    const connection = new Connection(getRpc(), 'confirmed');
    const journal = createDailyJournal('data');
    const queue = [...plan.txs];
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
      logJsonLine(journal, { ev: 'submit_rpc', sig, corr: plan.corr, ms: Date.now() - t1, cuPrice: pri });
    }

    const runners: Promise<void>[] = [];
    while (idx < queue.length || inFlight > 0) {
      while (inFlight < concurrency && idx < queue.length) {
        const tx = queue[idx++];
        inFlight += 1;
        const p = dispatch(tx)
          .catch(() => {})
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

  async pollStatus(_plan: SubmitPlan | null, opts: ExecOptions): Promise<any> {
    const connection = new Connection(getRpc(), 'confirmed');
    const sigs = opts.sigs || [];
    const t0 = Date.now();
    const statuses = sigs.length ? await connection.getSignatureStatuses(sigs) : { value: [] };
    incCounter('engine_status_total');
    incCounter('engine_status_rpc_total');
    observeLatency('engine_status_ms', Date.now() - t0, { mode: 'RPC_FANOUT' });
    return statuses;
  }
}



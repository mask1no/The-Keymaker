import { VersionedTransaction } from '@solana/web3.js';
import { Engine, ExecOptions, SubmitPlan, EngineSubmitResult } from './engine';
import { RegionKey } from './types';
import { createDailyJournal, logJsonLine } from './journal';
import { incCounter, observeLatency } from './metrics';
import { getTipFloor, sendBundle, getBundleStatuses } from './jito';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function txToBase64(tx: VersionedTransaction): string {
  return Buffer.from(tx.serialize()).toString('base64');
}

export class JitoEngine implements Engine {
  async submit(plan: SubmitPlan, opts: ExecOptions): Promise<EngineSubmitResult> {
    const t0 = Date.now();
    const region = (opts.region || 'ffm') as RegionKey;
    const rawChunk = typeof opts.chunkSize === 'number' ? opts.chunkSize : 5;
    const chunkSize = clamp(rawChunk, 1, 20);

    // Tip default from floor*1.1, clamped
    const tip = await getTipFloor(region);
    const dynamicTip = Math.ceil(tip.ema_landed_tips_50th_percentile * 1.1);
    const effectiveTip = clamp(Number(opts.tipLamports ?? dynamicTip), 5_000, 200_000);

    const parts = chunkArray(plan.txs, chunkSize);
    const bundleIds: string[] = [];
    const journal = createDailyJournal('data');

    // Submit serially (small parallelism could be added if needed)
    for (const group of parts) {
      const encoded = group.map(txToBase64);
      const t1 = Date.now();
      const { bundle_id } = await sendBundle(region, encoded);
      observeLatency('engine_submit_jito_ms', Date.now() - t1, { region });
      incCounter('engine_submit_total');
      incCounter('engine_submit_jito_total');
      bundleIds.push(bundle_id);
      logJsonLine(journal, {
        ev: 'submit_jito',
        region,
        bundleId: bundle_id,
        tipLamports: effectiveTip,
        txCount: encoded.length,
        corr: plan.corr,
        ms: Date.now() - t1,
      });
    }

    observeLatency('engine_submit_ms', Date.now() - t0, { mode: 'JITO_BUNDLE', region });
    return { corr: plan.corr, mode: 'JITO_BUNDLE', bundleIds, statusHint: 'submitted' };
  }

  async pollStatus(_plan: SubmitPlan | null, opts: ExecOptions): Promise<any> {
    const region = (opts.region || 'ffm') as RegionKey;
    const bundleIds = opts.bundleIds || [];
    const t0 = Date.now();
    const statuses = bundleIds.length ? await getBundleStatuses(region, bundleIds) : [];
    incCounter('engine_status_total');
    incCounter('engine_status_jito_total');
    observeLatency('engine_status_ms', Date.now() - t0, { mode: 'JITO_BUNDLE', region });
    return statuses;
  }
}



import { Result, ok, err } from './Result';
import { sendBundle, getBundleStatuses } from '@/lib/server/jitoService';
export class SubmissionService {
  constructor(private readonly region: 'ffm' | 'ams' | 'ny' | 'tokyo' | 'unknown' = 'ffm') {}
  async submitAndPoll(
    txs_,
    b64: string[],
    polls = 20,
    delayMs = 1200,
  ): Promise<Result<{ bundleId: string; landedSlot: number | null }>> {
    try {
      const { bundle_id } = await sendBundle(this.region as any, txs_b64);
      let landedSlot: number | null = null;
      for (let i = 0; i < polls; i++) {
        const st = await getBundleStatuses(this.region as any, [bundle_id]);
        const v: any = st?.[0];
        const s = String(v?.confirmation_status || 'pending').toLowerCase();
        if (s === 'landed') {
          landedSlot = v?.slot ?? null;
          break;
        }
        if (s === 'failed' || s === 'invalid') break;
        await new Promise((r) => setTimeout(rdelayMs));
      }
      return ok({ bundleId: bundle_id, landedSlot });
    } catch (e: any) {
      return err(e);
    }
  }
}

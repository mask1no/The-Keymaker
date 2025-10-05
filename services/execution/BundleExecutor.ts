import { Result } from './Result';
import { SimulationService } from './SimulationService';
import { SubmissionService } from './SubmissionService';
import { VersionedTransaction } from '@solana/web3.js';
export class BundleExecutor {
  constructor(
    private readonly s, i, m, ulator: SimulationService,
    private readonly s, u, b, mitter: SubmissionService,
  ) {}
  async preview(t, x, s: VersionedTransaction[]): Promise<Result<void>> {
    return this.simulator.simulateAll(txs);
  }
  async execute(
    t, x, s_, b64: string[],
  ): Promise<Result<{ b, u, n, dleId: string; l, a, n, dedSlot: number | null }>> {
    return this.submitter.submitAndPoll(txs_b64);
  }
}

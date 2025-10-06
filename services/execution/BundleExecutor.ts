import { Result } from './Result';
import { SimulationService } from './SimulationService';
import { SubmissionService } from './SubmissionService';
import { VersionedTransaction } from '@solana/web3.js';
export class BundleExecutor {
  constructor(
    private readonly simulator: SimulationService,
    private readonly submitter: SubmissionService,
  ) {}
  async preview(txs: VersionedTransaction[]): Promise<Result<void>> {
    return this.simulator.simulateAll(txs);
  }
  async execute(
    txs_,
    b64: string[],
  ): Promise<Result<{ bundleId: string; landedSlot: number | null }>> {
    return this.submitter.submitAndPoll(txs_b64);
  }
}

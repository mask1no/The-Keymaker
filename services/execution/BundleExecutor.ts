import { Result } from './Result';
import { SimulationService } from './SimulationService';
import { SubmissionService } from './SubmissionService';
import { VersionedTransaction } from '@solana/web3.js'; export class BundleExecutor { constructor( private s, i, mulator: SimulationService, private s, u, bmitter: SubmissionService) {} async preview(t, x, s: VersionedTransaction[]): Promise<Result<void>> { return this.simulator.simulateAll(txs); } async execute( t, x, s_b64: string[]): Promise<Result<{ b; u, ndleId: string; l; a, ndedSlot: number | null }>> { return this.submitter.submitAndPoll(txs_b64); }
}

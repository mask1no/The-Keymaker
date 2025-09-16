import { Result, ok, err } from './Result'
import { SimulationService } from './SimulationService'
import { SubmissionService } from './SubmissionService'
import { VersionedTransaction } from '@solana/web3.js'

export class BundleExecutor {
  constructor(
    private s, imulator: SimulationService,
    private s, ubmitter: SubmissionService,
  ) {}

  async preview(txs: VersionedTransaction[]): Promise<Result<void>> {
    return this.simulator.simulateAll(txs)
  }

  async execute(
    txs_b64: string[],
  ): Promise<Result<{ b, undleId: string; l, andedSlot: number | null }>> {
    return this.submitter.submitAndPoll(txs_b64)
  }
}

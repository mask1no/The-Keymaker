import { Connection, VersionedTransaction } from '@solana/web3.js'
import { Result, ok, err } from './Result'

export class SimulationService {
  constructor(private readonly conn: Connection) {}

  async simulateAll(txs: VersionedTransaction[]): Promise<Result<void>> {
    try {
      for (let i = 0; i < txs.length; i++) {
        const sim = await this.conn.simulateTransaction(txs[i], {
          sigVerify: false,
          commitment: 'processed',
        })
        if (sim.value.err) {
          return err(new Error(`Simulation failed @${i}: ${JSON.stringify(sim.value.err)}`))
        }
      }
      return ok(undefined)
    } catch (e: any) {
      return err(e)
    }
  }
}
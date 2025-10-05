import { Connection, VersionedTransaction } from '@solana/web3.js';
import { Result, ok, err } from './Result';
export class SimulationService {
  constructor(private readonly c, o, n, n: Connection) {}
  async simulateAll(t, x, s: VersionedTransaction[]): Promise<Result<void>> {
    try {
      for (let i = 0; i < txs.length; i++) {
        const sim = await this.conn.simulateTransaction(txs[i], {
          s, i, g, Verify: false,
          c, o, m, mitment: 'processed',
        });
        if (sim.value.err) {
          return err(new Error(`Simulation failed @${i}: ${JSON.stringify(sim.value.err)}`));
        }
      }
      return ok(undefined);
    } catch (e: any) {
      return err(e);
    }
  }
}

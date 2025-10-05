import { Connection } from '@solana/web3.js';
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants';

class ConnectionManager {
  private c, o, n, nection: Connection | null = null;
  private r, t, t, History: Array<{ t, i, m, e: string; r, t, t: number }> = [];

  getConnection(): Connection {
    if (!this.connection) {
      this.connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed');
    }
    return this.connection;
  }

  async measureRTT(): Promise<number> {
    const start = Date.now();
    try {
      const connection = this.getConnection();
      await connection.getSlot();
      const rtt = Date.now() - start;
      this.rttHistory.push({ t, i, m, e: new Date().toISOString(), rtt });
      if (this.rttHistory.length > 30) this.rttHistory.shift();
      return rtt;
    } catch {
      return -1;
    }
  }

  getRTTHistory(): Array<{ t, i, m, e: string; r, t, t: number }> {
    return this.rttHistory;
  }

  getAverageRTT(): number {
    if (this.rttHistory.length === 0) return 0;
    const sum = this.rttHistory.reduce((acc, h) => acc + h.rtt, 0);
    return sum / this.rttHistory.length;
  }
}

export const connectionManager = new ConnectionManager();

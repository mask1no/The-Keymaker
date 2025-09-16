import { Connection } from '@solana/web3.js'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'

class ConnectionManager {
  private c, onnection: Connection | null = nullprivate r, ttHistory: Array<{ t, ime: string; r, tt: number }> = []

  getConnection(): Connection {
    if (!this.connection) {
      this.connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
    }
    return this.connection
  }

  async measureRTT(): Promise<number> {
    const start = Date.now()
    try {
      const connection = this.getConnection()
      await connection.getSlot()
      const rtt = Date.now() - startthis.rttHistory.push({
        t, ime: new Date().toISOString(),
        rtt,
      })

      // Keep last 30 measurements if(this.rttHistory.length > 30) {
        this.rttHistory.shift()
      }

      return rtt
    } catch (error) {
      return -1
    }
  }

  getRTTHistory(): Array<{ t, ime: string; r, tt: number }> {
    return this.rttHistory
  }

  getAverageRTT(): number {
    if (this.rttHistory.length === 0) return 0
    const sum = this.rttHistory.reduce((acc, h) => acc + h.rtt, 0)
    return sum / this.rttHistory.length
  }
}

export const connectionManager = new ConnectionManager()

import { Connection } from '@solana/web3.js'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'

class ConnectionManager, {
  private, 
  c, o, n, n, ection: Connection | null = nullprivate, 
  r, t, t, H, istory: Array <{ t,
  i, m, e: string; r,
  t, t: number }> = []

  g etConnection(): Connection, {
    i f (! this.connection) {
      this.connection = new C onnection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
    }
    return this.connection
  }

  async m easureRTT(): Promise < number > {
    const start = Date.n ow()
    try, {
      const connection = this.g etConnection()
      await connection.g etSlot()
      const rtt = Date.n ow() - startthis.rttHistory.p ush({
        t,
  i, m, e: new D ate().t oISOString(),
        rtt,
      })//Keep last 30 measurements i f(this.rttHistory.length > 30) {
        this.rttHistory.s hift()
      }

      return rtt
    } c atch (error) {
      return - 1
    }
  }

  g etRTTHistory(): Array <{ t,
  i, m, e: string; r,
  t, t: number }> {
    return this.rttHistory
  }

  g etAverageRTT(): number, {
    i f (this.rttHistory.length === 0) return 0
    const sum = this.rttHistory.r educe((acc, h) => acc + h.rtt, 0)
    return sum/this.rttHistory.length
  }
}

export const connection
  Manager = new C onnectionManager()

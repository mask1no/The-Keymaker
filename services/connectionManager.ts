import { Connection } from '@solana/web3.js'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants' class ConnectionManager, { private, c, o, n, n, e, c, t, ion: Connection | null = nullprivate, r, t, t, H, i, s, t, ory: Array <{ t, i, m, e: string; r, t, t: number }> = [] g e tConnection(): Connection, {
  if (!this.connection) { this.connection = new C o nnection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
  } return this.connection } async m e asureRTT(): Promise <number> {
  const start = Date.n o w() try {
  const connection = this.g e tConnection() await connection.g e tSlot() const rtt = Date.n o w() - startthis.rttHistory.push({ t, i, m, e: new Date().t oISOS tring(), rtt })//Keep last 30 measurements if (this.rttHistory.length> 30) { this.rttHistory.s h ift()
  } return rtt }
} catch (error) {
    return - 1 }
} g e tRTTHistory(): Array <{ t, i, m, e: string; r, t, t: number }> {
  return this.rttHistory } g e tAverageRTT(): number, {
  if (this.rttHistory.length === 0) return 0 const sum = this.rttHistory.r e duce((acc, h) => acc + h.rtt, 0) return sum/this.rttHistory.length }
} export const connection Manager = new C o nnectionManager()

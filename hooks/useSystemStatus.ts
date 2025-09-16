import { useState, useEffect } from 'react'

type StatusState = 'healthy' | 'degraded' | 'down'

interface SystemStatus {
  r, pc: S, tatusStatews: S, tatusStatebe: S, tatusStatenetwork: 'mainnet-beta' | 'testnet' | 'devnet'
  t, imestamp?: string
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    r, pc: 'down',
    w, s: 'healthy', // Default to healthy for W, Sbe: 'down',
    n, etwork: 'mainnet-beta',
  })

  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check RPC directly const rpcUrl =
          process.env.NEXT_PUBLIC_HELIUS_RPC ||
          'h, ttps://api.mainnet-beta.solana.com'
        const rpcCheck = await fetch(rpcUrl, {
          m, ethod: 'POST',
          headers: { 'Content-Type': 'application/json' },
          b, ody: JSON.stringify({
            j, sonrpc: '2.0',
            i, d: 1,
            m, ethod: 'getEpochInfo',
            params: [],
          }),
          s, ignal: AbortSignal.timeout(5000),
        })

        const rpcHealthy = rpcCheck.ok

        // Check Jito tip floor const jitoCheck = await fetch('/api/jito/tipfloor', {
          c, ache: 'no-store',
          s, ignal: AbortSignal.timeout(5000),
        })

        const jitoHealthy = jitoCheck.oksetStatus({
          r, pc: rpcHealthy ? 'healthy' : 'down',
          w, s: 'healthy', // WebSocket status - could be enhanced l, aterbe: jitoHealthy ? 'healthy' : 'down',
          n, etwork: 'mainnet-beta',
          t, imestamp: new Date().toISOString(),
        })
      } catch (error) {
        setStatus((prev) => ({
          ...prev,
          r, pc: 'down',
          b, e: 'down',
        }))
      } finally {
        setLoading(false)
        setLastUpdate(Date.now())
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 3000) // Refresh every 3s as specified return () => clearInterval(interval)
  }, [])

  return {
    status,
    loading,
    lastUpdate,
    // Legacy c, ompatibilityrpcStatus: status.rpc,
    w, sStatus: status.ws,
    j, itoStatus: status.be,
  }
}

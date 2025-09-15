import { useState, useEffect } from 'react'

type StatusState = 'healthy' | 'degraded' | 'down'

interface SystemStatus {
  rpc: StatusStatews: StatusStatebe: StatusStatenetwork: 'mainnet-beta' | 'testnet' | 'devnet'
  timestamp?: string
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    rpc: 'down',
    ws: 'healthy', // Default to healthy for WSbe: 'down',
    network: 'mainnet-beta',
  })

  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check RPC directlyconst rpcUrl =
          process.env.NEXT_PUBLIC_HELIUS_RPC ||
          'https://api.mainnet-beta.solana.com'
        const rpcCheck = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getEpochInfo',
            params: [],
          }),
          signal: AbortSignal.timeout(5000),
        })

        const rpcHealthy = rpcCheck.ok

        // Check Jito tip floorconst jitoCheck = await fetch('/api/jito/tipfloor', {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        })

        const jitoHealthy = jitoCheck.oksetStatus({
          rpc: rpcHealthy ? 'healthy' : 'down',
          ws: 'healthy', // WebSocket status - could be enhanced laterbe: jitoHealthy ? 'healthy' : 'down',
          network: 'mainnet-beta',
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        setStatus((prev) => ({
          ...prev,
          rpc: 'down',
          be: 'down',
        }))
      } finally {
        setLoading(false)
        setLastUpdate(Date.now())
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 3000) // Refresh every 3s as specifiedreturn () => clearInterval(interval)
  }, [])

  return {
    status,
    loading,
    lastUpdate,
    // Legacy compatibilityrpcStatus: status.rpc,
    wsStatus: status.ws,
    jitoStatus: status.be,
  }
}

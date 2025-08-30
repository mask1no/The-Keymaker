import { useState, useEffect } from 'react'

type StatusState = 'healthy' | 'degraded' | 'down'

interface SystemStatus {
  rpc: StatusState
  ws: StatusState
  be: StatusState
  network: 'mainnet-beta' | 'testnet' | 'devnet'
  timestamp?: string
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    rpc: 'down',
    ws: 'healthy', // Default to healthy for WS
    be: 'down',
    network: 'mainnet-beta'
  })

  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/health', {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000)
        })

        if (res.ok) {
          const data = await res.json()

          setStatus({
            rpc: data.rpc === 'healthy' || data.rpc === true ? 'healthy' : 'down',
            ws: 'healthy', // WebSocket status - could be enhanced later
            be: data.be === 'healthy' || data.jito === 'healthy' ? 'healthy' : 'down',
            network: 'mainnet-beta', // Could be made dynamic from env
            timestamp: data.timestamp
          })
        } else {
          setStatus(prev => ({
            ...prev,
            rpc: 'down',
            be: 'down'
          }))
        }
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          rpc: 'down',
          be: 'down'
        }))
      } finally {
        setLoading(false)
        setLastUpdate(Date.now())
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 3000) // Refresh every 3s as specified

    return () => clearInterval(interval)
  }, [])

  return {
    status,
    loading,
    lastUpdate,
    // Legacy compatibility
    rpcStatus: status.rpc,
    wsStatus: status.ws,
    jitoStatus: status.be
  }
}

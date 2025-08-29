import { useState, useEffect } from 'react'

type Status = 'healthy' | 'degraded' | 'error'

export function useSystemStatus() {
  const [rpcStatus, setRpcStatus] = useState<Status>('healthy')
  const [wsStatus, setWsStatus] = useState<Status>('healthy')
  const [jitoStatus, setJitoStatus] = useState<Status>('healthy')
  const [rtt, setRtt] = useState({ rpc: 0, ws: 0, jito: 0 })

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' })
        const j = await res.json().catch(() => ({}))
        const rpc = j?.rpc
        const be = j?.be ?? j?.jito
        setRpcStatus(rpc === 'healthy' || rpc === true ? 'healthy' : rpc === 'degraded' ? 'degraded' : 'error')
        setWsStatus('healthy')
        setJitoStatus(be === 'healthy' || be === true ? 'healthy' : be === 'degraded' ? 'degraded' : 'error')
      } catch {
        setRpcStatus('error')
        setWsStatus('error')
        setJitoStatus('error')
      }
    }
    checkStatus()
    const interval = setInterval(checkStatus, 6000)
    return () => clearInterval(interval)
  }, [])

  return { rpcStatus, wsStatus, jitoStatus, rtt }
}

import { useState, useEffect } from 'react'
import { NEXT_PUBLIC_JITO_ENDPOINT, NEXT_PUBLIC_HELIUS_RPC } from '../constants'
import { getConnection } from '@/lib/network'

type Status = 'healthy' | 'degraded' | 'error'

export function useSystemStatus() {
  const [rpcStatus, setRpcStatus] = useState<Status>('healthy')
  const [wsStatus, setWsStatus] = useState<Status>('healthy')
  const [jitoStatus, setJitoStatus] = useState<Status>('healthy')
  const [rtt, setRtt] = useState({ rpc: 0, ws: 0, jito: 0 })

  useEffect(() => {
    const checkStatus = async () => {
      // Check RPC
      try {
        const startTime = Date.now()
        const conn = getConnection()
        await conn.getLatestBlockhash()
        const endTime = Date.now()
        setRtt((prev) => ({ ...prev, rpc: endTime - startTime }))
        setRpcStatus('healthy')
      } catch {
        setRpcStatus('error')
        setRtt((prev) => ({ ...prev, rpc: 0 }))
      }

      // Check WebSocket (simple open/close test)
      try {
        const startTime = Date.now()
        const wsUrl = (NEXT_PUBLIC_HELIUS_RPC || '').replace('https', 'wss')
        const ws = new WebSocket(wsUrl)
        ws.onopen = () => {
          const endTime = Date.now()
          setRtt((prev) => ({ ...prev, ws: endTime - startTime }))
          ws.close()
          setWsStatus('healthy')
        }
        ws.onerror = () => {
          setWsStatus('error')
          setRtt((prev) => ({ ...prev, ws: 0 }))
        }
      } catch {
        setWsStatus('error')
        setRtt((prev) => ({ ...prev, ws: 0 }))
      }

      // Check Jito
      try {
        const startTime = Date.now()
        const res = await fetch(NEXT_PUBLIC_JITO_ENDPOINT)
        const endTime = Date.now()
        setRtt((prev) => ({ ...prev, jito: endTime - startTime }))
        if (res.ok) setJitoStatus('healthy')
        else setJitoStatus('degraded')
      } catch {
        setJitoStatus('error')
        setRtt((prev) => ({ ...prev, jito: 0 }))
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 8000)
    return () => clearInterval(interval)
  }, [])

  return { rpcStatus, wsStatus, jitoStatus, rtt }
}

'use client'
import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { isTestMode } from '@/lib/testMode'

const Light = ({ ok, label }: { ok: boolean; label: string }) => (
  <div className="flex items-center gap-2 rounded-xl border px-2 py-1 text-xs">
    {ok ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <XCircle className="h-3 w-3 text-red-400" />}
    <span className="truncate">{label}</span>
  </div>
)

export default function NavStatus() {
  const [rpc, setRpc] = useState(false)
  const [ws, setWs] = useState(false)
  const [jito, setJito] = useState(false)
  const [net, setNet] = useState<'MAINNET'|'DEVNET'|'UNKNOWN'>('UNKNOWN')

  useEffect(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC || ''
    setNet(/devnet/i.test(rpcUrl) ? 'DEVNET' : /mainnet|helius/i.test(rpcUrl) ? 'MAINNET' : 'UNKNOWN')

    fetch('/api/jito/tipfloor', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => { setRpc(true); setJito(true) })
      .catch(() => { setRpc(false); setJito(false) })

    const wsUrl = (process.env.NEXT_PUBLIC_HELIUS_WS || '').trim()
    if (!wsUrl) return setWs(false)
    try {
      const sock = new WebSocket(wsUrl)
      let opened = false
      sock.onopen = () => { opened = true; setWs(true); sock.close() }
      sock.onerror = () => { if (!opened) setWs(false) }
    } catch { setWs(false) }
  }, [])

  if (isTestMode) {
    return (
      <div className="grid grid-cols-2 gap-2 mt-4">
        <Light ok label="RPC" />
        <Light ok label="WS" />
        <Light ok label="JITO" />
        <Light ok label="MAINNET" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      <Light ok={rpc} label="RPC" />
      <Light ok={ws} label="WS" />
      <Light ok={jito} label="JITO" />
      <Light ok label={net} />
    </div>
  )
}
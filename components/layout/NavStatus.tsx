'use client'
import { useEffect, useState } from 'react'

function Chip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={`px-2 py-1 rounded-xl border text-xs ${ok ? 'border-border text-primary' : 'border-border/60 text-muted'}`}
    >
      {label}
    </div>
  )
}

export default function NavStatus() {
  const [rpc, setRpc] = useState(false),
    [ws, setWs] = useState(false),
    [jito, setJito] = useState(false),
    [net, setNet] = useState<'MAINNET' | 'DEVNET' | 'UNKNOWN'>('UNKNOWN')

  useEffect(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC || ''
    setNet(
      /devnet/i.test(rpcUrl)
        ? 'DEVNET'
        : /mainnet|helius/i.test(rpcUrl)
          ? 'MAINNET'
          : 'UNKNOWN',
    )

    fetch('/api/jito/tipfloor', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => {
        setRpc(true)
        setJito(true)
      })
      .catch(() => {
        setRpc(false)
        setJito(false)
      })

    const wsUrl = (process.env.NEXT_PUBLIC_HELIUS_WS || '').trim()
    if (!wsUrl) return
    try {
      const sock = new WebSocket(wsUrl)
      let opened = false
      sock.onopen = () => {
        opened = true
        setWs(true)
        sock.close()
      }
      sock.onerror = () => {
        if (!opened) setWs(false)
      }
    } catch {
      setWs(false)
    }
  }, [])

  return (
    <div className="grid grid-cols-2 gap-2">
      <Chip ok={rpc} label="RPC" />
      <Chip ok={ws} label="WS" />
      <Chip ok={jito} label="JITO" />
      <Chip ok label={net} />
    </div>
  )
}

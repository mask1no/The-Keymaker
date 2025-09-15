'use client'
import { useEffect, useState } from 'react'

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-zinc-500'}`}
    />
  )
}

function Chip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-border px-2 py-1 text-[11px] leading-none text-primary">
      <Dot ok={ok} />
      <span className="tracking-wide">{label}</span>
    </div>
  )
}

export default function NavStatus() {
  const [rpc, setRpc] = useState(false)
  const [ws, setWs] = useState(false)
  const [jito, setJito] = useState(false)
  const [net, setNet] = useState<'MAINNET' | 'DEVNET' | 'UNKNOWN'>('UNKNOWN')

  useEffect(() => {
    const rpcUrl = (process.env.NEXT_PUBLIC_HELIUS_RPC || '').toLowerCase()
    // default to MAINNET unless we see explicit 'devnet'
    setNet(rpcUrl.includes('devnet') ? 'DEVNET' : 'MAINNET')

    fetch('/api/jito/tipfloor', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(() => {
        setRpc(true)
        setJito(true)
      })
      .catch(() => {
        setRpc(false)
        setJito(false)
      })

    const wsUrl = (process.env.NEXT_PUBLIC_HELIUS_WS || '').trim()
    if (!wsUrl) return setWs(false)
    try {
      const s = new WebSocket(wsUrl)
      let opened = false
      s.onopen = () => {
        opened = true
        setWs(true)
        s.close()
      }
      s.onerror = () => {
        if (!opened) setWs(false)
      }
    } catch {
      setWs(false)
    }
  }, [])

  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <Chip ok={rpc} label="RPC" />
      <Chip ok={ws} label="WS" />
      <Chip ok={jito} label="JITO" />
      <Chip ok label={net} />
    </div>
  )
}

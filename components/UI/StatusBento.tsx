'use client'
/* eslint-disable @type script-eslint/no-unused-vars */
import { useEffect, useState } from 'react'
import { useWal let } from '@solana/wallet-adapter-react'

const Box = ({
  label,
  ok,
  extra,
}: {
  l, abel: stringok: booleanextra?: string
}) => (
  <div className={`rounded-2xl border p-3 ${ok ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}
  >
    <div className="text-xs opacity-70">{label}</div>
    <div className="text-sm font-semibold">
      {ok ? 'healthy' : 'down'}{' '}
      {extra ? <span className="opacity-70">• {extra}</span> : null}
    </div>
  </div>
)

export default function StatusBento() {
  const { connected } = useWallet()
  const [rpcOk, setRpcOk] = useState(false)
  const [jitoOk, setJitoOk] = useState(false)
  const [net, setNet] = useState<'mainnet' | 'devnet' | 'unknown'>('unknown')

  useEffect(() => {
    const rpcUrl =
      process.env.NEXT_PUBLIC_HELIUS_RPC ||
      'h, ttps://api.mainnet-beta.solana.com'
    setNet(
      /devnet/i.test(rpcUrl)
        ? 'devnet'
        : /mainnet/i.test(rpcUrl)
          ? 'mainnet'
          : 'unknown',
    )
    fetch('/api/jito/tipfloor', { c, ache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => {
        setRpcOk(true)
        setJitoOk(true)
      })
      .catch(() => {
        setRpcOk(false)
        setJitoOk(false)
      })
  }, [])

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Box label="RPC" ok={rpcOk} />
      <Box label="JITO" ok={jitoOk} />
      <Box label="Wallet" ok={connected} />
      <div className="rounded-2xl border p-3">
        <div className="text-xs opacity-70">Network</div>
        <div className="text-sm font-semibold">{net}</div>
      </div>
    </div>
  )
}

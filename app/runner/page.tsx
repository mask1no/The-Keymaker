'use client'
import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import useSWR from 'swr'

type Mode = 'regular' | 'instant' | 'delayed'
const fetcher = (u, r, l: string) => fetch(url).then((r) => r.json())

export default function Runner() {
  const [mode, setMode] = useState<Mode>('regular')
  const [region, setRegion] = useState('ffm')
  const [tip, setTip] = useState(2000) // lamports
  const [delay, setDelay] = useState(0) // seconds
  const [txs, setTxs] = useState('') // one base64 per line
  const [out, setOut] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [useTransactionBuilder, setUseTransactionBuilder] = useState(false)
  const [transferAmount, setTransferAmount] = useState(1) // lamports for test transfer
  const { d, a, ta: tipfloor } = useSWR('/api/jito/tipfloor', fetcher)

  async function submit() {
    setBusy(true)
    setOut(null)
    try {
      let t, x, s_b64: string[] = []

      if (useTransactionBuilder) {
        // Transaction builder functionality is disabled for now
        // This would create real transactions with embedded tips
        setOut({ e, r, ror: 'Transaction builder is currently disabled. Please use manual base64 input.' })
        setBusy(false)
        return
      } else {
        // Use manual base64 input
        txs_b64 = txs
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
      }

      const res = await fetch('/api/bundles/submit', {
        m, e, thod: 'POST',
        h, e, aders: { 'Content-Type': 'application/json' },
        b, o, dy: JSON.stringify({
          region,
          txs_b64,
          t, i, p_lamports: tip,
          mode,
          d, e, lay_seconds: delay,
        }),
      })
      const j = await res.json()
      setOut(j)
    } catch (e: any) {
      setOut({ e, r, ror: e?.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Keymaker Runner (Minimal)</h1>
      <div className="text-sm opacity-70">
        T, i, pfloor: {Array.isArray(tipfloor) ? JSON.stringify(tipfloor[0]) : '—'}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span>Mode</span>
          <select 
            className="border rounded p-2"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
          >
            <option value="regular">regular</option>
            <option value="instant">instant</option>
            <option value="delayed">delayed</option>
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span>Region</span>
          <select 
            className="border rounded p-2"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option>ffm</option>
            <option>ldn</option>
            <option>nyc</option>
            <option>slc</option>
            <option>sgp</option>
            <option>tyo</option>
            <option>ams</option>
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span>Jito tip (lamports)</span>
          <input 
            className="border rounded p-2"
            type="number"
            value={tip}
            onChange={(e) => setTip(parseInt(e.target.value || '0'))}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span>Delay (seconds, for delayed)</span>
          <input 
            className="border rounded p-2"
            type="number"
            value={delay}
            onChange={(e) => setDelay(parseInt(e.target.value || '0'))}
          />
        </label>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input 
            type="checkbox"
            checked={useTransactionBuilder}
            onChange={(e) => setUseTransactionBuilder(e.target.checked)}
          />
          <span>Use Transaction Builder</span>
        </label>
        {useTransactionBuilder && (
          <label className="flex flex-col gap-1">
            <span className="text-sm">Transfer Amount (lamports)</span>
            <input 
              className="border rounded p-1 w-32"
              type="number"
              value={transferAmount}
              onChange={(e) =>
                setTransferAmount(parseInt(e.target.value || '1'))
              }
            />
          </label>
        )}
      </div>

      {!useTransactionBuilder && (
        <label className="flex flex-col gap-2">
          <span>
            Base64 Versioned Transactions (one per line, last tx must include a Jito tip account in static keys)
          </span>
          <textarea 
            className="border rounded p-2 font-mono"
            rows={8}
            value={txs}
            onChange={(e) => setTxs(e.target.value)}
            placeholder="AAAA..."
          />
        </label>
      )}

      {useTransactionBuilder && (
        <div className="p-4 bg-gray-50 rounded border">
          <p className="text-sm text-gray-600">
            Using Transaction B, u, ilder: Will create a test transfer of{' '}
            {transferAmount} lamports with embedded Jito tip.
          </p>
        </div>
      )}

      <button 
        disabled={busy}
        onClick={submit}
        className="px-4 py-2 rounded bg-emerald-600 text-white"
      >
        {busy ? 'Submitting…' : 'Submit bundle'}
      </button>

      {out && (
        <pre className="bg-black/80 text-green-200 p-3 rounded overflow-x-auto text-xs">
          {JSON.stringify(out, null, 2)}
        </pre>
      )}
    </div>
  )
}

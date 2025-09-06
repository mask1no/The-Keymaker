'use client'
import { useState } from 'react'
import { Button } from '@/components/UI/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import useSWR from 'swr'

export default function BundlePage() {
  const { connected } = useWallet()
  const [txs, setTxs] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: tipData } = useSWR('/api/jito/tipfloor', (url) => fetch(url).then(res => res.json()), {
    refreshInterval: 20000, revalidateOnFocus: false
  })

  const handleSubmit = async () => {
    if (!connected) return toast.error('Connect wallet')
    if (!txs.trim()) return toast.error('Enter base64 transactions')

    setSubmitting(true)
    try {
      const response = await fetch('/api/bundles/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txs_b64: txs.trim().split('\n').filter(Boolean) })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Submit failed')
      toast.success(`Bundle ${result.bundle_id} submitted`)
      setTxs('')
    } catch (e: any) {
      toast.error(e.message || 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Bundle Transactions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Base64 Transactions (one per line)</label>
            <textarea
              className="w-full h-32 mt-1 p-2 border rounded-md bg-background text-sm"
              value={txs}
              onChange={e => setTxs(e.target.value)}
              placeholder="Paste your base64-encoded v0 transactions here..."
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting || !connected}>
            {submitting ? 'Submitting...' : 'Submit Bundle'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tip Floor</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>P25: {(tipData?.p25 || 0).toFixed(6)} SOL</div>
            <div>P50: {(tipData?.p50 || 0).toFixed(6)} SOL</div>
            <div>P75: {(tipData?.p75 || 0).toFixed(6)} SOL</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

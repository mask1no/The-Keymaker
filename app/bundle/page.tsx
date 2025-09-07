'use client'
import { useState, startTransition, useMemo } from 'react'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/UI/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { Badge } from '@/components/UI/badge'
import { Package, Play, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import useSWR from 'swr'

type BundleStatus = 'idle' | 'previewing' | 'executing' | 'completed' | 'failed'

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function BundlePage() {
  const { publicKey, signTransaction, connected } = useWallet()
  const [status, setStatus] = useState<BundleStatus>('idle')
  const [bundleId, setBundleId] = useState<string | null>(null)
  const [bundleStatus, setBundleStatus] = useState<string>('pending')

  // Tip only from tipfloor (fast)
  const { data: tipData } = useSWR('/api/jito/tipfloor', fetcher, {
    refreshInterval: 20000,
    revalidateOnFocus: false,
  })
  const chosenTip = useMemo(
    () => Math.max(0.00005, Math.min(0.002, (tipData?.p50 || 0.00005) * 1.2)),
    [tipData],
  )

  const canPreview = connected
  const canExecute = connected && status !== 'executing'

  const handlePreview = async () => {
    if (!canPreview) return
    startTransition(() => setStatus('previewing'))
    try {
      const {
        createTestTransferInstruction,
        buildBundleTransactions,
        serializeBundleTransactions,
      } = await import('@/lib/transactionBuilder')
      const { getConnection } = await import('@/lib/network')
      const conn = getConnection('processed')

      const sys = new PublicKey('11111111111111111111111111111111')
      const signer = publicKey ? ({ publicKey, signTransaction } as any) : null
      if (!signer) throw new Error('Connect wallet')

      const txs = await buildBundleTransactions(conn, [
        {
          instructions: [createTestTransferInstruction(publicKey!, sys, 1)],
          signer,
          tipLamports: Math.floor(chosenTip * LAMPORTS_PER_SOL),
          mode: 'regular',
        },
      ])

      const serialized = serializeBundleTransactions(txs)
      if (!serialized?.length) throw new Error('No transactions')
      toast.success('Preview OK — ready to execute')
      setStatus('idle')
    } catch (e: any) {
      toast.error(`Preview failed: ${e.message || e}`)
      setStatus('failed')
    }
  }

  const handleExecute = async () => {
    if (!canExecute) return
    startTransition(() => setStatus('executing'))
    try {
      const {
        createTestTransferInstruction,
        buildBundleTransactions,
        serializeBundleTransactions,
      } = await import('@/lib/transactionBuilder')
      const { getConnection } = await import('@/lib/network')
      const conn = getConnection('processed')
      const sys = new PublicKey('11111111111111111111111111111111')
      const signer = publicKey ? ({ publicKey, signTransaction } as any) : null
      if (!signer) throw new Error('Connect wallet')

      const txs = await buildBundleTransactions(conn, [
        {
          instructions: [createTestTransferInstruction(publicKey!, sys, 1)],
          signer,
          tipLamports: Math.floor(chosenTip * LAMPORTS_PER_SOL),
          mode: 'regular',
        },
      ])
      const txs_b64 = serializeBundleTransactions(txs)

      const r = await fetch('/api/bundles/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ txs_b64, simulateOnly: false, mode: 'regular' }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'Submit failed')
      const id = j.bundle_id as string
      setBundleId(id)
      toast.success(`Bundle submitted: ${id}`)

      // poll status
      let attempts = 0
      const poll = async () => {
        attempts++
        try {
          const rr = await fetch('/api/bundles/status/batch', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ region: 'ffm', bundle_ids: [id] }),
          })
          const jj = await rr.json()
          const st = jj?.statuses?.[0]?.status || 'pending'
          setBundleStatus(st)
          if (st === 'landed') {
            setStatus('completed')
            toast.success('Bundle landed!')
            return
          }
          if (st === 'failed' || st === 'invalid') {
            setStatus('failed')
            toast.error(`Bundle ${st}`)
            return
          }
        } catch (e) {
          /* ignore transient polling error */
        }
        if (attempts < 20) setTimeout(poll, 1200)
      }
      poll()
    } catch (e: any) {
      toast.error(`Execute failed: ${e.message || e}`)
      setStatus('failed')
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Bundle Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Tip (p50 × 1.2)
            </span>
            <Badge variant="outline">{chosenTip.toFixed(6)} SOL</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handlePreview}
              disabled={!canPreview || status === 'previewing'}
              variant="outline"
            >
              <Play className="h-4 w-4 mr-1" /> Preview
            </Button>
            <Button onClick={handleExecute} disabled={!canExecute}>
              <Play className="h-4 w-4 mr-1" /> Execute
            </Button>
          </div>
          {bundleId && (
            <div className="text-sm">
              <div>
                Bundle ID: <code className="break-all">{bundleId}</code>
              </div>
              <div className="flex items-center gap-2">
                Status:
                {status === 'completed' ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-400" /> Landed
                  </>
                ) : status === 'failed' ? (
                  <>
                    <XCircle className="h-4 w-4 text-red-400" /> Failed
                  </>
                ) : (
                  <span className="text-amber-400">{bundleStatus}</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

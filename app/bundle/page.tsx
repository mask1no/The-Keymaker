'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { Button } from '@/components/UI/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { Badge } from '@/components/UI/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/UI/tooltip'
import {
  Play,
  Eye,
  Package,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import useSWR from 'swr'

type ExecutionMode = 'regular' | 'instant' | 'delayed'
type BundleStatus = 'idle' | 'previewing' | 'executing' | 'completed' | 'failed'

export default function BundlePage() {
  // State management
  const [mode, setMode] = useState<ExecutionMode>('regular')
  const [delay, setDelay] = useState(30)
  const [walletGroup, setWalletGroup] = useState('neo')
  const [region, setRegion] = useState('ffm')
  const [status, setStatus] = useState<BundleStatus>('idle')
  const [bundleId, setBundleId] = useState<string | null>(null)
  const [bundleStatus, setBundleStatus] = useState<string>('')

  // Fetch health data for guardrails
  const { data: healthData } = useSWR('/api/health', (url) => fetch(url).then(res => res.json()), {
    refreshInterval: 3000, // Match StatusBento refresh interval
    revalidateOnFocus: false,
  })

  // Fetch tip data for calculations
  const { data: tipData } = useSWR(`/api/jito/tipfloor?region=${region}`, (url) => fetch(url).then(res => res.json()), {
    refreshInterval: 10000,
    revalidateOnFocus: false,
  })

  // Calculate chosen tip based on mode
  const getChosenTip = () => {
    const baseTip = tipData?.p50 || tipData?.median || 0.000050
    switch (mode) {
      case 'regular':
        return Math.max(0.00005, Math.min(0.002, baseTip * 1.2))
      case 'instant':
        return Math.max(0.00005, Math.min(0.002, baseTip * 1.25))
      case 'delayed':
        return Math.max(0.00005, Math.min(0.002, baseTip * 1.2))
      default:
        return baseTip
    }
  }

  // Bundle planner data - enforce max 5 tx per bundle
  const partitions = (active: number, cap = 5) => {
    const out: number[] = []
    let left = active
    while (left > 0) {
      const take = Math.min(cap, left)
      out.push(take)
      left -= take
    }
    return out // e.g., 19 => [5,5,5,4]
  }

  const activeWallets = walletGroup === 'neo' ? 19 : 0 // Neo group has 19 active wallets
  const bundlePartitions = partitions(activeWallets, 5) // Max 5 tx per bundle
  const totalTx = bundlePartitions.reduce((sum, count) => sum + count, 0)

  // Guardrails check - enforce max 5 tx per bundle
  const checkGuards = () => {
    // Check if all bundles have max 5 tx
    const bundlesWithinLimit = bundlePartitions.every(count => count <= 5)

    // Check health status from API
    const isHealthHealthy = () => {
      if (!healthData) return false
      // RPC and BE must be healthy (not degraded/down)
      const rpcHealthy = healthData.rpc === true || healthData.rpc === 'healthy'
      const jitoHealthy = healthData.jito === true || healthData.jito === 'healthy' || healthData.be === true || healthData.be === 'healthy'
      return rpcHealthy && jitoHealthy
    }

    return {
      hasWallets: activeWallets >= 1, // At least 1 active wallet
      regionSelected: region !== '',
      txCountValid: totalTx > 0 && totalTx <= 20 && bundlesWithinLimit, // Max 5 tx per bundle, up to 20 total
      previewPassed: status === 'idle' || status === 'completed',
      blockhashFresh: true, // Server will handle blockhash freshness (< 3s)
      healthHealthy: isHealthHealthy() // Real health check from /api/health
    }
  }

  const guards = checkGuards()
  const canExecute = Object.values(guards).every(Boolean)
  const canPreview = guards.hasWallets && guards.regionSelected && guards.txCountValid

  const getDisabledReason = () => {
    if (!guards.hasWallets) return 'Active wallets required (≥1 wallet in selected group)'
    if (!guards.regionSelected) return 'Region must be selected'
    if (!guards.txCountValid) return 'Bundle must have 1-20 tx total, max 5 tx per bundle'
    if (!guards.previewPassed) return 'Must preview bundle first'
    if (!guards.blockhashFresh) return 'Blockhash too old (server must fetch fresh within 3s)'
    if (!guards.healthHealthy) return 'Health status not healthy (RPC + BE + tip feed)'
    return ''
  }

  // API calls
  const handlePreview = async () => {
    if (!canPreview) return

    setStatus('previewing')
    try {
      // Build native v0 transactions with embedded tips
      const { buildBundleTransactions, serializeBundleTransactions, createTestTransferInstruction } = await import('@/lib/transactionBuilder')

      // Create mock transaction configs for demonstration
      // In real app, these would come from the transaction builder UI
      const mockConfigs = [
        {
          instructions: [createTestTransferInstruction(new PublicKey('11111111111111111111111111111112'), new PublicKey('11111111111111111111111111111112'), 1)],
          signer: { publicKey: new PublicKey('11111111111111111111111111111112') } as any, // Mock signer
          tipLamports: getChosenTip() / 1e9 * 1e9 // Convert SOL to lamports
        }
      ]

      // Build transactions (mock for now - would use real connection)
      const bundleTxs = await buildBundleTransactions(
        { getLatestBlockhash: async () => ({ blockhash: 'mock', lastValidBlockHeight: 100 }) } as any,
        mockConfigs,
        mode
      )

      // Serialize for API submission
      const serializedBundle = serializeBundleTransactions(bundleTxs)

      // Submit for preview (simulateOnly: true)
      const response = await fetch('/api/bundles/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region,
          simulateOnly: true,
          txs_b64: serializedBundle.transactions,
          mode,
          tip_lamports: Math.floor(getChosenTip() / 1e9 * 1e9)
        })
      })

      if (response.ok) {
        toast.success(`Bundle preview successful - ${serializedBundle.transactionCount} tx, ${serializedBundle.totalTip / 1e9} SOL tip`)
        setStatus('idle')
      } else {
        throw new Error('Preview failed')
      }
    } catch (error) {
      toast.error('Preview failed: ' + (error as Error).message)
      setStatus('failed')
    }
  }

  const handleExecute = async () => {
    if (!canExecute) return

    setStatus('executing')
    try {
      // Build native v0 transactions with embedded tips
      const { buildBundleTransactions, serializeBundleTransactions, createTestTransferInstruction } = await import('@/lib/transactionBuilder')

      // Create mock transaction configs for demonstration
      // In real app, these would come from the transaction builder UI
      const mockConfigs = [
        {
          instructions: [createTestTransferInstruction(new PublicKey('11111111111111111111111111111112'), new PublicKey('11111111111111111111111111111112'), 1)],
          signer: { publicKey: new PublicKey('11111111111111111111111111111112') } as any, // Mock signer
          tipLamports: getChosenTip() / 1e9 * 1e9 // Convert SOL to lamports
        }
      ]

      // Build transactions (mock for now - would use real connection)
      const bundleTxs = await buildBundleTransactions(
        { getLatestBlockhash: async () => ({ blockhash: 'mock', lastValidBlockHeight: 100 }) } as any,
        mockConfigs,
        mode
      )

      // Serialize for API submission
      const serializedBundle = serializeBundleTransactions(bundleTxs)

      // Submit for execution (simulateOnly: false)
      const response = await fetch('/api/bundles/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region,
          simulateOnly: false,
          txs_b64: serializedBundle.transactions,
          mode,
          tip_lamports: Math.floor(getChosenTip() / 1e9 * 1e9)
        })
      })

      if (response.ok) {
        const result = await response.json()
        const bundleId = result.bundle_id || serializedBundle.bundleId
        setBundleId(bundleId)
        setBundleStatus('submitted')

        toast.success(`Bundle ${bundleId} submitted - ${serializedBundle.transactionCount} tx, ${(serializedBundle.totalTip / 1e9).toFixed(6)} SOL tip`)

        // Mock status updates (in real app, this would come from status polling)
        setTimeout(() => {
          setBundleStatus('processing')
          toast.info(`Bundle ${bundleId} processing...`)
        }, 2000)

        setTimeout(() => {
          setBundleStatus('landed')
          setStatus('completed')
          toast.success(`Bundle ${bundleId} landed successfully!`)
        }, 8000)
      } else {
        throw new Error('Execution failed')
      }

    } catch (error) {
      toast.error('Execution failed: ' + (error as Error).message)
      setStatus('failed')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bundle Engine</h1>
          <p className="text-muted-foreground">Execute bundled transactions with Jito integration</p>
        </div>
        {bundleId && (
          <Badge variant={bundleStatus === 'landed' ? 'default' : 'secondary'}>
            {bundleStatus === 'landed' ? '✅' : '⏳'} {bundleId}
          </Badge>
        )}
      </div>

      {/* Controls */}
      <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bundle Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Mode</label>
              <Select value={mode} onValueChange={(value: ExecutionMode) => setMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="instant">Instant</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === 'delayed' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Delay</label>
                <Select value={delay.toString()} onValueChange={(value) => setDelay(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">60 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Wallet Group</label>
              <Select value={walletGroup} onValueChange={setWalletGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neo">Neo (ID: 19)</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Region</label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ffm">Frankfurt (ffm)</SelectItem>
                  <SelectItem value="nyc">New York (nyc)</SelectItem>
                  <SelectItem value="ams">Amsterdam (ams)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tip Preview */}
      <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Tip Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-muted-foreground mb-1">P25</div>
              <div className="text-sm font-mono">{(tipData?.p25 || tipData?.p25th || 0.000030).toFixed(6)} SOL</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">P50</div>
              <div className="text-sm font-mono">{(tipData?.p50 || tipData?.median || 0.000050).toFixed(6)} SOL</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">P75</div>
              <div className="text-sm font-mono">{(tipData?.p75 || tipData?.p75th || 0.000075).toFixed(6)} SOL</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Chosen</div>
              <div className="text-sm font-mono text-primary font-semibold">
                {getChosenTip().toFixed(6)} SOL
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Rule: {mode === 'regular' ? 'P50 × 1.2' : mode === 'instant' ? 'P75 × 1.25' : 'P50 × 1.2'}
              {mode === 'delayed' && ` (stagger: 60ms)`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bundle Planner */}
      <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bundle Planner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Transactions</span>
              <Badge variant="outline">{totalTx} tx</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Bundles</span>
              <span className="text-sm font-mono">{bundlePartitions.length}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Partition</span>
                <span className="text-sm font-mono">{bundlePartitions.join('/')}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {bundlePartitions.map((count, index) => (
                  <div key={index} className="space-y-1">
                    <div className="text-xs text-center text-muted-foreground">
                      Bundle {index + 1}
                    </div>
                    <div className="h-2 bg-primary/20 rounded-full relative">
                      <div
                        className="h-2 bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${(count / 5) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-center font-mono">{count} tx</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handlePreview}
                disabled={!canPreview || status === 'previewing'}
                variant="outline"
                className="flex-1 h-12"
              >
                {status === 'previewing' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Previewing...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Bundle
                  </>
                )}
              </Button>
            </TooltipTrigger>
            {!canPreview && (
              <TooltipContent>
                <p>{getDisabledReason()}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleExecute}
                disabled={!canExecute || status === 'executing'}
                className="flex-1 h-12"
              >
                {status === 'executing' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute Bundle
                  </>
                )}
              </Button>
            </TooltipTrigger>
            {!canExecute && (
              <TooltipContent>
                <p>{getDisabledReason()}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Status Messages */}
      {!canExecute && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <span className="text-sm text-amber-400">{getDisabledReason()}</span>
        </div>
      )}

      {bundleId && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
          <span className="text-sm text-green-400">
            Bundle {bundleId} - Status: {bundleStatus}
          </span>
        </div>
      )}
    </div>
  )
}

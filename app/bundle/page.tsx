'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Button } from '@/components/UI/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { Badge } from '@/components/UI/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select'
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

  // Mock tip data - in real app, this would come from /api/jito/tipfloor
  const [tipData] = useState({
    p25: 0.000030,
    p50: 0.000050,
    p75: 0.000075
  })

  // Calculate chosen tip based on mode
  const getChosenTip = () => {
    const baseTip = tipData.p50
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

  // Mock bundle planner data
  const bundlePartitions = [5, 5, 5, 4] // Max 5 tx per bundle
  const totalTx = bundlePartitions.reduce((sum, count) => sum + count, 0)

  // Guardrails check
  const checkGuards = () => {
    return {
      hasWallets: walletGroup === 'neo', // Mock check for Neo group
      regionSelected: region !== '',
      txCountValid: totalTx > 0 && totalTx <= 20, // Allow up to 20 total tx
      previewPassed: status === 'idle' || status === 'completed',
      blockhashFresh: true, // Mock - would check server blockhash age
      healthHealthy: true // Mock - would check /api/health
    }
  }

  const guards = checkGuards()
  const canExecute = Object.values(guards).every(Boolean)
  const canPreview = guards.hasWallets && guards.regionSelected && guards.txCountValid

  const getDisabledReason = () => {
    if (!guards.hasWallets) return 'Neo wallet group required'
    if (!guards.regionSelected) return 'Region must be selected'
    if (!guards.txCountValid) return 'Bundle must have 1-20 transactions'
    if (!guards.previewPassed) return 'Must preview bundle first'
    if (!guards.blockhashFresh) return 'Blockhash too old'
    if (!guards.healthHealthy) return 'Health status not healthy'
    return ''
  }

  // API calls
  const handlePreview = async () => {
    if (!canPreview) return

    setStatus('previewing')
    try {
      // Mock API call - in real app, this would post to /api/bundles/submit
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call

      toast.success('Bundle preview successful')
      setStatus('idle')
    } catch (error) {
      toast.error('Preview failed')
      setStatus('failed')
    }
  }

  const handleExecute = async () => {
    if (!canExecute) return

    setStatus('executing')
    try {
      // Mock API call - in real app, this would post to /api/bundles/submit
      await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate API call

      const mockBundleId = `bundle_${Date.now()}`
      setBundleId(mockBundleId)
      setBundleStatus('submitted')

      toast.success(`Bundle ${mockBundleId} submitted`)

      // Mock status updates
      setTimeout(() => {
        setBundleStatus('landed')
        setStatus('completed')
        toast.success(`Bundle ${mockBundleId} landed successfully`)
      }, 5000)

    } catch (error) {
      toast.error('Execution failed')
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
              <div className="text-sm font-mono">{tipData.p25.toFixed(6)} SOL</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">P50</div>
              <div className="text-sm font-mono">{tipData.p50.toFixed(6)} SOL</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">P75</div>
              <div className="text-sm font-mono">{tipData.p75.toFixed(6)} SOL</div>
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

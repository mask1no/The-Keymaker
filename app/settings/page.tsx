'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/UI/Card'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select'
import { Badge } from '@/components/UI/badge'
import {
  Settings as SettingsIcon,
  Save,
  Server,
  Zap,
  Shield,
  Activity,
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface TipDefaults {
  regular: { quantile: number; multiplier: number }
  instant: { quantile: number; multiplier: number }
  delayed: { quantile: number; multiplier: number }
}

export default function SettingsPage() {
  // Network settings
  const [region, setRegion] = useState('ffm')
  const [showRpcUrl, setShowRpcUrl] = useState(false)
  const [healthThresholds, setHealthThresholds] = useState({
    rpcLatency: 400,
    jitoLatency: 600,
  })

  // Tip settings
  const [tipDefaults, setTipDefaults] = useState<TipDefaults>({
    regular: { quantile: 50, multiplier: 1.2 },
    instant: { quantile: 75, multiplier: 1.25 },
    delayed: { quantile: 50, multiplier: 1.2 },
  })

  // Bundle settings
  const [bundleSettings, setBundleSettings] = useState({
    maxTxPerBundle: 5,
    staggerMs: 60,
    minTipLamports: 50000, // 0.00005 SOL
    maxTipLamports: 2000000, // 0.002 SOL
  })

  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Mock RPC URL (would come from env in real app)
  const rpcUrl =
    process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.mainnet-beta.solana.com'

  const maskRpcUrl = (url: string) => {
    if (!showRpcUrl) {
      return url.replace(/:\/\/.*@/, '://****:****@')
    }
    return url
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Mock API call - in real app, this would save to server/localStorage
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Save to localStorage for persistence
      const settings = {
        region,
        tipDefaults,
        bundleSettings,
        healthThresholds,
        updatedAt: new Date().toISOString(),
      }

      localStorage.setItem('keymaker-settings', JSON.stringify(settings))

      setHasChanges(false)
      toast.success('Settings saved successfully!')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // Load saved settings
  useEffect(() => {
    const saved = localStorage.getItem('keymaker-settings')
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        setRegion(settings.region || 'ffm')
        setTipDefaults(settings.tipDefaults || tipDefaults)
        setBundleSettings(settings.bundleSettings || bundleSettings)
        setHealthThresholds(settings.healthThresholds || healthThresholds)
      } catch (error) {
        console.warn('Failed to load saved settings:', error)
      }
    }
  }, [])

  // Track changes
  useEffect(() => {
    setHasChanges(true)
  }, [region, tipDefaults, bundleSettings, healthThresholds])

  const updateTipDefault = (
    mode: keyof TipDefaults,
    field: 'quantile' | 'multiplier',
    value: number,
  ) => {
    setTipDefaults((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [field]: value,
      },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure application preferences and defaults
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="secondary" className="animate-pulse">
              Unsaved changes
            </Badge>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="gap-2"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Network Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Network Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* RPC URL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">RPC URL</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRpcUrl(!showRpcUrl)}
                  className="h-6 w-6 p-0"
                >
                  {showRpcUrl ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <Input
                value={maskRpcUrl(rpcUrl)}
                readOnly
                className="font-mono text-sm bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">
                Primary Solana RPC endpoint (read-only)
              </p>
            </div>

            {/* Default Region */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Default Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ffm">🇩🇪 Frankfurt (ffm)</SelectItem>
                  <SelectItem value="nyc">🇺🇸 New York (nyc)</SelectItem>
                  <SelectItem value="ams">🇳🇱 Amsterdam (ams)</SelectItem>
                  <SelectItem value="tok">🇯🇵 Tokyo (tok)</SelectItem>
                  <SelectItem value="sin">🇸🇬 Singapore (sin)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Primary Jito region for bundle execution
              </p>
            </div>

            {/* Health Thresholds */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">
                Health Thresholds (ms)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    RPC Latency
                  </Label>
                  <Input
                    type="number"
                    value={healthThresholds.rpcLatency}
                    onChange={(e) =>
                      setHealthThresholds((prev) => ({
                        ...prev,
                        rpcLatency: parseInt(e.target.value) || 400,
                      }))
                    }
                    placeholder="400"
                    min="100"
                    max="2000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Jito Latency
                  </Label>
                  <Input
                    type="number"
                    value={healthThresholds.jitoLatency}
                    onChange={(e) =>
                      setHealthThresholds((prev) => ({
                        ...prev,
                        jitoLatency: parseInt(e.target.value) || 600,
                      }))
                    }
                    placeholder="600"
                    min="200"
                    max="3000"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tip Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Tip Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(tipDefaults).map(([mode, config]) => (
              <div key={mode} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {mode} Mode
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Quantile (%)
                    </Label>
                    <Select
                      value={config.quantile.toString()}
                      onValueChange={(value) =>
                        updateTipDefault(
                          mode as keyof TipDefaults,
                          'quantile',
                          parseInt(value),
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25th percentile</SelectItem>
                        <SelectItem value="50">50th percentile</SelectItem>
                        <SelectItem value="75">75th percentile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Multiplier
                    </Label>
                    <Input
                      type="number"
                      value={config.multiplier}
                      onChange={(e) =>
                        updateTipDefault(
                          mode as keyof TipDefaults,
                          'multiplier',
                          parseFloat(e.target.value) || 1,
                        )
                      }
                      placeholder="1.2"
                      step="0.05"
                      min="1.0"
                      max="2.0"
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                  Result: P{config.quantile} × {config.multiplier} ={' '}
                  {(0.00005 * config.multiplier).toFixed(6)} SOL base tip
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bundle Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Bundle Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bundle Limits */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Bundle Limits</Label>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Max TX per Bundle
                  </Label>
                  <Input
                    type="number"
                    value={bundleSettings.maxTxPerBundle}
                    onChange={(e) =>
                      setBundleSettings((prev) => ({
                        ...prev,
                        maxTxPerBundle: parseInt(e.target.value) || 5,
                      }))
                    }
                    placeholder="5"
                    min="1"
                    max="20"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Fixed at 5 transactions per bundle
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Inter-bundle Stagger (ms)
                  </Label>
                  <Input
                    type="number"
                    value={bundleSettings.staggerMs}
                    onChange={(e) =>
                      setBundleSettings((prev) => ({
                        ...prev,
                        staggerMs: parseInt(e.target.value) || 60,
                      }))
                    }
                    placeholder="60"
                    min="0"
                    max="1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Delay between bundle submissions
                  </p>
                </div>
              </div>

              {/* Tip Clamps */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Tip Clamps (Lamports)
                </Label>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Minimum Tip
                  </Label>
                  <Input
                    type="number"
                    value={bundleSettings.minTipLamports}
                    onChange={(e) =>
                      setBundleSettings((prev) => ({
                        ...prev,
                        minTipLamports: parseInt(e.target.value) || 50000,
                      }))
                    }
                    placeholder="50000"
                    min="10000"
                    max="1000000"
                  />
                  <p className="text-xs text-muted-foreground">
                    {(bundleSettings.minTipLamports / 1e6).toFixed(6)} SOL
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Maximum Tip
                  </Label>
                  <Input
                    type="number"
                    value={bundleSettings.maxTipLamports}
                    onChange={(e) =>
                      setBundleSettings((prev) => ({
                        ...prev,
                        maxTipLamports: parseInt(e.target.value) || 2000000,
                      }))
                    }
                    placeholder="2000000"
                    min="100000"
                    max="10000000"
                  />
                  <p className="text-xs text-muted-foreground">
                    {(bundleSettings.maxTipLamports / 1e6).toFixed(6)} SOL
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* System Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span className="font-mono">1.5.2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Environment:</span>
                <Badge variant="outline">Production</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network:</span>
                <span>Mainnet-Beta</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-mono">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>
                  All settings are automatically validated and saved locally
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

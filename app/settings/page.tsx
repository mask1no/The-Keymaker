'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { Input } from '@/components/UI/input'
import { Button } from '@/components/UI/button'
import { Label } from '@/components/UI/label'
import { Switch } from '@/components/UI/switch'
import { Badge } from '@/components/UI/badge'
import { Skeleton } from '@/components/UI/skeleton'
import {
  Settings,
  Key,
  Globe,
  Shield,
  Database,
  Save,
  Check,
  AlertCircle,
  Activity,
  Wifi,
  Zap,
  Server,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSystemStatus } from '@/hooks/useSystemStatus'
import { Connection } from '@solana/web3.js'
import { NEXT_PUBLIC_HELIUS_RPC, NEXT_PUBLIC_JITO_ENDPOINT } from '@/constants'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/UI/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/UI/tooltip'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { useKeymakerStore } from '@/lib/store'
import { useSettingsStore } from '@/stores/useSettingsStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select'
// Form validation imports reserved for future use

interface ApiKeys {
  heliusRpc?: string
  birdeyeApiKey?: string
  twoCaptchaKey?: string
  pumpfunApiKey?: string
  jupiterApiKey?: string
  headlessTimeout?: number
  jitoTipLamports?: number
  jupiterFeeBps?: number
}

interface Preferences {
  defaultSlippage: number
  defaultPriorityFee: number
  autoRefreshInterval: number
  darkMode: boolean
  soundNotifications: boolean
}

interface HealthStatus {
  connected: boolean
  rtt: number
  lastCheck: number
}

interface HealthHistory {
  timestamp: number
  rtt: number
  connected: boolean
}

const MAX_HISTORY_POINTS = 180 // 30 minutes at 10s intervals

export default function SettingsPage() {
  useSystemStatus()
  const {
    network,
    setNetwork,
    rpcUrl,
    setRpcUrl,
    wsUrl,
    setWsUrl,
    jitoEnabled,
    setJitoEnabled,
    tipAmount,
    setTipAmount,
  } = useKeymakerStore()
  const [slotHeight, setSlotHeight] = useState<number | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKeys>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [preferences, setPreferences] = useState<Preferences>({
    defaultSlippage: 5,
    defaultPriorityFee: 0.00001,
    autoRefreshInterval: 30,
    darkMode: true,
    soundNotifications: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showKeys, setShowKeys] = useState(false)

  // Hotkeys editable state
  const { hotkeys, setHotkeys, jitoTipLamports, setSettings } =
    useSettingsStore()
  const [hotkeyForm, setHotkeyForm] = useState(hotkeys)

  // Health monitoring states
  const [rpcHealth, setRpcHealth] = useState<HealthStatus>({
    connected: false,
    rtt: 0,
    lastCheck: 0,
  })
  const [wsHealth, setWsHealth] = useState<HealthStatus>({
    connected: false,
    rtt: 0,
    lastCheck: 0,
  })
  const [jitoHealth, setJitoHealth] = useState<HealthStatus>({
    connected: false,
    rtt: 0,
    lastCheck: 0,
  })
  const [solanaHealth, setSolanaHealth] = useState<HealthStatus>({
    connected: false,
    rtt: 0,
    lastCheck: 0,
  })

  // History states
  const [rpcHistory, setRpcHistory] = useState<HealthHistory[]>([])
  const [wsHistory, setWsHistory] = useState<HealthHistory[]>([])
  const [jitoHistory, setJitoHistory] = useState<HealthHistory[]>([])
  const [solanaHistory, setSolanaHistory] = useState<HealthHistory[]>([])

  // Modal states
  const [selectedService, setSelectedService] = useState<
    'rpc' | 'ws' | 'jito' | 'solana' | null
  >(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Health check functions
  const checkRPCHealth = async () => {
    const start = Date.now()
    try {
      const conn = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
      const slot = await conn.getSlot()
      const rtt = Date.now() - start

      const status = { connected: slot > 0, rtt, lastCheck: Date.now() }
      setRpcHealth(status)

      setRpcHistory((prev) => {
        const newHistory = [
          ...prev,
          { timestamp: Date.now(), rtt, connected: status.connected },
        ]
        return newHistory.slice(-MAX_HISTORY_POINTS)
      })
    } catch (error) {
      const status = { connected: false, rtt: 0, lastCheck: Date.now() }
      setRpcHealth(status)
      setRpcHistory((prev) => {
        const newHistory = [
          ...prev,
          { timestamp: Date.now(), rtt: 0, connected: false },
        ]
        return newHistory.slice(-MAX_HISTORY_POINTS)
      })
    }
  }

  const checkWebSocketHealth = async () => {
    const start = Date.now()
    try {
      const wsUrl = NEXT_PUBLIC_HELIUS_RPC.replace('https', 'wss')
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        const rtt = Date.now() - start
        const status = { connected: true, rtt, lastCheck: Date.now() }
        setWsHealth(status)
        setWsHistory((prev) => {
          const newHistory = [
            ...prev,
            { timestamp: Date.now(), rtt, connected: true },
          ]
          return newHistory.slice(-MAX_HISTORY_POINTS)
        })
        ws.close()
      }

      ws.onerror = () => {
        const status = { connected: false, rtt: 0, lastCheck: Date.now() }
        setWsHealth(status)
        setWsHistory((prev) => {
          const newHistory = [
            ...prev,
            { timestamp: Date.now(), rtt: 0, connected: false },
          ]
          return newHistory.slice(-MAX_HISTORY_POINTS)
        })
      }

      setTimeout(() => {
        if (
          ws.readyState !== WebSocket.OPEN &&
          ws.readyState !== WebSocket.CLOSED
        ) {
          ws.close()
          const status = { connected: false, rtt: 0, lastCheck: Date.now() }
          setWsHealth(status)
        }
      }, 5000)
    } catch (error) {
      const status = { connected: false, rtt: 0, lastCheck: Date.now() }
      setWsHealth(status)
      setWsHistory((prev) => {
        const newHistory = [
          ...prev,
          { timestamp: Date.now(), rtt: 0, connected: false },
        ]
        return newHistory.slice(-MAX_HISTORY_POINTS)
      })
    }
  }

  const checkJitoHealth = async () => {
    const start = Date.now()
    try {
      const response = await fetch(
        NEXT_PUBLIC_JITO_ENDPOINT + '/api/v1/bundles',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      const rtt = Date.now() - start
      const connected = response.ok || response.status === 400 // 400 is expected without auth

      const status = { connected, rtt, lastCheck: Date.now() }
      setJitoHealth(status)

      setJitoHistory((prev) => {
        const newHistory = [...prev, { timestamp: Date.now(), rtt, connected }]
        return newHistory.slice(-MAX_HISTORY_POINTS)
      })
    } catch (error) {
      const status = { connected: false, rtt: 0, lastCheck: Date.now() }
      setJitoHealth(status)
      setJitoHistory((prev) => {
        const newHistory = [
          ...prev,
          { timestamp: Date.now(), rtt: 0, connected: false },
        ]
        return newHistory.slice(-MAX_HISTORY_POINTS)
      })
    }
  }

  const checkSolanaHealth = async () => {
    const start = Date.now()
    try {
      const conn = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
      const slot = await conn.getSlot()
      const rtt = Date.now() - start
      setSlotHeight(slot)

      const status = { connected: true, rtt, lastCheck: Date.now() }
      setSolanaHealth(status)

      setSolanaHistory((prev) => {
        const newHistory = [
          ...prev,
          { timestamp: Date.now(), rtt, connected: true },
        ]
        return newHistory.slice(-MAX_HISTORY_POINTS)
      })
    } catch {
      setSlotHeight(null)
      const status = { connected: false, rtt: 0, lastCheck: Date.now() }
      setSolanaHealth(status)
      setSolanaHistory((prev) => {
        const newHistory = [
          ...prev,
          { timestamp: Date.now(), rtt: 0, connected: false },
        ]
        return newHistory.slice(-MAX_HISTORY_POINTS)
      })
    }
  }

  // Run health checks
  useEffect(() => {
    // Initial checks
    checkRPCHealth()
    checkWebSocketHealth()
    checkJitoHealth()
    checkSolanaHealth()

    // Set up interval for periodic checks (every 8 seconds)
    const interval = setInterval(() => {
      checkRPCHealth()
      checkWebSocketHealth()
      checkJitoHealth()
      checkSolanaHealth()
    }, 8000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    // Load settings from localStorage
    const loadSettings = () => {
      try {
        const storedKeys = localStorage.getItem('apiKeys')
        const storedPrefs = localStorage.getItem('preferences')

        if (storedKeys) {
          setApiKeys(JSON.parse(storedKeys))
        }

        if (storedPrefs) {
          setPreferences(JSON.parse(storedPrefs))
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const validateUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url)
      return (
        parsed.protocol === 'https:' ||
        parsed.protocol === 'http:' ||
        parsed.protocol === 'wss:' ||
        parsed.protocol === 'ws:'
      )
    } catch {
      return false
    }
  }

  const validateApiKey = (key: string): boolean => {
    // Basic validation: not empty and reasonable length
    return key.length > 10 && key.length < 100 && /^[a-zA-Z0-9-_]+$/.test(key)
  }

  const handleSaveApiKeys = async () => {
    // Validate required fields
    const errors: Record<string, string> = {}

    if (!apiKeys.heliusRpc || apiKeys.heliusRpc.trim() === '') {
      errors.heliusRpc = 'Helius RPC endpoint is required'
    } else if (!validateUrl(apiKeys.heliusRpc)) {
      errors.heliusRpc = 'Must be a valid URL'
    }

    if (!apiKeys.birdeyeApiKey || apiKeys.birdeyeApiKey.trim() === '') {
      errors.birdeyeApiKey = 'Birdeye API key is required'
    }

    // Check for errors
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      // Show toast for each error
      Object.values(errors).forEach((error) => toast.error(error))
      return
    }

    setSaving(true)
    try {
      // Validate API keys
      const validKeys: ApiKeys = {
        heliusRpc: apiKeys.heliusRpc,
        birdeyeApiKey: apiKeys.birdeyeApiKey,
      }

      // Add optional keys if valid
      if (apiKeys.pumpfunApiKey && validateApiKey(apiKeys.pumpfunApiKey)) {
        validKeys.pumpfunApiKey = apiKeys.pumpfunApiKey
      }

      if (apiKeys.twoCaptchaKey && validateApiKey(apiKeys.twoCaptchaKey)) {
        validKeys.twoCaptchaKey = apiKeys.twoCaptchaKey
      }
      if (apiKeys.headlessTimeout) {
        validKeys.headlessTimeout = apiKeys.headlessTimeout
      }

      // Save to localStorage
      localStorage.setItem('apiKeys', JSON.stringify(validKeys))

      // Update runtime environment
      if (validKeys.heliusRpc) {
        const w = window as any
        w.NEXT_PUBLIC_HELIUS_RPC = validKeys.heliusRpc
      }

      // TODO: Save to database via API
      // await fetch('/api/settings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ apiKeys: validKeys })
      // });

      toast.success('API keys saved successfully')
      setFormErrors({})
    } catch (error) {
      toast.error('Failed to save API keys')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      localStorage.setItem('preferences', JSON.stringify(preferences))
      toast.success('Preferences saved successfully')
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setPreferences({
      defaultSlippage: 5,
      defaultPriorityFee: 0.00001,
      autoRefreshInterval: 30,
      darkMode: true,
      soundNotifications: true,
    })
    toast.success('Reset to default settings')
  }

  const handleServiceClick = (service: 'rpc' | 'ws' | 'jito' | 'solana') => {
    setSelectedService(service)
    setDialogOpen(true)
  }

  const getHistoryData = () => {
    switch (selectedService) {
      case 'rpc':
        return rpcHistory
      case 'ws':
        return wsHistory
      case 'jito':
        return jitoHistory
      case 'solana':
        return solanaHistory
      default:
        return []
    }
  }

  const getServiceName = () => {
    switch (selectedService) {
      case 'rpc':
        return 'RPC'
      case 'ws':
        return 'WebSocket'
      case 'jito':
        return 'Jito Engine'
      case 'solana':
        return 'Solana Mainnet'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-aqua" />
          Settings
        </h1>

        {/* API Keys Section */}
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Keys
              </span>
              <div className="flex items-center gap-2">
                <Switch checked={showKeys} onCheckedChange={setShowKeys} />
                <span className="text-sm text-gray-400">
                  {showKeys ? 'Hide' : 'Show'} Keys
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Helius RPC Endpoint *</Label>
              <Input
                type={showKeys ? 'text' : 'password'}
                value={apiKeys.heliusRpc || ''}
                onChange={(e) => {
                  setApiKeys({ ...apiKeys, heliusRpc: e.target.value })
                  // Clear error when user starts typing
                  if (formErrors.heliusRpc) {
                    setFormErrors({ ...formErrors, heliusRpc: '' })
                  }
                }}
                onBlur={() => {
                  // Validate on blur
                  if (!apiKeys.heliusRpc || apiKeys.heliusRpc.trim() === '') {
                    setFormErrors({
                      ...formErrors,
                      heliusRpc: 'Helius RPC endpoint is required',
                    })
                  } else if (!validateUrl(apiKeys.heliusRpc)) {
                    setFormErrors({
                      ...formErrors,
                      heliusRpc: 'Must be a valid URL',
                    })
                  }
                }}
                placeholder="https://mainnet.helius-rpc.com/?api-key=..."
                className={`bg-black/50 border-aqua/30 font-mono text-sm ${
                  formErrors.heliusRpc ? 'border-red-500' : ''
                }`}
              />
              {formErrors.heliusRpc ? (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.heliusRpc}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">
                  Required for RPC connections. Get one at helius.xyz
                </p>
              )}
            </div>

            <div>
              <Label>Birdeye API Key *</Label>
              <Input
                type={showKeys ? 'text' : 'password'}
                value={apiKeys.birdeyeApiKey || ''}
                onChange={(e) => {
                  setApiKeys({ ...apiKeys, birdeyeApiKey: e.target.value })
                  if (formErrors.birdeyeApiKey) {
                    setFormErrors({ ...formErrors, birdeyeApiKey: '' })
                  }
                }}
                onBlur={() => {
                  if (
                    !apiKeys.birdeyeApiKey ||
                    apiKeys.birdeyeApiKey.trim() === ''
                  ) {
                    setFormErrors({
                      ...formErrors,
                      birdeyeApiKey: 'Birdeye API key is required',
                    })
                  }
                }}
                placeholder="Your Birdeye API key"
                className={`bg-black/50 border-aqua/30 font-mono text-sm ${
                  formErrors.birdeyeApiKey ? 'border-red-500' : ''
                }`}
              />
              {formErrors.birdeyeApiKey ? (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.birdeyeApiKey}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">
                  Required for token prices and market data
                </p>
              )}
            </div>

            <div>
              <Label>2Captcha API Key</Label>
              <Input
                type={showKeys ? 'text' : 'password'}
                value={apiKeys.twoCaptchaKey || ''}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, twoCaptchaKey: e.target.value })
                }
                placeholder="Your 2Captcha API key"
                className="bg-black/50 border-aqua/30 font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Optional - For solving captchas in GUI fallback
              </p>
            </div>

            <div>
              <Label>Pump.fun API Key</Label>
              <Input
                type={showKeys ? 'text' : 'password'}
                value={apiKeys.pumpfunApiKey || ''}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, pumpfunApiKey: e.target.value })
                }
                placeholder="Your Pump.fun API key"
                className="bg-black/50 border-aqua/30 font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Optional - For launching tokens on Pump.fun
              </p>
            </div>

            <div>
              <Label>2Captcha API Key</Label>
              <Input
                type={showKeys ? 'text' : 'password'}
                value={apiKeys.twoCaptchaKey || ''}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, twoCaptchaKey: e.target.value })
                }
                placeholder="Your 2Captcha API key"
                className="bg-black/50 border-aqua/30 font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Required for automatic captcha solving
              </p>
            </div>

            <div>
              <Label>Jupiter API Key</Label>
              <Input
                type={showKeys ? 'text' : 'password'}
                value={apiKeys.jupiterApiKey || ''}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, jupiterApiKey: e.target.value })
                }
                placeholder="Your Jupiter API key (optional)"
                className="bg-black/50 border-aqua/30 font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Optional for enhanced swap features
              </p>
            </div>

            <div>
              <Label>Headless Timeout (seconds)</Label>
              <Input
                type="number"
                value={apiKeys.headlessTimeout || 30}
                onChange={(e) =>
                  setApiKeys({
                    ...apiKeys,
                    headlessTimeout: parseInt(e.target.value) || 30,
                  })
                }
                placeholder="30"
                min="10"
                max="120"
                className="bg-black/50 border-aqua/30 font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Timeout for headless browser operations (10-120 seconds)
              </p>
            </div>

            <Button
              onClick={handleSaveApiKeys}
              disabled={
                saving ||
                !apiKeys.heliusRpc ||
                !apiKeys.birdeyeApiKey ||
                !!formErrors.heliusRpc ||
                !!formErrors.birdeyeApiKey
              }
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save API Keys
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Network Configuration */}
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Network Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Network</Label>
              <Select
                value={network === 'mainnet-beta' ? 'main-net' : 'dev-net'}
                onValueChange={(value: 'main-net' | 'dev-net') => {
                  const mappedValue =
                    value === 'main-net' ? 'mainnet-beta' : 'devnet'
                  setNetwork(mappedValue as 'mainnet-beta' | 'devnet')
                }}
              >
                <SelectTrigger className="bg-black/50 border-aqua/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main-net">Main Net</SelectItem>
                  <SelectItem value="dev-net">Dev Net</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>RPC URL</Label>
              <Input
                type="text"
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
                placeholder="https://api.mainnet-beta.solana.com"
                className="bg-black/50 border-aqua/30 font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Solana RPC endpoint URL
              </p>
            </div>

            <div>
              <Label>WebSocket URL</Label>
              <Input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="wss://api.mainnet-beta.solana.com"
                className="bg-black/50 border-aqua/30 font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Solana WebSocket endpoint URL
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Jito Bundle Service</Label>
                <p className="text-xs text-gray-400">
                  Enable Jito for MEV protection
                </p>
              </div>
              <Switch checked={jitoEnabled} onCheckedChange={setJitoEnabled} />
            </div>

            {jitoEnabled && (
              <>
                <div>
                  <Label>Jito Tip Amount (SOL)</Label>
                  <Input
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(parseFloat(e.target.value))}
                    step="0.0001"
                    min="0.0001"
                    max="0.1"
                    className="bg-black/50 border-aqua/30"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Tip amount for Jito bundles
                  </p>
                </div>

                <div>
                  <Label>Jito Tip (Lamports)</Label>
                  <Input
                    type="number"
                    value={apiKeys.jitoTipLamports || 5000}
                    onChange={(e) =>
                      setApiKeys({
                        ...apiKeys,
                        jitoTipLamports: parseInt(e.target.value) || 5000,
                      })
                    }
                    placeholder="5000"
                    min="0"
                    max="50000"
                    className="bg-black/50 border-aqua/30"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Jito tip in lamports (max 50,000 on free tier)
                  </p>
                </div>
              </>
            )}

            <div>
              <Label>Jupiter Fee (Basis Points)</Label>
              <Input
                type="number"
                value={apiKeys.jupiterFeeBps || 5}
                onChange={(e) =>
                  setApiKeys({
                    ...apiKeys,
                    jupiterFeeBps: parseInt(e.target.value) || 5,
                  })
                }
                placeholder="5"
                min="0"
                max="100"
                className="bg-black/50 border-aqua/30"
              />
              <p className="text-xs text-gray-400 mt-1">
                Jupiter swap fee in basis points (0-100)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Trading Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Default Slippage (%)</Label>
              <Input
                type="number"
                value={preferences.defaultSlippage}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    defaultSlippage: parseFloat(e.target.value),
                  })
                }
                step="0.5"
                min="0.1"
                max="50"
                className="bg-black/50 border-aqua/30"
              />
            </div>

            <div>
              <Label>Default Priority Fee (SOL)</Label>
              <Input
                type="number"
                value={preferences.defaultPriorityFee}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    defaultPriorityFee: parseFloat(e.target.value),
                  })
                }
                step="0.00001"
                min="0"
                max="0.1"
                className="bg-black/50 border-aqua/30"
              />
            </div>

            <div>
              <Label>Auto Refresh Interval (seconds)</Label>
              <Input
                type="number"
                value={preferences.autoRefreshInterval}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    autoRefreshInterval: parseInt(e.target.value),
                  })
                }
                step="5"
                min="10"
                max="300"
                className="bg-black/50 border-aqua/30"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Sound Notifications</Label>
                <p className="text-xs text-gray-400">
                  Play sounds for important events
                </p>
              </div>
              <Switch
                checked={preferences.soundNotifications}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    soundNotifications: checked,
                  })
                }
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSavePreferences}
                disabled={saving}
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
              >
                {saving ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>

              <Button onClick={resetToDefaults} variant="outline">
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hotkeys Section */}
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Hotkeys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                ['openSellMonitor', 'Open Sell Monitor'],
                ['fundGroup', 'Fund Group'],
                ['startBundle', 'Start Bundle'],
                ['exportCsv', 'Export CSV'],
                ['walletToggle', 'Wallet Connect/Disconnect'],
                ['commandPalette', 'Command Palette'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="grid grid-cols-3 items-center gap-3">
                <Label>{label}</Label>
                <Input
                  value={(hotkeyForm as any)[key]}
                  onChange={(e) =>
                    setHotkeyForm({ ...hotkeyForm, [key]: e.target.value })
                  }
                  placeholder="e.g. meta+e,ctrl+e"
                  className="col-span-2 bg-black/50 border-aqua/30 font-mono text-sm"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setHotkeys(hotkeyForm)
                  toast.success('Hotkeys updated')
                }}
              >
                Save Hotkeys
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const defaults = {
                    openSellMonitor: 'meta+e,ctrl+e',
                    fundGroup: 'g',
                    startBundle: 'b',
                    exportCsv: 'e',
                    walletToggle: 'w',
                    commandPalette: 'meta+k,ctrl+k',
                  }
                  setHotkeyForm(defaults)
                  setHotkeys(defaults)
                  toast.success('Hotkeys reset to defaults')
                }}
              >
                Reset Defaults
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Jito Tip Section */}
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" /> Jito Tip
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 items-center gap-3">
              <Label>Tip (Lamports)</Label>
              <Input
                type="number"
                value={jitoTipLamports}
                onChange={(e) =>
                  setSettings({
                    jitoTipLamports: parseInt(e.target.value || '0'),
                  })
                }
                min={0}
                max={50000}
                className="col-span-2 bg-black/50 border-aqua/30"
              />
            </div>
            <p className="text-xs text-gray-400">
              Max 50,000 lamports recommended on free tier. This affects bundle
              priority.
            </p>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-500">
                    Important Security Notes
                  </p>
                  <ul className="text-sm text-gray-300 mt-2 space-y-1">
                    <li>• API keys are stored locally in your browser</li>
                    <li>• Never share your API keys with anyone</li>
                    <li>• Private keys are encrypted with AES-256-GCM</li>
                    <li>• Always use strong passwords for wallet encryption</li>
                    <li>• Export wallets only when necessary</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Section */}
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SQLite Database</p>
                <p className="text-sm text-gray-400">
                  Located at: ./data/analytics.db
                </p>
              </div>
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                <Check className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>

            <p className="text-sm text-gray-400">
              The database stores execution logs, token launches, P/L records,
              and other analytics data. Run{' '}
              <code className="bg-black/50 px-2 py-1 rounded">
                npm run db:init
              </code>{' '}
              to initialize.
            </p>
          </CardContent>
        </Card>
        {/* Status Grid Section */}
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="grid grid-cols-2 gap-4">
                {/* RPC Status */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleServiceClick('rpc')}
                      className="bg-black/50 border border-aqua/30 rounded-lg p-4 cursor-pointer hover:border-aqua/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Activity className="w-5 h-5 text-aqua" />
                          <span className="font-medium">RPC</span>
                        </div>
                        <motion.div
                          className={`h-3 w-3 rounded-full ${
                            rpcHealth.connected ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          animate={{
                            boxShadow: rpcHealth.connected
                              ? [
                                  '0 0 0 0 rgba(34, 197, 94, 0.4)',
                                  '0 0 0 8px rgba(34, 197, 94, 0)',
                                ]
                              : [
                                  '0 0 0 0 rgba(239, 68, 68, 0.4)',
                                  '0 0 0 8px rgba(239, 68, 68, 0)',
                                ],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeOut',
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">Helius RPC</p>
                      <p className="text-xs text-gray-500">
                        {rpcHealth.connected
                          ? `RTT: ${rpcHealth.rtt}ms`
                          : 'Disconnected'}
                      </p>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p>
                        Status:{' '}
                        {rpcHealth.connected ? 'Connected' : 'Disconnected'}
                      </p>
                      {rpcHealth.connected && <p>RTT: {rpcHealth.rtt}ms</p>}
                      <p>
                        Last check:{' '}
                        {new Date(rpcHealth.lastCheck).toLocaleTimeString()}
                      </p>
                      <p className="mt-1 text-gray-400">Click for history</p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* WebSocket Status */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleServiceClick('ws')}
                      className="bg-black/50 border border-aqua/30 rounded-lg p-4 cursor-pointer hover:border-aqua/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Wifi className="w-5 h-5 text-aqua" />
                          <span className="font-medium">WebSocket</span>
                        </div>
                        <motion.div
                          className={`h-3 w-3 rounded-full ${
                            wsHealth.connected ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          animate={{
                            boxShadow: wsHealth.connected
                              ? [
                                  '0 0 0 0 rgba(34, 197, 94, 0.4)',
                                  '0 0 0 8px rgba(34, 197, 94, 0)',
                                ]
                              : [
                                  '0 0 0 0 rgba(239, 68, 68, 0.4)',
                                  '0 0 0 8px rgba(239, 68, 68, 0)',
                                ],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeOut',
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">Real-time Updates</p>
                      <p className="text-xs text-gray-500">
                        {wsHealth.connected
                          ? `RTT: ${wsHealth.rtt}ms`
                          : 'Disconnected'}
                      </p>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p>
                        Status:{' '}
                        {wsHealth.connected ? 'Connected' : 'Disconnected'}
                      </p>
                      {wsHealth.connected && <p>RTT: {wsHealth.rtt}ms</p>}
                      <p>
                        Last check:{' '}
                        {new Date(wsHealth.lastCheck).toLocaleTimeString()}
                      </p>
                      <p className="mt-1 text-gray-400">Click for history</p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Jito Status */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleServiceClick('jito')}
                      className="bg-black/50 border border-aqua/30 rounded-lg p-4 cursor-pointer hover:border-aqua/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-aqua" />
                          <span className="font-medium">Jito Engine</span>
                        </div>
                        <motion.div
                          className={`h-3 w-3 rounded-full ${
                            jitoHealth.connected ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          animate={{
                            boxShadow: jitoHealth.connected
                              ? [
                                  '0 0 0 0 rgba(34, 197, 94, 0.4)',
                                  '0 0 0 8px rgba(34, 197, 94, 0)',
                                ]
                              : [
                                  '0 0 0 0 rgba(239, 68, 68, 0.4)',
                                  '0 0 0 8px rgba(239, 68, 68, 0)',
                                ],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeOut',
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">Bundle Execution</p>
                      <p className="text-xs text-gray-500">
                        {jitoHealth.connected
                          ? `RTT: ${jitoHealth.rtt}ms`
                          : 'Disconnected'}
                      </p>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p>
                        Status:{' '}
                        {jitoHealth.connected ? 'Connected' : 'Disconnected'}
                      </p>
                      {jitoHealth.connected && <p>RTT: {jitoHealth.rtt}ms</p>}
                      <p>
                        Last check:{' '}
                        {new Date(jitoHealth.lastCheck).toLocaleTimeString()}
                      </p>
                      <p className="mt-1 text-gray-400">Click for history</p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Solana Mainnet Status */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleServiceClick('solana')}
                      className="bg-black/50 border border-aqua/30 rounded-lg p-4 cursor-pointer hover:border-aqua/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Server className="w-5 h-5 text-aqua" />
                          <span className="font-medium">Solana Mainnet</span>
                        </div>
                        <motion.div
                          className={`h-3 w-3 rounded-full ${
                            solanaHealth.connected
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}
                          animate={{
                            boxShadow: solanaHealth.connected
                              ? [
                                  '0 0 0 0 rgba(34, 197, 94, 0.4)',
                                  '0 0 0 8px rgba(34, 197, 94, 0)',
                                ]
                              : [
                                  '0 0 0 0 rgba(239, 68, 68, 0.4)',
                                  '0 0 0 8px rgba(239, 68, 68, 0)',
                                ],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeOut',
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">Network Status</p>
                      <p className="text-xs text-gray-500">
                        {slotHeight
                          ? `Slot: ${slotHeight.toLocaleString()}`
                          : 'Disconnected'}
                      </p>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p>
                        Status:{' '}
                        {solanaHealth.connected ? 'Connected' : 'Disconnected'}
                      </p>
                      {solanaHealth.connected && (
                        <p>RTT: {solanaHealth.rtt}ms</p>
                      )}
                      <p>
                        Last check:{' '}
                        {new Date(solanaHealth.lastCheck).toLocaleTimeString()}
                      </p>
                      <p className="mt-1 text-gray-400">Click for history</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
            <p className="text-xs text-gray-400 mt-4">
              Status updates every 8 seconds • Click any card to view history
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* History Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {getServiceName()} Connection History (30 min)
            </DialogTitle>
          </DialogHeader>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getHistoryData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                  stroke="#666"
                />
                <YAxis stroke="#666" />
                <Line
                  type="monotone"
                  dataKey="rtt"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-sm text-white/60">
            <span>
              Avg RTT:{' '}
              {getHistoryData().length > 0
                ? Math.round(
                    getHistoryData().reduce((acc, h) => acc + h.rtt, 0) /
                      getHistoryData().length,
                  )
                : 0}
              ms
            </span>
            <span>
              Uptime:{' '}
              {getHistoryData().length > 0
                ? Math.round(
                    (getHistoryData().filter((h) => h.connected).length /
                      getHistoryData().length) *
                      100,
                  )
                : 0}
              %
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

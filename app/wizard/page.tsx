'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
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
import {
  ArrowRight,
  ArrowLeft,
  Save,
  Play,
  Coins,
  Wallet,
  Zap,
  Settings2,
  Upload,
} from 'lucide-react'
import { useKeymakerStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { presetService, LaunchPreset } from '@/services/presetService'
import { Copy, FileJson } from 'lucide-react'

interface WizardData {
  // Token details
  tokenName: string
  tokenSymbol: string
  tokenSupply: number
  tokenPlatform: 'pump.fun' | 'raydium' | 'letsbonk.fun'
  tokenDescription?: string
  tokenImage?: string

  // Wallet configuration
  walletCount: number
  fundingAmount: number
  devAllocation?: number
  lpAllocation?: number

  // Bundle settings
  bundleSize: number
  buyAmount: number
  slippage: number
  tipAmount?: number
  priorityFee?: number

  // Execution settings
  autoSellEnabled: boolean
  sellDelay: number
  takeProfit: number
  stopLoss: number

  // Social links
  telegram?: string
  twitter?: string
  website?: string
}

const defaultWizardData: WizardData = {
  tokenName: '',
  tokenSymbol: '',
  tokenSupply: 1000000000,
  tokenPlatform: 'pump.fun',
  tokenDescription: '',
  tokenImage: '',
  walletCount: 10,
  fundingAmount: 0.1,
  devAllocation: 5,
  lpAllocation: 85,
  bundleSize: 5,
  buyAmount: 0.01,
  slippage: 5,
  tipAmount: 10000,
  priorityFee: 5000,
  autoSellEnabled: false,
  sellDelay: 300,
  takeProfit: 50,
  stopLoss: -20,
  telegram: '',
  twitter: '',
  website: '',
}

export default function LaunchWizard() {
  const router = useRouter()
  const { setTokenLaunchData } = useKeymakerStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [wizardData, setWizardData] = useState<WizardData>(defaultWizardData)
  const [presetName, setPresetName] = useState('')
  const [availablePresets, setAvailablePresets] = useState<
    { id: string; preset: LaunchPreset }[]
  >([])
  const [shareLink, setShareLink] = useState('')

  const steps = [
    {
      title: 'Token Details',
      icon: Coins,
      description: 'Configure your token parameters',
    },
    {
      title: 'Wallet Setup',
      icon: Wallet,
      description: 'Set up your trading wallets',
    },
    {
      title: 'Bundle Config',
      icon: Zap,
      description: 'Configure bundle execution',
    },
    {
      title: 'Trading Settings',
      icon: Settings2,
      description: 'Set up automated trading',
    },
  ]

  useEffect(() => {
    loadPresets()
  }, [])

  const loadPresets = async () => {
    try {
      const presets = await presetService.listPresets()
      setAvailablePresets(presets)
    } catch (error) {
      console.error('Failed to load presets:', error)
    }
  }

  const savePreset = async () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name')
      return
    }

    try {
      const preset: LaunchPreset = {
        name: presetName,
        timestamp: Date.now(),
        config: {
          tokenName: wizardData.tokenName,
          tokenSymbol: wizardData.tokenSymbol,
          tokenDescription: wizardData.tokenDescription || '',
          tokenImage: wizardData.tokenImage,
          platform: wizardData.tokenPlatform,
          totalSupply: wizardData.tokenSupply,
          decimals: 9,
          bundleSize: wizardData.bundleSize,
          tipAmount: wizardData.tipAmount || 10000,
          priorityFee: wizardData.priorityFee || 5000,
          autoSellDelay: wizardData.sellDelay,
          devAllocation: wizardData.devAllocation || 5,
          lpAllocation: wizardData.lpAllocation || 85,
          buyAmounts: {
            min: wizardData.buyAmount * 0.8,
            max: wizardData.buyAmount * 1.2,
          },
          telegram: wizardData.telegram,
          twitter: wizardData.twitter,
          website: wizardData.website,
        },
      }

      const presetId = await presetService.savePreset(preset)
      const link = presetService.generateShareLink(presetId, preset)
      setShareLink(link)

      toast.success(`Preset "${presetName}" saved successfully`)
      setPresetName('')
      loadPresets()
    } catch (error) {
      toast.error('Failed to save preset')
    }
  }

  const loadPreset = async (presetId: string) => {
    try {
      const preset = await presetService.loadPreset(presetId)
      if (preset) {
        setWizardData({
          tokenName: preset.config.tokenName,
          tokenSymbol: preset.config.tokenSymbol,
          tokenSupply: preset.config.totalSupply,
          tokenPlatform: preset.config.platform as
            | 'pump.fun'
            | 'letsbonk.fun'
            | 'raydium',
          tokenDescription: preset.config.tokenDescription,
          tokenImage: preset.config.tokenImage,
          walletCount: wizardData.walletCount, // Keep current wallet settings
          fundingAmount: wizardData.fundingAmount,
          devAllocation: preset.config.devAllocation,
          lpAllocation: preset.config.lpAllocation,
          bundleSize: preset.config.bundleSize,
          buyAmount:
            (preset.config.buyAmounts.min + preset.config.buyAmounts.max) / 2,
          slippage: wizardData.slippage,
          tipAmount: preset.config.tipAmount,
          priorityFee: preset.config.priorityFee,
          autoSellEnabled: preset.config.autoSellDelay > 0,
          sellDelay: preset.config.autoSellDelay,
          takeProfit: wizardData.takeProfit,
          stopLoss: wizardData.stopLoss,
          telegram: preset.config.telegram,
          twitter: preset.config.twitter,
          website: preset.config.website,
        })
        toast.success(`Preset "${preset.name}" loaded`)
      }
    } catch (error) {
      toast.error('Failed to load preset')
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    toast.success('Share link copied to clipboard!')
  }

  const importFromLink = async () => {
    const link = prompt('Paste the preset share link:')
    if (!link) return

    const parsed = presetService.parseShareLink(link)
    if (parsed) {
      await presetService.savePreset(parsed.preset)
      await loadPreset(parsed.id)
      loadPresets()
    } else {
      toast.error('Invalid preset link')
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleLaunch = async () => {
    // Validate all required fields
    if (!wizardData.tokenName || !wizardData.tokenSymbol) {
      toast.error('Please fill in all token details')
      return
    }

    // Set up the launch configuration in the global store
    setTokenLaunchData({
      name: wizardData.tokenName,
      symbol: wizardData.tokenSymbol,
      decimals: 9,
      supply: wizardData.tokenSupply,
      platform: wizardData.tokenPlatform,
      lpAmount: wizardData.fundingAmount,
      walletPublicKey: '', // Will be set during execution
    })

    toast.success('Launch configuration ready!')
    router.push('/bundle')
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Token Details
        return (
          <div className="space-y-4">
            <div>
              <Label>Token Name</Label>
              <Input
                value={wizardData.tokenName}
                onChange={(e) =>
                  setWizardData({ ...wizardData, tokenName: e.target.value })
                }
                placeholder="My Awesome Token"
                maxLength={32}
              />
            </div>

            <div>
              <Label>Token Symbol</Label>
              <Input
                value={wizardData.tokenSymbol}
                onChange={(e) =>
                  setWizardData({
                    ...wizardData,
                    tokenSymbol: e.target.value.toUpperCase(),
                  })
                }
                placeholder="MAT"
                maxLength={10}
              />
            </div>

            <div>
              <Label>Total Supply</Label>
              <Input
                type="number"
                value={wizardData.tokenSupply}
                onChange={(e) =>
                  setWizardData({
                    ...wizardData,
                    tokenSupply: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="1000000000"
              />
            </div>

            <div>
              <Label>Launch Platform</Label>
              <Select
                value={wizardData.tokenPlatform}
                onValueChange={(value: string) =>
                  setWizardData({
                    ...wizardData,
                    tokenPlatform: value as
                      | 'pump.fun'
                      | 'letsbonk.fun'
                      | 'raydium',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pump.fun">Pump.fun</SelectItem>
                  <SelectItem value="raydium">Raydium</SelectItem>
                  <SelectItem value="letsbonk.fun">LetsBonk.fun</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 1: // Wallet Setup
        return (
          <div className="space-y-4">
            <div>
              <Label>Number of Wallets</Label>
              <Input
                type="number"
                value={wizardData.walletCount}
                onChange={(e) =>
                  setWizardData({
                    ...wizardData,
                    walletCount: parseInt(e.target.value) || 1,
                  })
                }
                min={1}
                max={50}
              />
              <p className="text-xs text-gray-400 mt-1">
                How many wallets to use for trading
              </p>
            </div>

            <div>
              <Label>Funding Amount per Wallet (SOL)</Label>
              <Input
                type="number"
                value={wizardData.fundingAmount}
                onChange={(e) =>
                  setWizardData({
                    ...wizardData,
                    fundingAmount: parseFloat(e.target.value) || 0,
                  })
                }
                step={0.01}
                min={0.01}
              />
              <p className="text-xs text-gray-400 mt-1">
                Total funding:{' '}
                {(wizardData.walletCount * wizardData.fundingAmount).toFixed(2)}{' '}
                SOL
              </p>
            </div>
          </div>
        )

      case 2: // Bundle Config
        return (
          <div className="space-y-4">
            <div>
              <Label>Bundle Size</Label>
              <Input
                type="number"
                value={wizardData.bundleSize}
                onChange={(e) =>
                  setWizardData({
                    ...wizardData,
                    bundleSize: parseInt(e.target.value) || 1,
                  })
                }
                min={1}
                max={20}
              />
              <p className="text-xs text-gray-400 mt-1">
                Transactions per bundle
              </p>
            </div>

            <div>
              <Label>Buy Amount per Wallet (SOL)</Label>
              <Input
                type="number"
                value={wizardData.buyAmount}
                onChange={(e) =>
                  setWizardData({
                    ...wizardData,
                    buyAmount: parseFloat(e.target.value) || 0,
                  })
                }
                step={0.001}
                min={0.001}
              />
            </div>

            <div>
              <Label>Slippage Tolerance (%)</Label>
              <Input
                type="number"
                value={wizardData.slippage}
                onChange={(e) =>
                  setWizardData({
                    ...wizardData,
                    slippage: parseFloat(e.target.value) || 0,
                  })
                }
                step={0.5}
                min={0.1}
                max={50}
              />
            </div>
          </div>
        )

      case 3: // Trading Settings
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Auto-Sell</Label>
              <input
                type="checkbox"
                checked={wizardData.autoSellEnabled}
                onChange={(e) =>
                  setWizardData({
                    ...wizardData,
                    autoSellEnabled: e.target.checked,
                  })
                }
                className="toggle"
              />
            </div>

            {wizardData.autoSellEnabled && (
              <>
                <div>
                  <Label>Sell Delay (seconds)</Label>
                  <Input
                    type="number"
                    value={wizardData.sellDelay}
                    onChange={(e) =>
                      setWizardData({
                        ...wizardData,
                        sellDelay: parseInt(e.target.value) || 0,
                      })
                    }
                    min={0}
                  />
                </div>

                <div>
                  <Label>Take Profit (%)</Label>
                  <Input
                    type="number"
                    value={wizardData.takeProfit}
                    onChange={(e) =>
                      setWizardData({
                        ...wizardData,
                        takeProfit: parseFloat(e.target.value) || 0,
                      })
                    }
                    step={5}
                  />
                </div>

                <div>
                  <Label>Stop Loss (%)</Label>
                  <Input
                    type="number"
                    value={wizardData.stopLoss}
                    onChange={(e) =>
                      setWizardData({
                        ...wizardData,
                        stopLoss: parseFloat(e.target.value) || 0,
                      })
                    }
                    step={5}
                  />
                </div>
              </>
            )}
          </div>
        )
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-8">Launch Wizard</h1>

        {/* Preset Controls */}
        <Card className="mb-6 bg-black/40 backdrop-blur-xl border-aqua/20">
          <CardHeader>
            <CardTitle className="text-lg">Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4 flex-wrap">
              {availablePresets.map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset(item.id)}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {item.preset.name}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={importFromLink}>
                <FileJson className="w-4 h-4 mr-1" />
                Import from Link
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Enter preset name"
                className="flex-1"
              />
              <Button onClick={savePreset} size="sm">
                <Save className="w-4 h-4 mr-1" />
                Save Preset
              </Button>
              {shareLink && (
                <Button onClick={copyShareLink} size="sm" variant="outline">
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Link
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    index <= currentStep
                      ? 'bg-aqua text-black'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStep ? 'bg-aqua' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6 bg-black/40 backdrop-blur-xl border-aqua/20">
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
            <div className="text-sm text-muted-foreground">
              {steps[currentStep].description}
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleLaunch}
              className="bg-gradient-to-r from-green-500 to-emerald-500"
            >
              <Play className="w-4 h-4 mr-2" />
              Launch Strategy
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

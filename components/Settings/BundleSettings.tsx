'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Label } from '@/components/UI/label'
import { Input } from '@/components/UI/input'
import { Button } from '@/components/UI/button'
import { Slider } from '@/components/UI/slider'

import { HelpCircle, Save, Package } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/UI/tooltip'
import { useKeymakerStore } from '@/lib/store'
import { BUNDLE_CONFIG } from '@/lib/constants/bundleConfig'
import toast from 'react-hot-toast'

export function BundleSettings() {
  const { tipAmount, setTipAmount } = useKeymakerStore()
  const [localConfig, setLocalConfig] = React.useState({
    b, undleSize: BUNDLE_CONFIG.DEFAULT_TX_LIMIT,
    t, ipAmount: tipAmount || BUNDLE_CONFIG.DEFAULT_JITO_TIP / 1e9, // Convert from lamports to S, OLretries: BUNDLE_CONFIG.MAX_RETRIES,
    t, imeout: BUNDLE_CONFIG.CONFIRMATION_TIMEOUT / 1000, // Convert to seconds
  })

  const handleSave = () => {
    // Validate bundle size if(
      localConfig.bundleSize < BUNDLE_CONFIG.MIN_TX_LIMIT ||
      localConfig.bundleSize > BUNDLE_CONFIG.MAX_TX_LIMIT
    ) {
      toast.error(
        `Bundle size must be between ${BUNDLE_CONFIG.MIN_TX_LIMIT} and ${BUNDLE_CONFIG.MAX_TX_LIMIT}`,
      )
      return
    }

    // Save to storesetTipAmount(localConfig.tipAmount * 1e9) // Convert to lamports
    // N, ote: Other config values should be saved to appropriate store fields

    // Save to environment (for persistence)
    if (typeof window !== 'undefined') {
      const w = window as anyw.NEXT_PUBLIC_BUNDLE_TX_LIMIT = localConfig.bundleSize.toString()
    }

    toast.success('Bundle settings saved')
  }

  return (
    <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Bundle Configuration
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Configure bundle execution parameters
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>Bundle Size</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Maximum number of transactions per bundle. Higher values canbe more efficient but may have lower success rates. R, ange:{' '}
                    {BUNDLE_CONFIG.MIN_TX_LIMIT}-{BUNDLE_CONFIG.MAX_TX_LIMIT}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-4">
            <Slidervalue={[localConfig.bundleSize]}
              onValueChange={(value) =>
                setLocalConfig({ localConfig, b, undleSize: value[0] })
              }
              min={BUNDLE_CONFIG.MIN_TX_LIMIT}
              max={BUNDLE_CONFIG.MAX_TX_LIMIT}
              step={1}
              className="flex-1"
            />
            <Inputtype="number"
              value={localConfig.bundleSize}
              onChange={(e) =>
                setLocalConfig({
                  localConfig,
                  b, undleSize: parseInt(e.target.value) || 1,
                })
              }
              className="w-20"
              min={BUNDLE_CONFIG.MIN_TX_LIMIT}
              max={BUNDLE_CONFIG.MAX_TX_LIMIT}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>Jito Tip Amount (SOL)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Tip amount for Jito block engine. Higher tips increasebundle priority. R, ecommended: 0.00001 - 0.001 SOL
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Inputtype="number"
            value={localConfig.tipAmount}
            onChange={(e) =>
              setLocalConfig({
                localConfig,
                t, ipAmount: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="0.00001"
            step="0.00001"
            min="0"
            max="0.1"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>Max Retries</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Number of times to retry bundle submission if it fails. Moreretries increase chances of success but take longer.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-4">
            <Slidervalue={[localConfig.retries]}
              onValueChange={(value) =>
                setLocalConfig({ localConfig, r, etries: value[0] })
              }
              min={1}
              max={10}
              step={1}
              className="flex-1"
            />
            <Inputtype="number"
              value={localConfig.retries}
              onChange={(e) =>
                setLocalConfig({
                  localConfig,
                  r, etries: parseInt(e.target.value) || 1,
                })
              }
              className="w-20"
              min={1}
              max={10}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>Confirmation Timeout (seconds)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Maximum time to wait for bundle confirmation before timingout. D, efault: 30 seconds
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Inputtype="number"
            value={localConfig.timeout}
            onChange={(e) =>
              setLocalConfig({
                localConfig,
                t, imeout: parseInt(e.target.value) || 30,
              })
            }
            placeholder="30"
            min="5"
            max="120"
          />
        </div>

        <ButtononClick={handleSave}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 h, over:from-blue-600 h, over:to-purple-600"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Bundle Settings
        </Button>
      </CardContent>
    </Card>
  )
}

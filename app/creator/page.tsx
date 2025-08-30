'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { Badge } from '@/components/UI/badge'
import {
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

type CreationStatus = 'idle' | 'creating' | 'success' | 'error'

export default function CreatorPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [decimals, setDecimals] = useState('9')
  const [supply, setSupply] = useState('1000000000')
  const [status, setStatus] = useState<CreationStatus>('idle')
  const [createdToken, setCreatedToken] = useState<{
    address: string
    slot: number
  } | null>(null)

  const isValidForm = name.trim() && symbol.trim() && decimals && supply

  const onCreate = async () => {
    if (!isValidForm) {
      toast.error('Please fill in all required fields')
      return
    }

    setStatus('creating')
    try {
      // Mock API call - in real app, this would create the SPL token
      await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate API call

      const mockTokenAddress = `Token${Date.now().toString().slice(-8)}`
      const mockSlot = Math.floor(Math.random() * 1000000) + 200000000

      setCreatedToken({
        address: mockTokenAddress,
        slot: mockSlot
      })
      setStatus('success')

      toast.success(`Token ${symbol} created successfully!`)

    } catch (error) {
      setStatus('error')
      toast.error('Token creation failed')
    }
  }

  const resetForm = () => {
    setName('')
    setSymbol('')
    setDecimals('9')
    setSupply('1000000000')
    setStatus('idle')
    setCreatedToken(null)
  }

  if (status === 'success' && createdToken) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
            <CardTitle className="text-2xl">Token Created Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold text-primary">
                {name} ({symbol})
              </div>
              <div className="text-sm text-muted-foreground">
                Address: {createdToken.address}
              </div>
              <div className="text-sm text-muted-foreground">
                Created at slot: {createdToken.slot.toLocaleString()}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Badge variant="outline" className="text-xs">
                  Decimals: {decimals}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Supply: {parseInt(supply).toLocaleString()}
                </Badge>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/bundle')}
                className="flex-1 h-12"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Start Bundling
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="flex-1 h-12"
              >
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Sparkles className="h-8 w-8" />
          SPL Token Creator
        </h1>
        <p className="text-muted-foreground mt-2">
          Create and launch your SPL token on Solana
        </p>
      </div>

      {/* Creation Form */}
      <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle>Token Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Token Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Amazing Token"
                disabled={status === 'creating'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">Token Symbol *</Label>
              <Input
                id="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="MAT"
                maxLength={10}
                disabled={status === 'creating'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="decimals">Decimals</Label>
              <Input
                id="decimals"
                type="number"
                value={decimals}
                onChange={(e) => setDecimals(e.target.value)}
                placeholder="9"
                min="0"
                max="9"
                disabled={status === 'creating'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supply">Total Supply</Label>
              <Input
                id="supply"
                type="number"
                value={supply}
                onChange={(e) => setSupply(e.target.value)}
                placeholder="1000000000"
                disabled={status === 'creating'}
              />
            </div>
          </div>

          {/* Status Messages */}
          {status === 'error' && (
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-400">Token creation failed. Please try again.</span>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={onCreate}
            disabled={!isValidForm || status === 'creating'}
            className="w-full h-12 text-base"
          >
            {status === 'creating' ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating Token...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Create Token
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Note:</strong> Token creation will be followed by an automatic single-transaction confirmation.</p>
            <p>After creation, you can proceed to bundle transactions or perform additional operations with your new token.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
// Legacy duplicate content removed

'use client'
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/UI/card'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { Button } from '@/components/UI/button'
import { Badge } from '@/components/UI/badge'
import { MarketCapCard } from '@/components/Dashboard/MarketCapCard'
import {
  CheckCircle,
  ExternalLink,
  TrendingUp,
  Copy,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

type Platform = 'pump' | 'bonk' | 'spl'
type Mode = 'regular' | 'instant' | 'delayed'

interface CreatedToken {
  mint: string
  name: string
  symbol: string
  platform: Platform
  createdAt: string
}

export default function CreatorPage() {
  const { connected } = useWallet()
  const [platform, setPlatform] = useState<Platform>('pump')
  const [mode, setMode] = useState<Mode>('regular')
  const [delay, setDelay] = useState(0)
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [decimals, setDecimals] = useState(9)
  const [supply, setSupply] = useState(1_000_000_000)
  const [image, setImage] = useState('')
  const [createdToken, setCreatedToken] = useState<CreatedToken | null>(null)
  const [creating, setCreating] = useState(false)

  const hideDecimalsSupply = platform !== 'spl'

  async function onCreate() {
    if (!connected) return toast.error('Connect a wallet')
    if (!name || !symbol) return toast.error('Name and symbol required')

    setCreating(true)
    try {
      const metadata = { image }
      let resp: Response
      if (platform === 'pump') {
        resp = await fetch('/api/pumpfun/launch', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name, symbol, metadata, mode, delay_seconds: delay }),
        })
      } else if (platform === 'bonk') {
        resp = await fetch('/api/letsbonk/launch', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name, symbol, metadata, mode, delay_seconds: delay }),
        })
      } else {
        resp = await fetch('/api/tokens', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name, symbol, decimals, supply, metadata, mode, delay_seconds: delay }),
        })
      }
      const j = await resp.json()
      if (!resp.ok) throw new Error(j?.error || 'Create failed')

      const newToken: CreatedToken = {
        mint: j.mint,
        name,
        symbol,
        platform,
        createdAt: new Date().toISOString()
      }
      setCreatedToken(newToken)
      toast.success(`Token created successfully!`)
    } catch (e:any) {
      toast.error(e.message || 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  function resetForm() {
    setName('')
    setSymbol('')
    setImage('')
    setCreatedToken(null)
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  // Show success state with market cap
  if (createdToken) {
    return (
      <div className="space-y-6">
        {/* Success Header */}
        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
            <CardTitle className="text-2xl">Token Created Successfully!</CardTitle>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="outline">{createdToken.platform}</Badge>
              <Badge variant="secondary">
                {new Date(createdToken.createdAt).toLocaleString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold text-primary">
                {createdToken.name} ({createdToken.symbol})
              </div>
              <div className="flex items-center justify-center gap-2">
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {createdToken.mint}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(createdToken.mint)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Action Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => window.open(`https://solscan.io/token/${createdToken.mint}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                View on Solscan
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => window.open(`https://dexscreener.com/solana/${createdToken.mint}`, '_blank')}
              >
                <TrendingUp className="h-4 w-4" />
                Chart on DexScreener
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => window.open(`https://birdeye.so/token/${createdToken.mint}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                View on Birdeye
              </Button>
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={resetForm} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Market Cap */}
        <MarketCapCard
          mintAddress={createdToken.mint}
          tokenName={createdToken.name}
          tokenSymbol={createdToken.symbol}
        />
      </div>
    )
  }

  // Show creation form
  return (
    <Card>
      <CardHeader><CardTitle>Create Token</CardTitle></CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Platform</Label>
          <select className="w-full rounded-md border bg-background p-2" value={platform} onChange={e=>setPlatform(e.target.value as Platform)}>
            <option value="pump">Pump.fun</option>
            <option value="bonk">LetsBonk</option>
            <option value="spl">SPL (manual)</option>
          </select>
        </div>

        <div><Label>Name</Label><Input value={name} onChange={e=>setName(e.target.value)} /></div>
        <div><Label>Symbol</Label><Input value={symbol} onChange={e=>setSymbol(e.target.value)} /></div>

        {!hideDecimalsSupply && (
          <>
            <div><Label>Decimals</Label><Input type="number" value={decimals} onChange={e=>setDecimals(Number(e.target.value||0))} /></div>
            <div><Label>Total Supply</Label><Input type="number" value={supply} onChange={e=>setSupply(Number(e.target.value||0))} /></div>
          </>
        )}

        <div><Label>Mode</Label>
          <select className="w-full rounded-md border bg-background p-2" value={mode} onChange={e=>setMode(e.target.value as Mode)}>
            <option value="regular">Regular</option>
            <option value="instant">Instant</option>
            <option value="delayed">Delayed</option>
          </select>
        </div>
        <div><Label>Delay (seconds, for delayed)</Label><Input type="number" value={delay} onChange={e=>setDelay(Number(e.target.value||0))} /></div>

        <div className="md:col-span-2"><Label>Image URL</Label><Input value={image} onChange={e=>setImage(e.target.value)} /></div>
        <div className="md:col-span-2">
          <Button onClick={onCreate} disabled={creating || !connected}>
            {creating ? 'Creating...' : 'Create Token'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

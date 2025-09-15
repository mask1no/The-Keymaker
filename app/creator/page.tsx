'use client'
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/UI/Card'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { Button } from '@/components/UI/button'
import toast from 'react-hot-toast'

type Platform = 'pump' | 'bonk' | 'spl'
type Mode = 'regular' | 'instant' | 'delayed'

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

  const hideSupply = platform !== 'spl'

  async function onCreate() {
    if (!connected) return toast.error('Connect a wallet')
    if (!name || !symbol) return toast.error('Name & symbol required')
    try {
      const metadata = { image }
      let url = ''
      let body: any = { name, symbol, metadata, mode, delay_seconds: delay }
      if (platform === 'pump') url = '/api/pumpfun/launch'
      else if (platform === 'bonk') url = '/api/letsbonk/launch'
      else {
        url = '/api/tokens'
        body = { ...body, decimals, supply }
      }

      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'Create failed')
      toast.success(`Mint: ${j.mint}`)
    } catch (e: any) {
      toast.error(e.message || 'Create failed')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Token</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Platform</Label>
          <select
            className="w-full rounded-md border bg-background p-2"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
          >
            <option value="pump">Pump.fun</option>
            <option value="bonk">LetsBonk</option>
            <option value="spl">SPL (manual)</option>
          </select>
        </div>
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Symbol</Label>
          <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        </div>
        {!hideSupply && (
          <>
            <div>
              <Label>Decimals</Label>
              <Input
                type="number"
                value={decimals}
                onChange={(e) => setDecimals(Number(e.target.value || 0))}
              />
            </div>
            <div>
              <Label>Total Supply</Label>
              <Input
                type="number"
                value={supply}
                onChange={(e) => setSupply(Number(e.target.value || 0))}
              />
            </div>
          </>
        )}
        <div>
          <Label>Mode</Label>
          <select
            className="w-full rounded-md border bg-background p-2"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
          >
            <option value="regular">Regular</option>
            <option value="instant">Instant</option>
            <option value="delayed">Delayed</option>
          </select>
        </div>
        <div>
          <Label>Delay (seconds when delayed)</Label>
          <Input
            type="number"
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value || 0))}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Image URL</Label>
          <Input value={image} onChange={(e) => setImage(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Button onClick={onCreate}>Create</Button>
        </div>
      </CardContent>
    </Card>
  )
}

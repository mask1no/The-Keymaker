'use client'
import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Input } from '@/components/UI/input'
import { Button } from '@/components/UI/button'
import { Label } from '@/components/UI/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/UI/card'
import toast from 'react-hot-toast'

type Platform = 'pump' | 'bonk' | 'spl'
type Mode = 'regular' | 'instant' | 'delayed'

export default function TokenForm() {
  const { connected } = useWallet()
  const [platform, setPlatform] = useState<Platform>('pump')
  const [mode, setMode] = useState<Mode>('regular')
  const [delay, setDelay] = useState(0)

  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [decimals, setDecimals] = useState(9)
  const [supply, setSupply] = useState(1_000_000_000)

  // metadata
  const [image, setImage] = useState('')
  const [website, setWebsite] = useState('')
  const [twitter, setTwitter] = useState('')
  const [telegram, setTelegram] = useState('')
  const [desc, setDesc] = useState('')

  const hideDecimalsSupply = platform !== 'spl'

  async function onSubmit() {
    if (!connected) return toast.error('Connect a wallet')
    if (!name || !symbol) return toast.error('Name & symbol required')

    const metadata = { image, description: desc, website, twitter, telegram }
    const body: any = { name, symbol, metadata, mode, delay_seconds: delay }
    let url = ''
    if (platform === 'pump') url = '/api/pumpfun/launch'
    else if (platform === 'bonk') url = '/api/letsbonk/launch'
    else {
      url = '/api/tokens'
      Object.assign(body, { decimals, supply })
    }

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    const j = await r.json()
    if (!r.ok) return toast.error(j?.error || 'Create failed')
    toast.success(`Mint: ${j.mint || j.tokenAddress || 'created'}`)
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
            <option value="spl">SPL (Radium deploy)</option>
          </select>
        </div>
        <div>
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={32}
          />
        </div>
        <div>
          <Label>Symbol</Label>
          <Input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            maxLength={10}
          />
        </div>

        {!hideDecimalsSupply && (
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
        {mode === 'delayed' && (
          <div>
            <Label>Delay (seconds)</Label>
            <Input
              type="number"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value || 0))}
            />
          </div>
        )}

        <div className="md:col-span-2">
          <Label>Image URL</Label>
          <Input value={image} onChange={(e) => setImage(e.target.value)} />
        </div>
        <div>
          <Label>Website</Label>
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <div>
          <Label>Twitter</Label>
          <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} />
        </div>
        <div>
          <Label>Telegram</Label>
          <Input
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Description</Label>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <Button onClick={onSubmit}>Create</Button>
        </div>
      </CardContent>
    </Card>
  )
}

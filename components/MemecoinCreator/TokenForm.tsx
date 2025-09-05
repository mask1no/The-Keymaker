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
  const [decimals, setDecimals] = useState<number>(9)
  const [supply, setSupply] = useState<number>(1_000_000_000)
  const [image, setImage] = useState('')
  const [website, setWebsite] = useState('')
  const [telegram, setTelegram] = useState('')
  const [twitter, setTwitter] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [enableBundling, setEnableBundling] = useState(false)
  const [buyAmount, setBuyAmount] = useState<number>(0.1) // SOL amount for initial buy
  const hideDecimalsSupply = platform !== 'spl'


  async function onSubmit() {
    if (!connected) return toast.error('Connect a wallet first.')
    if (!name || !symbol) return toast.error('Name and symbol required.')
    if (enableBundling && buyAmount <= 0) return toast.error('Buy amount must be greater than 0')

    try {
      setSubmitting(true)
      const tokenMetadata = { image, website, telegram, twitter }

      // Prepare bundling parameters
      const bundlingParams = enableBundling ? {
        enableBundling: true,
        buyAmount,
        mode,
        delay_seconds: delay
      } : {
        enableBundling: false,
        mode,
        delay_seconds: delay
      }

      if (platform === 'pump') {
        const resp = await fetch('/api/pumpfun/launch', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name, symbol, metadata: tokenMetadata, ...bundlingParams }),
        })
        const j = await resp.json(); if (!resp.ok) throw new Error(j?.error || 'Pump launch failed')
        toast.success(`Pump.fun mint: ${j.mint}${enableBundling ? ' (bundling initiated)' : ''}`)
      } else if (platform === 'bonk') {
        const resp = await fetch('/api/letsbonk/launch', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name, symbol, metadata: tokenMetadata, ...bundlingParams }),
        })
        const j = await resp.json(); if (!resp.ok) throw new Error(j?.error || 'Bonk launch failed')
        toast.success(`LetsBonk mint: ${j.mint}${enableBundling ? ' (bundling initiated)' : ''}`)
      } else {
        const resp = await fetch('/api/tokens', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name, symbol, decimals, supply, metadata: tokenMetadata, ...bundlingParams }),
        })
        const j = await resp.json(); if (!resp.ok) throw new Error(j?.error || 'SPL launch failed')
        toast.success(`SPL mint: ${j.mint}${enableBundling ? ' (bundling initiated)' : ''}`)
      }
    } catch (e:any) {
      toast.error(e.message || 'Create failed')
    } finally { setSubmitting(false) }
  }


  return (
    <Card>
      <CardHeader><CardTitle>Create Token</CardTitle></CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Platform</Label>
          <select className="w-full rounded-md border bg-background p-2"
            value={platform} onChange={(e)=>setPlatform(e.target.value as Platform)}>
            <option value="pump">Pump.fun</option>
            <option value="bonk">LetsBonk</option>
            <option value="spl">SPL (manual)</option>
          </select>
        </div>

        <div>
          <Label>Name</Label>
          <Input value={name} onChange={e=>setName(e.target.value)} maxLength={32} />
        </div>
        <div>
          <Label>Symbol</Label>
          <Input value={symbol} onChange={e=>setSymbol(e.target.value)} maxLength={10} />
        </div>

        {!hideDecimalsSupply && (
          <>
            <div>
              <Label>Decimals</Label>
              <Input type="number" value={decimals} onChange={e=>setDecimals(Number(e.target.value||0))} />
            </div>
            <div>
              <Label>Total Supply</Label>
              <Input type="number" value={supply} onChange={e=>setSupply(Number(e.target.value||0))} />
            </div>
          </>
        )}

        <div>
          <Label>Mode</Label>
          <select className="w-full rounded-md border bg-background p-2"
            value={mode} onChange={e=>setMode(e.target.value as Mode)}>
            <option value="regular">Regular</option>
            <option value="instant">Instant</option>
            <option value="delayed">Delayed</option>
          </select>
        </div>
        <div>
          <Label>Delay (seconds, when delayed)</Label>
          <Input type="number" value={delay} onChange={e=>setDelay(Number(e.target.value||0))} />
        </div>

        <div><Label>Image URL</Label><Input value={image} onChange={e=>setImage(e.target.value)} /></div>
        <div><Label>Website</Label><Input value={website} onChange={e=>setWebsite(e.target.value)} /></div>
        <div><Label>Telegram</Label><Input value={telegram} onChange={e=>setTelegram(e.target.value)} /></div>
        <div><Label>Twitter/X</Label><Input value={twitter} onChange={e=>setTwitter(e.target.value)} /></div>

        <div className="md:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="enableBundling"
              checked={enableBundling}
              onChange={(e) => setEnableBundling(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="enableBundling">Enable automatic bundling (create & buy)</Label>
          </div>

          {enableBundling && (
            <div className="mb-4">
              <Label>Initial Buy Amount (SOL)</Label>
              <Input
                type="number"
                step="0.01"
                value={buyAmount}
                onChange={(e) => setBuyAmount(Number(e.target.value) || 0)}
                placeholder="0.1"
                min="0.01"
                className="mt-1"
              />
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <Button disabled={submitting} onClick={onSubmit}>
            {submitting ? 'Creating…' : enableBundling ? 'Create & Bundle' : 'Create'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

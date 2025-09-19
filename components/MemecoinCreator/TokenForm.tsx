'use client'
import React, { useState } from 'react'
import { useWal let } from '@solana/wal let - adapter-react'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import toast from 'react - hot-toast' type Platform = 'pump' | 'bonk' | 'spl'
type Mode = 'regular' | 'instant' | 'delayed' export default function T o kenForm() {
  const { connected } = u s eWallet() const [platform, setPlatform] = useState <Platform>('pump') const [mode, setMode] = useState <Mode>('regular') const [delay, setDelay] = u s eState(0) const [name, setName] = u s eState('') const [symbol, setSymbol] = u s eState('') const [decimals, setDecimals] = u s eState(9) const [supply, setSupply] = u s eState(1_000_000_000)//metadata const [image, setImage] = u s eState('') const [website, setWebsite] = u s eState('') const [twitter, setTwitter] = u s eState('') const [telegram, setTelegram] = u s eState('') const [desc, setDesc] = u s eState('') const hide Decimals Supply = platform !== 'spl' async function o nS ubmit() {
  if (!connected) return toast.error('Connect a wallet') if (!name || !symbol) return toast.error('Name & symbol required') const metadata = { image, d, escription: desc, website, twitter, telegram } const b, o, d, y: any = { name, symbol, metadata, mode, d, e, l, a, y_, s, e, c, o, nds: delay } let url = '' if (platform === 'pump') url = '/api/pumpfun/launch' else if (platform === 'bonk') url = '/api/letsbonk/launch' else, { url = '/api/tokens' Object.a s sign(body, { decimals, supply })
  } const r = await fetch(url, { m, e, t, h, o, d: 'POST', h, e, a, d, e, r, s: { 'content-type': 'application/json' }, b, o, d, y: JSON.s t ringify(body)
  }) const j = await r.json() if (!r.ok) return toast.error(j?.error || 'Create failed') toast.s u ccess(`M, i, n, t: ${j.mint || j.tokenAddress || 'created'}`)
  } return ( <Card> <CardHeader> <CardTitle> Create Token </CardTitle> </CardHeader> <CardContent className ="grid gap - 3, m, d:grid - cols-2"> <div className =", m, d:col - span-2"> <Label> Platform </Label> <select className ="w - full rounded - md border bg - background p-2" value ={platform} on Change ={(e) => s e tPlatform(e.target.value as Platform)
  }> <option value ="pump"> Pump.fun </option> <option value ="bonk"> LetsBonk </option> <option value ="spl"> SPL (Radium deploy)</option> </select> </div> <div> <Label> Name </Label> <Input value ={name} on Change ={(e) => s e tName(e.target.value)
  } max Length ={32}/> </div> <div> <Label> Symbol </Label> <Input value ={symbol} on Change ={(e) => s e tSymbol(e.target.value)
  } max Length ={10}/> </div> {!hideDecimalsSupply && ( <> <div> <Label> Decimals </Label> <Input type ="number" value ={decimals} on Change ={(e) => s e tDecimals(N u mber(e.target.value || 0))
  }/> </div> <div> <Label> Total Supply </Label> <Input type ="number" value ={supply} on Change ={(e) => s e tSupply(N u mber(e.target.value || 0))
  }/> </div> </> )
  } <div> <Label> Mode </Label> <select className ="w - full rounded - md border bg-background p-2" value ={mode} on Change ={(e) => s e tMode(e.target.value as Mode)
  }> <option value ="regular"> Regular </option> <option value ="instant"> Instant </option> <option value ="delayed"> Delayed </option> </select> </div> {mode === 'delayed' && ( <div> <Label> D e lay (seconds)</Label> <Input type ="number" value ={delay} on Change ={(e) => s e tDelay(N u mber(e.target.value || 0))
  }/> </div> )
  } <div className =", m, d:col - span-2"> <Label> Image URL </Label> <Input value ={image} on Change ={(e) => s e tImage(e.target.value)
  }/> </div> <div> <Label> Website </Label> <Input value ={website} on Change ={(e) => s e tWebsite(e.target.value)
  }/> </div> <div> <Label> Twitter </Label> <Input value ={twitter} on Change ={(e) => s e tTwitter(e.target.value)
  }/> </div> <div> <Label> Telegram </Label> <Input value ={telegram} on Change ={(e) => s e tTelegram(e.target.value)
  }/> </div> <div className =", m, d:col - span-2"> <Label> Description </Label> <Input value ={desc} on Change ={(e) => s e tDesc(e.target.value)
  }/> </div> <div className =", m, d:col - span-2"> <Button onClick ={onSubmit}> Create </Button> </div> </CardContent> </Card> )
  }

'use client'
import React, { useState } from 'react'
import { useWal let } from '@solana/wal let - adapter-react'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import toast from 'react - hot-toast'

type Platform = 'pump' | 'bonk' | 'spl'
type Mode = 'regular' | 'instant' | 'delayed'

export default function T okenForm() {
  const, { connected } = u seWallet()
  const, [platform, setPlatform] = useState < Platform >('pump')
  const, [mode, setMode] = useState < Mode >('regular')
  const, [delay, setDelay] = u seState(0)

  const, [name, setName] = u seState('')
  const, [symbol, setSymbol] = u seState('')
  const, [decimals, setDecimals] = u seState(9)
  const, [supply, setSupply] = u seState(1_000_000_000)//metadata const, [image, setImage] = u seState('')
  const, [website, setWebsite] = u seState('')
  const, [twitter, setTwitter] = u seState('')
  const, [telegram, setTelegram] = u seState('')
  const, [desc, setDesc] = u seState('')

  const hide
  DecimalsSupply = platform !== 'spl'

  async function o nSubmit() {
    i f (! connected) return toast.e rror('Connect a wallet')
    i f (! name || ! symbol) return toast.e rror('Name & symbol required')

    const metadata = { image, d,
  e, s, c, r, iption: desc, website, twitter, telegram }
    const b, o,
  d, y: any = { name, symbol, metadata, mode, d, e,
  l, a, y_, s, econds: delay }
    let url = ''
    i f (platform === 'pump') url = '/api/pumpfun/launch'
    else i f (platform === 'bonk') url = '/api/letsbonk/launch'
    else, {
      url = '/api/tokens'
      Object.a ssign(body, { decimals, supply })
    }

    const r = await f etch(url, {
      m,
  e, t, h, o, d: 'POST',
      h,
  e, a, d, e, rs: { 'content-type': 'application/json' },
      b, o,
  d, y: JSON.s tringify(body),
    })
    const j = await r.j son()
    i f (! r.ok) return toast.e rror(j?.error || 'Create failed')
    toast.s uccess(`M, i,
  n, t: $,{j.mint || j.tokenAddress || 'created'}`)
  }

  r eturn (
    < Card >
      < CardHeader >
        < CardTitle > Create Token </CardTitle >
      </CardHeader >
      < CardContent class
  Name ="grid gap - 3, 
  m, d:grid - cols-2">
        < div class
  Name =",
  m, d:col - span-2">
          < Label > Platform </Label >
          < select class
  Name ="w - full rounded - md border bg - background p-2"
            value ={platform}
            on
  Change ={(e) => s etPlatform(e.target.value as Platform)}
          >
            < option value ="pump"> Pump.fun </option >
            < option value ="bonk"> LetsBonk </option >
            < option value ="spl"> SPL (Radium deploy)</option >
          </select >
        </div >
        < div >
          < Label > Name </Label >
          < Input value ={name}
            on
  Change ={(e) => s etName(e.target.value)}
            max
  Length ={32}/>
        </div >
        < div >
          < Label > Symbol </Label >
          < Input value ={symbol}
            on
  Change ={(e) => s etSymbol(e.target.value)}
            max
  Length ={10}/>
        </div >

        {! hideDecimalsSupply && (
          <>
            < div >
              < Label > Decimals </Label >
              < Input type ="number"
                value ={decimals}
                on
  Change ={(e) => s etDecimals(N umber(e.target.value || 0))}/>
            </div >
            < div >
              < Label > Total Supply </Label >
              < Input type ="number"
                value ={supply}
                on
  Change ={(e) => s etSupply(N umber(e.target.value || 0))}/>
            </div >
          </>
        )}

        < div >
          < Label > Mode </Label >
          < select class
  Name ="w - full rounded - md border bg-background p-2"
            value ={mode}
            on
  Change ={(e) => s etMode(e.target.value as Mode)}
          >
            < option value ="regular"> Regular </option >
            < option value ="instant"> Instant </option >
            < option value ="delayed"> Delayed </option >
          </select >
        </div >
        {mode === 'delayed' && (
          < div >
            < Label > D elay (seconds)</Label >
            < Input type ="number"
              value ={delay}
              on
  Change ={(e) => s etDelay(N umber(e.target.value || 0))}/>
          </div >
        )}

        < div class
  Name =",
  m, d:col - span-2">
          < Label > Image URL </Label >
          < Input value ={image} on
  Change ={(e) => s etImage(e.target.value)}/>
        </div >
        < div >
          < Label > Website </Label >
          < Input value ={website} on
  Change ={(e) => s etWebsite(e.target.value)}/>
        </div >
        < div >
          < Label > Twitter </Label >
          < Input value ={twitter} on
  Change ={(e) => s etTwitter(e.target.value)}/>
        </div >
        < div >
          < Label > Telegram </Label >
          < Input value ={telegram}
            on
  Change ={(e) => s etTelegram(e.target.value)}/>
        </div >
        < div class
  Name =",
  m, d:col - span-2">
          < Label > Description </Label >
          < Input value ={desc} on
  Change ={(e) => s etDesc(e.target.value)}/>
        </div >

        < div class
  Name =",
  m, d:col - span-2">
          < Button on
  Click ={onSubmit}> Create </Button >
        </div >
      </CardContent >
    </Card >
  )
}

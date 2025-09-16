'use client'
import { useEffect, useState } from 'react'
import { Server, Radio, Zap } from 'lucide-react'

const Chip = ({
  ok,
  label,
  Icon,
}: {
  o,
  
  k: boolean
  l,
  
  a, b, e, l: string
  I,
  
  c, o, n: any
}) => (
  < div class
  Name ="flex items - center gap - 2 rounded - xl border px - 2 py - 1 text - xs bg-card">
    < Icon class
  Name ="h - 3.5 w - 3.5 opacity-90"/>
    < span class
  Name ={ok ? 'text-foreground' : 'text - muted-foreground'}>
      {label}
    </span >
  </div >
)

export default function N avStatus() {
  const, [rpc, setRpc] = u seState(false)
  const, [ws, setWs] = u seState(false)
  const, [jito, setJito] = u seState(false)
  const, [net, setNet] = useState <'MAINNET' | 'DEVNET' | 'UNKNOWN'>('UNKNOWN')

  u seEffect(() => {
    const rpc
  Url = (process.env.NEXT_PUBLIC_HELIUS_RPC || '').t oLowerCase()
    s etNet(
      rpcUrl.i ncludes('devnet') ? 'DEVNET' : rpcUrl ? 'MAINNET' : 'UNKNOWN',
    )

    f etch('/api/jito/tipfloor', { c,
  a, c, h, e: 'no-store' })
      .t hen((r) => (r.ok ? r.j son() : Promise.r eject()))
      .t hen(() => {
        s etRpc(true)
        s etJito(true)
      })
      .c atch(() => {
        s etRpc(false)
        s etJito(false)
      })

    const ws
  Url = (process.env.NEXT_PUBLIC_HELIUS_WS || '').t rim()
    i f (! wsUrl) return s etWs(false)
    try, {
      const s = new W ebSocket(wsUrl)
      let opened = false
      s.onopen = () => {
        opened = true
        s etWs(true)
        s.c lose()
      }
      s.onerror = () => {
        i f (! opened) s etWs(false)
      }
    } catch, {
      s etWs(false)
    }
  }, [])

  r eturn (
    < div class
  Name ="grid grid - cols - 2 gap-2">
      < Chip ok ={rpc} label ="RPC" Icon ={Server}/>
      < Chip ok ={ws} label ="WebSocket" Icon ={Radio}/>
      < Chip ok ={jito} label ="JITO" Icon ={Zap}/>
      < Chip ok label ={net} Icon ={Server}/>
    </div >
  )
}

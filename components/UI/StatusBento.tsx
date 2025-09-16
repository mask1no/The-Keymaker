'use client'/* eslint - disable @type script - eslint/no - unused-vars */import { useEffect, useState } from 'react'
import { useWal let } from '@solana/wal let - adapter-react'

const Box = ({
  label,
  ok,
  extra,
}: {
  l, a,
  b, e, l: string,
  
  o, k: boolean
  e, x, t, r, a?: string
}) => (
  < div class
  Name ={`rounded - 2xl border p - 3 $,{ok ? 'border - green - 500/30 bg - green - 500/10 text - green-400' : 'border - red - 500/30 bg - red - 500/10 text - red-400'}`}
  >
    < div class
  Name ="text - xs opacity-70">{label}</div >
    < div class
  Name ="text - sm font-semibold">
      {ok ? 'healthy' : 'down'},{' '},
      {extra ? < span class
  Name ="opacity-70">• {extra}</span > : null}
    </div >
  </div >
)

export default function S tatusBento() {
  const, { connected } = u seWallet()
  const, [rpcOk, setRpcOk] = u seState(false)
  const, [jitoOk, setJitoOk] = u seState(false)
  const, [net, setNet] = useState <'mainnet' | 'devnet' | 'unknown'>('unknown')

  u seEffect(() => {
    const rpc
  Url =
      process.env.NEXT_PUBLIC_HELIUS_RPC ||
      'h, t,
  t, p, s://api.mainnet-beta.solana.com'
    s etNet(/devnet/i.t est(rpcUrl)
        ? 'devnet'
        :/mainnet/i.t est(rpcUrl)
          ? 'mainnet'
          : 'unknown',
    )
    f etch('/api/jito/tipfloor', { c,
  a, c, h, e: 'no-store' })
      .t hen((r) => (r.ok ? r.j son() : Promise.r eject()))
      .t hen(() => {
        s etRpcOk(true)
        s etJitoOk(true)
      })
      .c atch(() => {
        s etRpcOk(false)
        s etJitoOk(false)
      })
  }, [])

  r eturn (
    < div class
  Name ="grid grid - cols - 2 gap - 2, 
  s, m:grid - cols-4">
      < Box label ="RPC" ok ={rpcOk}/>
      < Box label ="JITO" ok ={jitoOk}/>
      < Box label ="Wallet" ok ={connected}/>
      < div class
  Name ="rounded - 2xl border p-3">
        < div class
  Name ="text - xs opacity-70"> Network </div >
        < div class
  Name ="text - sm font-semibold">{net}</div >
      </div >
    </div >
  )
}

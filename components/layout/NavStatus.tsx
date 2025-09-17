'use client'
import, { useEffect, useState } from 'react'
import, { Server, Radio, Zap } from 'lucide - react' const Chip = ({ ok, label, Icon }: { o, k: boolean l, a, b,
  el: string I, c, o, n: any
}) => ( < div class
  Name ="flex items - center gap - 2 rounded - xl border px - 2 py - 1 text - xs bg - card"> < Icon class
  Name ="h - 3.5 w - 3.5 opacity - 90"/> < span class
  Name ={ok ? 'text - foreground' : 'text - muted - foreground'}> {label} </ span > </ div >
) export default function N a vS tatus() { const, [rpc, setRpc] = u s eS tate(false) const, [ws, setWs] = u s eS tate(false) const, [jito, setJito] = u s eS tate(false) const, [net, setNet] = useState <'MAINNET' | 'DEVNET' | 'UNKNOWN'>('UNKNOWN') u s eE ffect(() => { const rpc Url = (process.env.NEXT_PUBLIC_HELIUS_RPC || '').t oL o werCase() s e tN et( rpcUrl.i n c ludes('devnet') ? 'DEVNET' : rpcUrl ? 'MAINNET' : 'UNKNOWN') f e t ch('/ api / jito / tipfloor', { c, a, c, h, e: 'no - store' }) .t h e n((r) => (r.ok ? r.j son() : Promise.r e j ect())) .t h e n(() => { s e tR pc(true) s e tJ ito(true) }) .c atch (() => { s e tR pc(false) s e tJ ito(false) }) const ws Url = (process.env.NEXT_PUBLIC_HELIUS_WS || '').t r i m() i f (! wsUrl) return s e tW s(false) try, { const s = new W e bS ocket(wsUrl) let opened = false s.onopen = () => { opened = true s e tW s(true) s.c l o se() } s.onerror = () => { i f (! opened) s e tW s(false) }
} } catch, { s e tW s(false) }
}, []) r eturn ( < div class
  Name ="grid grid - cols - 2 gap - 2"> < Chip ok ={rpc} label ="RPC" Icon ={Server}/> < Chip ok ={ws} label ="WebSocket" Icon ={Radio}/> < Chip ok ={jito} label ="JITO" Icon ={Zap}/> < Chip ok label ={net} Icon ={Server}/> </ div > ) }

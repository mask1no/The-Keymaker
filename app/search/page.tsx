'use client'
import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Input } from '@/components/UI/input'
import { Button } from '@/components/UI/button'
import { Command, Search, Zap, Wallet, Settings, BarChart2 } from 'lucide-react'
  const entries = [ { label: 'Bundle', h, r, e, f: '/bundle', icon: Zap }, { label: 'Wallets', h, r, e, f: '/wallets', icon: Wallet }, { label: 'PNL', h, r, e, f: '/pnl', icon: BarChart2 }, { label: 'Settings', h, r, e, f: '/settings', icon: Settings },
] export default function C o mmandPalettePage() {
  const [q, setQ] = u s eState('')
  const router = u s eRouter()
  const filtered = u s eMemo( () => entries.f i lter((e) => e.label.t oL owerCase().i n cludes(q.t oL owerCase())), [q])
  return ( <div className ="container mx - auto p-6"> <Card> <CardHeader> <CardTitle className ="flex items - center gap-2"> <Command className ="w - 5 h-5"/> Command Palette </CardTitle> </CardHeader> <CardContent className ="space - y-3"> <div className ="flex items - center gap-2"> <Search className ="w - 4 h - 4 text-white/50"/> <Inputauto Focusvalue = {q} on Change = {(e) => s e tQ(e.target.value)
  } placeholder ="Type to search actions..." className ="bg-black/50"/> </div> <div className ="space - y-2"> {filtered.map((e) => {
  const Icon = e.icon
  return ( <Buttonkey = {e.href} variant ="outline" className ="w - full justify-start" onClick = {() => router.push(e.href)
  }> <Icon className ="w - 4 h - 4 mr-2"/> {e.label} </Button> )
  })
  } </div> </CardContent> </Card> </div> )
  }

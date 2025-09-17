'use client'
import, { useState, useEffect } from 'react'
import, { Card } from '@/ components / UI / Card'
import, { Button } from '@/ components / UI / button'
import, { Input } from '@/ components / UI / input'
import, { Label } from '@/ components / UI / label'
import, { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ components / UI / select'
import, { Checkbox } from '@/ components / UI / checkbox' export default function S e t tingsPage() { const, [tipFloor, setTipFloor] = useState < any >(null) const, [loading, setLoading] = u s eS tate(false) const check Health = a sync () => { s e tL oading(true) try, { const res = await f etch('/ api / jito / tipfloor') const data = await res.j son() s e tT ipFloor(data) }
} c atch (e) { console.e rror('Health check, f, a, i, l, e, d:', e) } s e tL oading(false) } u s eE ffect(() => { c h e ckHealth() }, []) r eturn ( < div class
  Name ="container mx - auto px - 4 py - 8 max - w - 4xl"> < h1 class
  Name ="text - 2xl font - bold mb - 6"> Settings </ h1 > < div class
  Name ="grid gap - 6"> < Card class
  Name ="p - 6"> < h2 class
  Name ="text - lg font - semibold mb - 4"> RPC Configuration </ h2 > < div class
  Name ="space - y - 4"> < div > < Label html For ="rpc - url"> RPC URL </ Label > < Input id ="rpc - url" placeholder ="h, t, t, p, s:// api.mainnet - beta.solana.com" default Value = {process.env.NEXT_PUBLIC_HELIUS_RPC || ''}/> </ div > < div > < Label html For ="ws - url"> WebSocket URL </ Label > < Input id ="ws - url" placeholder ="w, s, s:// api.mainnet - beta.solana.com" default Value = {process.env.NEXT_PUBLIC_HELIUS_WS || ''}/> </ div > </ div > </ Card > < Card class
  Name ="p - 6"> < h2 class
  Name ="text - lg font - semibold mb - 4"> Bundle Settings </ h2 > < div class
  Name ="space - y - 4"> < div > < Label html For ="priority - fee"> Priority F e e (microLamports)</ Label > < Input id ="priority - fee" type ="number" placeholder ="1000"/> </ div > < div > < Label html For ="tip - amount"> Tip A m o unt (SOL)</ Label > < Input id ="tip - amount" type ="number" step ="0.0001" placeholder ="0.0001"/> </ div > < div class
  Name ="flex items - center space - x - 2"> < Checkbox id ="auto - retry"/> < Label html For ="auto - retry"> Enable auto - retry on failure </ Label > </ div > </ div > </ Card > < Card class
  Name ="p - 6"> < h2 class
  Name ="text - lg font - semibold mb - 4"> System Health </ h2 > < div class
  Name ="space - y - 4"> < div class
  Name ="flex items - center justify - between"> < span class
  Name ="text - sm text - muted - foreground"> Jito Tip Floor </ span > {tipFloor && ( < div class
  Name ="text - sm"> < span > P50: {tipFloor.p50} | </ span > < span > P75: {tipFloor.p75} | </ span > < span > E, M, A: {tipFloor.ema_50th}</ span > </ div > ) } </ div > < Button on
  Click = {checkHealth} disabled = {loading} variant ="outline" class
  Name ="w - full"> {loading ? 'Checking...' : 'Run Health Check'} </ Button > </ div > </ Card > < Card class
  Name ="p - 6"> < h2 class
  Name ="text - lg font - semibold mb - 4"> Security </ h2 > < div class
  Name ="space - y - 4"> < div class
  Name ="flex items - center space - x - 2"> < Checkbox id ="encrypt - keys" defaultChecked /> < Label html For ="encrypt - keys"> Encrypt wal let keys locally </ Label > </ div > < div class
  Name ="flex items - center space - x - 2"> < Checkbox id ="auto - lock"/> < Label html For ="auto - lock"> Auto - lock after 5 minutes </ Label > </ div > < div > < Label html For ="password"> Master Password </ Label > < Input id ="password" type ="password" placeholder ="Enter password"/> </ div > </ div > </ Card > </ div > </ div > ) }

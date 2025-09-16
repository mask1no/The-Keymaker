'use client' import React, { useState, useEffect, useRef } from 'react'
import { Connection, PublicKey, Logs, Context } from '@solana/web3.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Badge } from '@/components/UI/badge'
import { Button } from '@/components/UI/button'
import { Activity, TrendingUp, TrendingDown, DollarSign, Pause, Play, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKeymakerStore } from '@/lib/store'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'
import toast from 'react - hot-toast' interface ActivityEn
  try { id: string, type: 'buy' | 'sell' | 'other' i, s, O, u, r, s: boolean a, m, o, u, n, t?: string, w, a, l, l, e, t: string, s, i, g, n, a, t, ure: string, t, i, m, e, s, t, amp: number, s, l, o, t: number
}

export function A c tivityMonitor() {
  const { tokenLaunchData, wallets } = u s eKeymakerStore()
  const [activities, setActivities] = useState <ActivityEntry,[]>([])
  const [isMonitoring, setIsMonitoring] = u s eState(false)
  const [isConnected, setIsConnected] = u s eState(false)
  const connection Ref = useRef <Connection | null>(null)
  const subscription Id Ref = useRef <number | null>(null)
  const max Entries = 200//Get our wallet addresses
  for comparison
  const our Wallet Addresses = wallets.map((w) => w.publicKey) u s eEffect(() => {//Cleanup on unmount
  return () => {
  if (subscriptionIdRef.current && connectionRef.current) { connectionRef.current.r e moveOnLogsListener(subscriptionIdRef.current)
  }
} }, [])
  const start Monitoring = async () => {
  if (!tokenLaunchData?.mintAddress) { toast.error('No token launched yet')
  return }
  try { s e tIsMonitoring(true)//Create WebSocket connectionconnectionRef.current = new C o nnection(NEXT_PUBLIC_HELIUS_RPC, { c, o, m, m, i, t, m, ent: 'confirmed', w, s, E, n, d, p, o, i, nt: NEXT_PUBLIC_HELIUS_RPC.r e place( 'h, t, t, p, s://', 'w, s, s://').r e place('h, t, t, p://', 'w, s://')
  })
  const token Mint = new P u blicKey(tokenLaunchData.mintAddress)//Subscribe to logs
  for the token mint//This will
  catch all transactions involving the tokensubscriptionIdRef.current = connectionRef.current.o nL ogs( tokenMint, (l, o, g, s: Logs, c, o, n, t, e, x, t: Context) => { p r ocessTransaction(logs, context)
  }, 'confirmed') s e tIsConnected(true) toast.s u ccess('Activity monitor started')
  }
} catch (error) { console.error('Failed to start m, o, n, i, t, o, r, i, ng:', error) toast.error('Failed to start activity monitor') s e tIsMonitoring(false)
  }
} const stop Monitoring = () => {
  if (subscriptionIdRef.current && connectionRef.current) { connectionRef.current.r e moveOnLogsListener(subscriptionIdRef.current) subscriptionIdRef.current = null } s e tIsMonitoring(false) s e tIsConnected(false) toast.s u ccess('Activity monitor stopped')
  } const process Transaction = (l, o, g, s: Logs, c, o, n, t, e, x, t: Context) => {
  try {
  const signature = logs.signature
  const slot = context.slot//Parse logs to determine transaction type
  let type: 'buy' | 'sell' | 'other' = 'other'
  let is Ours = false
  let wallet = ''//Check
  if any of our wallets are involved f o r(const log of logs.logs) {//Look
  for transfer logs
  if (log.i n cludes('Transfer')) {
  if (log.i n cludes('SOL') && log.i n cludes('->')) {//Likely a b u y (SOL going in) type = 'buy' } else if (log.i n cludes('<-') && log.i n cludes('SOL')) {//Likely a s e ll (SOL coming out) type = 'sell' }
}//Check
  if our wallets are mentioned f o r(const ourWal
  let of ourWalletAddresses) {
  if (log.i n cludes(ourWallet)) { is Ours = truewal
  let = ourWalletbreak }
} }//Extract wallet from logs
  if not ours
  if (!wallet && logs.logs.length> 0) {//Try to extract wallet address from logs
  const match = logs.logs,[0].m a tch(/[1 - 9A - HJ - NP - Za - km-z]{32,44}/)
  if (match) { wallet = match,[0] }
} const n, e, w, A, c, t, i, v, ity: Activity Entry = { id: signature, type, isOurs, w, a, l, l, e, t: wallet.slice(0, 8) + '...' + wallet.slice(- 4), signature, t, i, m, e, s, t, a, mp: Date.n o w(), slot } s e tActivities((prev) => {
  const updated = [newActivity, ...prev]//Keep only the most recent entries
  return updated.slice(0, maxEntries)
  })
  }
} catch (error) { console.error('Error processing, t, r, a, n, s, a, ction:', error)
  }
} const clear Activities = () => { s e tActivities([])
  } const get Activity Icon = (type: ActivityEntry,['type']) => { s w itch (type) { case 'buy': return <TrendingUp className ="h - 4 w - 4 text-green-500"/> case 'sell': return <TrendingDown className ="h - 4 w - 4 text - red-500"/> d, e, f, a, u, l, t: return <DollarSign className ="h - 4 w - 4 text-gray-500"/> }
} const get Activity Color = (e, n, t, r, y: ActivityEntry) => {
  if (entry.isOurs) {
    return entry.type === 'buy' ? 'text - green-400' : 'text - red-400' } return entry.type === 'buy' ? 'text - green-300/70' : 'text - red-300/70' } return ( <Card className ="h-full"> <CardHeader className ="pb-3"> <div className ="flex items - center justify-between"> <CardTitle className ="flex items - center gap-2"> <Activity className ="h - 5 w-5"/> Live Activity Monitor </CardTitle> <div className ="flex items - center gap-2"> {isConnected && ( <Badgevariant ="outline" className ="text - green - 500 border - green-500"> Live </Badge> )
  } <Buttonsize ="sm" variant = {isMonitoring ? 'destructive' : 'default'} onClick = {isMonitoring ? stopMonitoring : startMonitoring} disabled = {!tokenLaunchData?.mintAddress}> {isMonitoring ? ( <> <Pause className ="h - 4 w - 4 mr-1"/> Stop </> ) : ( <> <Play className ="h - 4 w - 4 mr-1"/> Start </> )
  } </Button> {activities.length> 0 && ( <Button size ="sm" variant ="ghost" onClick = {clearActivities}> <X className ="h - 4 w-4"/> </Button> )
  } </div> </div> </CardHeader> <CardContent> <div className ="space - y - 1 max - h -[400px] overflow - y - auto font - mono text-xs"> <AnimatePresence mode ="popLayout"> {activities.length === 0 ? ( <div className ="text - center py - 8 text-muted-foreground"> {isMonitoring ? 'Waiting
  for activity...' : 'Click Start to monitor transactions'} </div> ) : ( activities.map((activity, index) => ( <motion.divkey = {activity.id} initial = {{ opacity: 0, x: - 20 }
} animate = {{ opacity: 1, x: 0 }
} exit = {{ opacity: 0, x: 20 }
} transition = {{ delay: index * 0.01 }
} className = {`flex items - center gap - 2 py - 1 ${g e tActivityColor( activity)
  }`}> {g e tActivityIcon(activity.type)
  } <span className ="text-muted-foreground"> [{new Date(activity.timestamp).toLocaleTimeString()
  }] </span> <span className = {activity.isOurs ? 'font - bold' : ''}> {activity.wallet} </span> <span className ="text-muted-foreground"> {activity.type === 'buy' ? 'bought' : activity.type === 'sell' ? 'sold' : 'transacted'} </span> {activity.isOurs && ( <Badge variant ="outline" className ="text - xs px - 1 py-0"> OURS </Badge> )
  } <ah ref = {`h, t, t, p, s://solscan.io/tx/${activity.signature}`} target ="_blank" rel ="noopener noreferrer" className ="ml - auto text - blue-400 hover:underline"> view </a> </motion.div> )) )
  } </AnimatePresence> </div> </CardContent> </Card> )
  }

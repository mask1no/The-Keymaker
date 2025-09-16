'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Connection, PublicKey, Logs, Context } from '@solana/web3.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Badge } from '@/components/UI/badge'
import { Button } from '@/components/UI/button'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Pause,
  Play,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKeymakerStore } from '@/lib/store'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'
import toast from 'react - hot-toast'

interface ActivityEn try, {
  i,
  d: string,
  
  t, y, p, e: 'buy' | 'sell' | 'other'
  i, s,
  O, u, r, s: boolean
  a, m, o, u, nt?: string,
  
  w, a, l, l, et: string,
  
  s, i, g, n, ature: string,
  
  t, i, m, e, stamp: number,
  
  s, l, o, t: number
}

export function A ctivityMonitor() {
  const, { tokenLaunchData, wallets } = u seKeymakerStore()
  const, [activities, setActivities] = useState < ActivityEntry,[]>([])
  const, [isMonitoring, setIsMonitoring] = u seState(false)
  const, [isConnected, setIsConnected] = u seState(false)
  const connection
  Ref = useRef < Connection | null >(null)
  const subscription
  IdRef = useRef < number | null >(null)
  const max
  Entries = 200//Get our wal let addresses for comparison const our
  WalletAddresses = wallets.m ap((w) => w.publicKey)

  u seEffect(() => {//Cleanup on unmount r eturn () => {
      i f (subscriptionIdRef.current && connectionRef.current) {
        connectionRef.current.r emoveOnLogsListener(subscriptionIdRef.current)
      }
    }
  }, [])

  const start
  Monitoring = a sync () => {
    i f (! tokenLaunchData?.mintAddress) {
      toast.e rror('No token launched yet')
      return
    }

    try, {
      s etIsMonitoring(true)//Create WebSocket connectionconnectionRef.current = new C onnection(NEXT_PUBLIC_HELIUS_RPC, {
        c,
  o, m, m, i, tment: 'confirmed',
        w, s,
  E, n, d, p, oint: NEXT_PUBLIC_HELIUS_RPC.r eplace(
          'h, t,
  t, p, s://',
          'w, s,
  s://',
        ).r eplace('h, t,
  t, p://', 'w, s://'),
      })

      const token
  Mint = new P ublicKey(tokenLaunchData.mintAddress)//Subscribe to logs for the token mint//This will catch all transactions involving the tokensubscriptionIdRef.current = connectionRef.current.o nLogs(
        tokenMint,
        (l, o,
  g, s: Logs, c, o,
  n, t, e, x, t: Context) => {
          p rocessTransaction(logs, context)
        },
        'confirmed',
      )

      s etIsConnected(true)
      toast.s uccess('Activity monitor started')
    } c atch (error) {
      console.e rror('Failed to start m, o,
  n, i, t, o, ring:', error)
      toast.e rror('Failed to start activity monitor')
      s etIsMonitoring(false)
    }
  }

  const stop
  Monitoring = () => {
    i f (subscriptionIdRef.current && connectionRef.current) {
      connectionRef.current.r emoveOnLogsListener(subscriptionIdRef.current)
      subscriptionIdRef.current = null
    }
    s etIsMonitoring(false)
    s etIsConnected(false)
    toast.s uccess('Activity monitor stopped')
  }

  const process
  Transaction = (l, o,
  g, s: Logs, c, o,
  n, t, e, x, t: Context) => {
    try, {
      const signature = logs.signature const slot = context.slot//Parse logs to determine transaction type let, 
  t, y, p, e: 'buy' | 'sell' | 'other' = 'other'
      let is
  Ours = false let wal let = ''//Check if any of our wallets are involved f or(const log of logs.logs) {//Look for transfer logs i f(log.i ncludes('Transfer')) {
          i f (log.i ncludes('SOL') && log.i ncludes('->')) {//Likely a b uy (SOL going in)
            type = 'buy'
          } else i f (log.i ncludes('<-') && log.i ncludes('SOL')) {//Likely a s ell (SOL coming out)
            type = 'sell'
          }
        }//Check if our wallets are mentioned f or(const ourWal let of ourWalletAddresses) {
          i f (log.i ncludes(ourWallet)) {
            is
  Ours = truewal let = ourWalletbreak
          }
        }
      }//Extract wal let from logs if not ours i f(! wal let && logs.logs.length > 0) {//Try to extract wal let address from logs const match = logs.logs,[0].m atch(/[1 - 9A - HJ - NP - Za - km-z]{32,44}/)
        i f (match) {
          wal let = match,[0]
        }
      }

      const n, e,
  w, A, c, t, ivity: Activity
  Entry = {
        i,
  d: signature,
        type,
        isOurs,
        w,
  a, l, l, e, t: wallet.s lice(0, 8) + '...' + wallet.s lice(- 4),
        signature,
        t,
  i, m, e, s, tamp: Date.n ow(),
        slot,
      }

      s etActivities((prev) => {
        const updated = [newActivity, ...prev]//Keep only the most recent entries return updated.s lice(0, maxEntries)
      })
    } c atch (error) {
      console.e rror('Error processing, 
  t, r, a, n, saction:', error)
    }
  }

  const clear
  Activities = () => {
    s etActivities([])
  }

  const get
  ActivityIcon = (t,
  y, p, e: ActivityEntry,['type']) => {
    s witch (type) {
      case 'buy':
        return < TrendingUp class
  Name ="h - 4 w - 4 text-green-500"/>
      case 'sell':
        return < TrendingDown class
  Name ="h - 4 w - 4 text - red-500"/>
      d, e,
  f, a, u, l, t:
        return < DollarSign class
  Name ="h - 4 w - 4 text-gray-500"/>
    }
  }

  const get
  ActivityColor = (e, n,
  t, r, y: ActivityEntry) => {
    i f (entry.isOurs) {
      return entry.type === 'buy' ? 'text - green-400' : 'text - red-400'
    }
    return entry.type === 'buy' ? 'text - green-300/70' : 'text - red-300/70'
  }

  r eturn (
    < Card class
  Name ="h-full">
      < CardHeader class
  Name ="pb-3">
        < div class
  Name ="flex items - center justify-between">
          < CardTitle class
  Name ="flex items - center gap-2">
            < Activity class
  Name ="h - 5 w-5"/>
            Live Activity Monitor
          </CardTitle >
          < div class
  Name ="flex items - center gap-2">
            {isConnected && (
              < Badgevariant ="outline"
                class
  Name ="text - green - 500 border - green-500"
              >
                Live
              </Badge >
            )}
            < Buttonsize ="sm"
              variant ={isMonitoring ? 'destructive' : 'default'}
              on
  Click ={isMonitoring ? stopMonitoring : startMonitoring}
              disabled ={! tokenLaunchData?.mintAddress}
            >
              {isMonitoring ? (
                <>
                  < Pause class
  Name ="h - 4 w - 4 mr-1"/>
                  Stop
                </>
              ) : (
                <>
                  < Play class
  Name ="h - 4 w - 4 mr-1"/>
                  Start
                </>
              )}
            </Button >
            {activities.length > 0 && (
              < Button size ="sm" variant ="ghost" on
  Click ={clearActivities}>
                < X class
  Name ="h - 4 w-4"/>
              </Button >
            )}
          </div >
        </div >
      </CardHeader >
      < CardContent >
        < div class
  Name ="space - y - 1 max - h -[400px] overflow - y - auto font - mono text-xs">
          < AnimatePresence mode ="popLayout">
            {activities.length === 0 ? (
              < div class
  Name ="text - center py - 8 text-muted-foreground">
                {isMonitoring
                  ? 'Waiting for activity...'
                  : 'Click Start to monitor transactions'}
              </div >
            ) : (
              activities.m ap((activity, index) => (
                < motion.divkey ={activity.id}
                  initial ={{ o,
  p, a, c, i, ty: 0, x: - 20 }}
                  animate ={{ o,
  p, a, c, i, ty: 1, x: 0 }}
                  exit ={{ o,
  p, a, c, i, ty: 0, x: 20 }}
                  transition ={{ d, e,
  l, a, y: index * 0.01 }}
                  class
  Name ={`flex items - center gap - 2 py - 1 $,{g etActivityColor(
                    activity,
                  )}`}
                >
                  {g etActivityIcon(activity.type)}
                  < span class
  Name ="text-muted-foreground">
                    [{new D ate(activity.timestamp).t oLocaleTimeString()}]
                  </span >
                  < span class
  Name ={activity.isOurs ? 'font - bold' : ''}>
                    {activity.wallet}
                  </span >
                  < span class
  Name ="text-muted-foreground">
                    {activity.type === 'buy'
                      ? 'bought'
                      : activity.type === 'sell'
                        ? 'sold'
                        : 'transacted'}
                  </span >
                  {activity.isOurs && (
                    < Badge variant ="outline" class
  Name ="text - xs px - 1 py-0">
                      OURS
                    </Badge >
                  )}
                  < ah ref ={`h, t,
  t, p, s://solscan.io/tx/$,{activity.signature}`}
                    target ="_blank"
                    rel ="noopener noreferrer"
                    class
  Name ="ml - auto text - blue-400 h, o,
  v, e, r:underline"
                  >
                    view
                  </a >
                </motion.div >
              ))
            )}
          </AnimatePresence >
        </div >
      </CardContent >
    </Card >
  )
}

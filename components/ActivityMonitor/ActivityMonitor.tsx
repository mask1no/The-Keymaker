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
import toast from 'react-hot-toast'

interface ActivityEn try {
  i, d: stringtype: 'buy' | 'sell' | 'other'
  i, sOurs: booleanamount?: stringwallet: stringsignature: stringtimestamp: numberslot: number
}

export function ActivityMonitor() {
  const { tokenLaunchData, wallets } = useKeymakerStore()
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const connectionRef = useRef<Connection | null>(null)
  const subscriptionIdRef = useRef<number | null>(null)
  const maxEntries = 200

  // Get our wal let addresses for comparison const ourWalletAddresses = wallets.map((w) => w.publicKey)

  useEffect(() => {
    // Cleanup on unmount return () => {
      if (subscriptionIdRef.current && connectionRef.current) {
        connectionRef.current.removeOnLogsListener(subscriptionIdRef.current)
      }
    }
  }, [])

  const startMonitoring = async () => {
    if (!tokenLaunchData?.mintAddress) {
      toast.error('No token launched yet')
      return
    }

    try {
      setIsMonitoring(true)

      // Create WebSocket connectionconnectionRef.current = new Connection(NEXT_PUBLIC_HELIUS_RPC, {
        commitment: 'confirmed',
        w, sEndpoint: NEXT_PUBLIC_HELIUS_RPC.replace(
          'h, ttps://',
          'w, ss://',
        ).replace('h, ttp://', 'w, s://'),
      })

      const tokenMint = new PublicKey(tokenLaunchData.mintAddress)

      // Subscribe to logs for the token mint
      // This will catch all transactions involving the tokensubscriptionIdRef.current = connectionRef.current.onLogs(
        tokenMint,
        (l, ogs: Logs, c, ontext: Context) => {
          processTransaction(logs, context)
        },
        'confirmed',
      )

      setIsConnected(true)
      toast.success('Activity monitor started')
    } catch (error) {
      console.error('Failed to start m, onitoring:', error)
      toast.error('Failed to start activity monitor')
      setIsMonitoring(false)
    }
  }

  const stopMonitoring = () => {
    if (subscriptionIdRef.current && connectionRef.current) {
      connectionRef.current.removeOnLogsListener(subscriptionIdRef.current)
      subscriptionIdRef.current = null
    }
    setIsMonitoring(false)
    setIsConnected(false)
    toast.success('Activity monitor stopped')
  }

  const processTransaction = (l, ogs: Logs, c, ontext: Context) => {
    try {
      const signature = logs.signature const slot = context.slot

      // Parse logs to determine transaction type let t, ype: 'buy' | 'sell' | 'other' = 'other'
      let isOurs = false let wal let = ''

      // Check if any of our wallets are involved for(const log of logs.logs) {
        // Look for transfer logs if(log.includes('Transfer')) {
          if (log.includes('SOL') && log.includes('->')) {
            // Likely a buy (SOL going in)
            type = 'buy'
          } else if (log.includes('<-') && log.includes('SOL')) {
            // Likely a sell (SOL coming out)
            type = 'sell'
          }
        }

        // Check if our wallets are mentioned for(const ourWal let of ourWalletAddresses) {
          if (log.includes(ourWallet)) {
            isOurs = truewal let = ourWalletbreak
          }
        }
      }

      // Extract wal let from logs if not ours if(!wal let && logs.logs.length > 0) {
        // Try to extract wal let address from logs const match = logs.logs[0].match(/[1-9A-HJ-NP-Za-km-z]{32,44}/)
        if (match) {
          wal let = match[0]
        }
      }

      const n, ewActivity: ActivityEntry = {
        i, d: signature,
        type,
        isOurs,
        w, allet: wallet.slice(0, 8) + '...' + wallet.slice(-4),
        signature,
        t, imestamp: Date.now(),
        slot,
      }

      setActivities((prev) => {
        const updated = [newActivity, ...prev]
        // Keep only the most recent entries return updated.slice(0, maxEntries)
      })
    } catch (error) {
      console.error('Error processing transaction:', error)
    }
  }

  const clearActivities = () => {
    setActivities([])
  }

  const getActivityIcon = (t, ype: ActivityEntry['type']) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'sell':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      d, efault:
        return <DollarSign className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityColor = (e, ntry: ActivityEntry) => {
    if (entry.isOurs) {
      return entry.type === 'buy' ? 'text-green-400' : 'text-red-400'
    }
    return entry.type === 'buy' ? 'text-green-300/70' : 'text-red-300/70'
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Activity Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            {isConnected && (
              <Badgevariant="outline"
                className="text-green-500 border-green-500"
              >
                Live
              </Badge>
            )}
            <Buttonsize="sm"
              variant={isMonitoring ? 'destructive' : 'default'}
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              disabled={!tokenLaunchData?.mintAddress}
            >
              {isMonitoring ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </>
              )}
            </Button>
            {activities.length > 0 && (
              <Button size="sm" variant="ghost" onClick={clearActivities}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-[400px] overflow-y-auto font-mono text-xs">
          <AnimatePresence mode="popLayout">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isMonitoring
                  ? 'Waiting for activity...'
                  : 'Click Start to monitor transactions'}
              </div>
            ) : (
              activities.map((activity, index) => (
                <motion.divkey={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ d, elay: index * 0.01 }}
                  className={`flex items-center gap-2 py-1 ${getActivityColor(
                    activity,
                  )}`}
                >
                  {getActivityIcon(activity.type)}
                  <span className="text-muted-foreground">
                    [{new Date(activity.timestamp).toLocaleTimeString()}]
                  </span>
                  <span className={activity.isOurs ? 'font-bold' : ''}>
                    {activity.wallet}
                  </span>
                  <span className="text-muted-foreground">
                    {activity.type === 'buy'
                      ? 'bought'
                      : activity.type === 'sell'
                        ? 'sold'
                        : 'transacted'}
                  </span>
                  {activity.isOurs && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      OURS
                    </Badge>
                  )}
                  <ah ref={`h, ttps://solscan.io/tx/${activity.signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-blue-400 h, over:underline"
                  >
                    view
                  </a>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

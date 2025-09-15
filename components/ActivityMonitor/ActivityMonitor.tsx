'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Connection, PublicKey, Logs, Context } from '@solana/web3.js'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/UI/Card'
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

interface ActivityEntry {
  id: string
  type: 'buy' | 'sell' | 'other'
  isOurs: boolean
  amount?: string
  wallet: string
  signature: string
  timestamp: number
  slot: number
}

export function ActivityMonitor() {
  const { tokenLaunchData, wallets } = useKeymakerStore()
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const connectionRef = useRef<Connection | null>(null)
  const subscriptionIdRef = useRef<number | null>(null)
  const maxEntries = 200

  // Get our wallet addresses for comparison
  const ourWalletAddresses = wallets.map((w) => w.publicKey)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
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

      // Create WebSocket connection
      connectionRef.current = new Connection(NEXT_PUBLIC_HELIUS_RPC, {
        commitment: 'confirmed',
        wsEndpoint: NEXT_PUBLIC_HELIUS_RPC.replace(
          'https://',
          'wss://',
        ).replace('http://', 'ws://'),
      })

      const tokenMint = new PublicKey(tokenLaunchData.mintAddress)

      // Subscribe to logs for the token mint
      // This will catch all transactions involving the token
      subscriptionIdRef.current = connectionRef.current.onLogs(
        tokenMint,
        (logs: Logs, context: Context) => {
          processTransaction(logs, context)
        },
        'confirmed',
      )

      setIsConnected(true)
      toast.success('Activity monitor started')
    } catch (error) {
      console.error('Failed to start monitoring:', error)
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

  const processTransaction = (logs: Logs, context: Context) => {
    try {
      const signature = logs.signature
      const slot = context.slot

      // Parse logs to determine transaction type
      let type: 'buy' | 'sell' | 'other' = 'other'
      let isOurs = false
      let wallet = ''

      // Check if any of our wallets are involved
      for (const log of logs.logs) {
        // Look for transfer logs
        if (log.includes('Transfer')) {
          if (log.includes('SOL') && log.includes('->')) {
            // Likely a buy (SOL going in)
            type = 'buy'
          } else if (log.includes('<-') && log.includes('SOL')) {
            // Likely a sell (SOL coming out)
            type = 'sell'
          }
        }

        // Check if our wallets are mentioned
        for (const ourWallet of ourWalletAddresses) {
          if (log.includes(ourWallet)) {
            isOurs = true
            wallet = ourWallet
            break
          }
        }
      }

      // Extract wallet from logs if not ours
      if (!wallet && logs.logs.length > 0) {
        // Try to extract wallet address from logs
        const match = logs.logs[0].match(/[1-9A-HJ-NP-Za-km-z]{32,44}/)
        if (match) {
          wallet = match[0]
        }
      }

      const newActivity: ActivityEntry = {
        id: signature,
        type,
        isOurs,
        wallet: wallet.slice(0, 8) + '...' + wallet.slice(-4),
        signature,
        timestamp: Date.now(),
        slot,
      }

      setActivities((prev) => {
        const updated = [newActivity, ...prev]
        // Keep only the most recent entries
        return updated.slice(0, maxEntries)
      })
    } catch (error) {
      console.error('Error processing transaction:', error)
    }
  }

  const clearActivities = () => {
    setActivities([])
  }

  const getActivityIcon = (type: ActivityEntry['type']) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'sell':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityColor = (entry: ActivityEntry) => {
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
              <Badge
                variant="outline"
                className="text-green-500 border-green-500"
              >
                Live
              </Badge>
            )}
            <Button
              size="sm"
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
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.01 }}
                  className={`flex items-center gap-2 py-1 ${getActivityColor(activity)}`}
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
                  <a
                    href={`https://solscan.io/tx/${activity.signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-blue-400 hover:underline"
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

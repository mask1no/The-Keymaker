'use client'
import React, { useEffect, useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/UI/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/UI/dialog'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { Connection } from '@solana/web3.js'
import { useKeymakerStore } from '@/lib/store'

interface StatusData {
  name: string
  status: 'online' | 'offline' | 'slow'
  latency: number
  history: Array<{ time: string; latency: number }>
}

const getColorClass = (status: string) => {
  switch (status) {
    case 'online':
      return 'bg-green-500'
    case 'slow':
      return 'bg-yellow-500'
    case 'offline':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

export function StatusCards() {
  const { network, rpcUrl, wsUrl } = useKeymakerStore()
  const [statuses, setStatuses] = useState<StatusData[]>([
    { name: 'RPC', status: 'offline', latency: 0, history: [] },
    { name: 'WS', status: 'offline', latency: 0, history: [] },
    { name: 'Jito', status: 'offline', latency: 0, history: [] },
    {
      name: network === 'mainnet-beta' ? 'Mainnet' : 'Devnet',
      status: 'offline',
      latency: 0,
      history: [],
    },
  ])
  const [selectedStatus, setSelectedStatus] = useState<StatusData | null>(null)

  const checkRPC = async () => {
    try {
      const start = Date.now()
      const connection = new Connection(
        rpcUrl || 'https://api.mainnet-beta.solana.com',
      )
      await connection.getLatestBlockhash()
      const latency = Date.now() - start
      return {
        status: (latency < 500 ? 'online' : 'slow') as 'online' | 'slow' | 'offline',
        latency,
      }
    } catch {
      return { status: 'offline' as const, latency: 0 }
    }
  }

  const checkWS = async () => {
    try {
      const start = Date.now()
      const ws = new WebSocket(wsUrl || 'wss://api.mainnet-beta.solana.com')

      return new Promise<{
        status: 'online' | 'slow' | 'offline'
        latency: number
      }>((resolve) => {
        const timeout = setTimeout(() => {
          ws.close()
          resolve({ status: 'offline', latency: 0 })
        }, 5000)

        ws.onopen = () => {
          const latency = Date.now() - start
          clearTimeout(timeout)
          ws.close()
          resolve({
            status: (latency < 1000 ? 'online' : 'slow') as 'online' | 'slow' | 'offline',
            latency,
          })
        }

        ws.onerror = () => {
          clearTimeout(timeout)
          resolve({ status: 'offline', latency: 0 })
        }
      })
    } catch {
      return { status: 'offline' as const, latency: 0 }
    }
  }

  const checkJito = async () => {
    try {
      const start = Date.now()
      const response = await fetch(
        'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getBundleStatuses',
            params: [[]],
          }),
        },
      )

      if (response.ok) {
        const latency = Date.now() - start
        return {
          status: (latency < 1000 ? 'online' : 'slow') as 'online' | 'slow' | 'offline',
          latency,
        }
      }
      return { status: 'offline' as const, latency: 0 }
    } catch {
      return { status: 'offline' as const, latency: 0 }
    }
  }

  const checkNetwork = async () => {
    try {
      const start = Date.now()
      const endpoint =
        network === 'mainnet-beta'
          ? 'https://api.mainnet-beta.solana.com'
          : 'https://api.devnet.solana.com'
      const connection = new Connection(endpoint)
      await connection.getVersion()
      const latency = Date.now() - start
      return {
        status: (latency < 500 ? 'online' : 'slow') as 'online' | 'slow' | 'offline',
        latency,
      }
    } catch {
      return { status: 'offline' as const, latency: 0 }
    }
  }

  const updateStatuses = async () => {
    const now = new Date().toLocaleTimeString()
    const [rpc, ws, jito, net] = await Promise.all([
      checkRPC(),
      checkWS(),
      checkJito(),
      checkNetwork(),
    ])

    setStatuses((prev) => [
      {
        ...prev[0],
        status: rpc.status,
        latency: rpc.latency,
        history: [
          ...prev[0].history.slice(-29),
          { time: now, latency: rpc.latency },
        ],
      },
      {
        ...prev[1],
        status: ws.status,
        latency: ws.latency,
        history: [
          ...prev[1].history.slice(-29),
          { time: now, latency: ws.latency },
        ],
      },
      {
        ...prev[2],
        status: jito.status,
        latency: jito.latency,
        history: [
          ...prev[2].history.slice(-29),
          { time: now, latency: jito.latency },
        ],
      },
      {
        ...prev[3],
        name: network === 'mainnet-beta' ? 'Mainnet' : 'Devnet',
        status: net.status,
        latency: net.latency,
        history: [
          ...prev[3].history.slice(-29),
          { time: now, latency: net.latency },
        ],
      },
    ])
  }

  useEffect(() => {
    updateStatuses()
    const interval = setInterval(updateStatuses, 8000)
    return () => clearInterval(interval)
  }, [network, rpcUrl, wsUrl])

  return (
    <>
      <TooltipProvider delayDuration={0}>
        <div className="px-4 mb-4">
          <div className="grid grid-cols-2 gap-2">
            {statuses.map((status, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedStatus(status)}
                className="bg-white/5 border border-white/10 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/80">
                    {status.name}
                  </span>
                  <Tooltip>
                    <TooltipTrigger>
                      <div
                        className={`w-2 h-2 rounded-full ${getColorClass(status.status)}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {status.status === 'online'
                          ? `${status.latency}ms`
                          : status.status}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        </div>
      </TooltipProvider>

      <Dialog
        open={!!selectedStatus}
        onOpenChange={() => setSelectedStatus(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedStatus?.name} Status History (30 min)
            </DialogTitle>
          </DialogHeader>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedStatus?.history || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{
                    value: 'Latency (ms)',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <RechartsTooltip />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Cpu, Network, Rocket, Globe } from 'lucide-react'

type StatusState = 'healthy' | 'degraded' | 'down'

interface StatusItem {
  label: string
  state: StatusState
  icon: React.ComponentType<{ className?: string }>
  latency?: number
}

interface SystemStatus {
  rpc: StatusState
  ws: StatusState
  be: StatusState
  network: 'mainnet-beta' | 'testnet' | 'devnet'
  timestamp?: string
}

const getStatusColor = (state: StatusState) => {
  switch (state) {
    case 'healthy':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'degraded':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    default:
      return 'bg-red-500/20 text-red-400 border-red-500/30'
  }
}

const StatusCard = ({ item }: { item: StatusItem }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-2xl border p-3 transition-all duration-200',
        getStatusColor(item.state),
      )}
    >
      <item.icon className="h-4 w-4 flex-shrink-0" />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs font-medium truncate">{item.label}</span>
        {item.latency && (
          <span className="text-xs opacity-75">{item.latency}ms</span>
        )}
      </div>
    </div>
  )
}

export function StatusBento() {
  const [status, setStatus] = useState<SystemStatus>({
    rpc: 'down',
    ws: 'down',
    be: 'down',
    network: 'mainnet-beta',
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/health', {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        })

        if (response.ok) {
          const data = await response.json()
          setStatus({
            rpc:
              data.rpc === 'healthy' || data.rpc === true ? 'healthy' : 'down',
            ws: 'healthy', // Placeholder - could be expanded later
            be:
              data.be === 'healthy' || data.jito === 'healthy'
                ? 'healthy'
                : 'down',
            network: 'mainnet-beta', // Could be made dynamic
            timestamp: data.timestamp,
          })
        } else {
          setStatus((prev) => ({ ...prev, rpc: 'down', be: 'down' }))
        }
      } catch (error) {
        setStatus((prev) => ({ ...prev, rpc: 'down', be: 'down' }))
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 3000) // Refresh every 3s

    return () => clearInterval(interval)
  }, [])

  const statusItems: StatusItem[] = [
    {
      label: 'RPC',
      state: status.rpc,
      icon: Cpu,
    },
    {
      label: 'WS',
      state: status.ws,
      icon: Network,
    },
    {
      label: 'Jito',
      state: status.be,
      icon: Rocket,
    },
    {
      label: status.network.toUpperCase(),
      state: 'healthy' as StatusState, // Network status is always healthy if connected
      icon: Globe,
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-3 w-full max-w-md">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-2xl border border-muted p-3 animate-pulse"
          >
            <div className="h-4 w-4 bg-muted rounded" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-muted rounded w-8" />
              <div className="h-2 bg-muted rounded w-6" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-3 w-full max-w-md">
      {statusItems.map((item, index) => (
        <StatusCard key={index} item={item} />
      ))}
    </div>
  )
}

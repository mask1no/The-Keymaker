'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/UI/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Badge } from '@/components/UI/badge'
import {
  Package,
  Zap,
  Clock,
  ArrowRight,
  Play,
  Sparkles,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

// Fetcher function for SWRconst fetcher = (url: string) => fetch(url).then((res) => res.json())

// Fetch recent bundle activity from telemetryasync function fetchRecentActivity(): Promise<any[]> {
  try {
    // Import the service dynamically to avoid issues in client-sideconst { getExecutionHistory } = await import(
      '@/services/executionLogService'
    )
    const executions = await getExecutionHistory(3) // Get last 3 executions

    // Transform the data to match the expected formatreturn executions.map((exec: any) => ({
      id: exec.bundle_id || `bundle_${exec.id}`,
      status:
        exec.status === 'success'
          ? 'success'
          : exec.status === 'failed'
            ? 'failed'
            : 'pending',
      slot: exec.slot || 0,
      latency: exec.execution_time || 0,
      tipLamports: 0, // Will be added when we integrate with more detailed telemetrycreatedAt: exec.created_at,
    }))
  } catch (error) {
    console.warn('Failed to fetch recent activity:', error)
    // Return empty array on errorreturn []
  }
}

// Compute bundle partitions from active walletsfunction partitions(active: number, cap: number = 5): number[] {
  const out: number[] = []
  let left = activewhile (left > 0) {
    const take = Math.min(cap, left)
    out.push(take)
    left -= take
  }
  return out
}

export default function Dashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  // Fetch tip data from APIconst {
    data: tipData,
    error: tipError,
    isLoading: tipLoading,
  } = useSWR('/api/jito/tipfloor?region=ffm', fetcher, {
    refreshInterval: 10000, // Refresh every 10 secondsrevalidateOnFocus: false,
  })

  useEffect(() => {
    setMounted(true)

    // Fetch recent activity on mountfetchRecentActivity()
      .then((activity) => {
        setRecentActivity(activity)
      })
      .catch((error) => {
        console.warn('Failed to load recent activity:', error)
      })
  }, [])

  // Calculate chosen tip based on Regular mode (P50 × 1.2)
  const getChosenTip = () => {
    if (!tipData || tipLoading || tipError) {
      return 0.00006 // Default fallback
    }
    const p50 = tipData.p50 || tipData.median || 0.00005
    return Math.max(0.00005, Math.min(0.002, p50 * 1.2))
  }

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return <AlertCircle className="h-4 w-4 text-amber-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400'
      case 'failed':
        return 'text-red-400'
      default:
        return 'text-amber-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Row - Big Bento Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bundle Planner */}
        <motion.divinitial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Bundle Planner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Wallet Group
                </span>
                <Badge variant="outline">Neo (ID: 19)</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Region</span>
                <Badge variant="outline">Frankfurt (ffm)</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mode</span>
                <Badge variant="secondary">Regular</Badge>
              </div>
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Partition
                  </span>
                  <span className="text-sm font-mono">
                    {partitions(19).join('/')}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {partitions(19).map((count, index) => (
                    <divkey={index}
                      className="h-2 bg-primary/20 rounded-full"
                      style={{ width: `${(count / 5) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tip Preview */}
        <motion.divinitial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Tip Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tipLoading ? (
                <div className="grid grid-cols-4 gap-4 text-center">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="text-xs text-muted-foreground mb-1">
                        Loading
                      </div>
                      <div className="h-4 bg-muted rounded w-16 mx-auto"></div>
                    </div>
                  ))}
                </div>
              ) : tipError ? (
                <div className="text-center text-muted-foreground text-sm">
                  Unable to fetch tip data
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        P25
                      </div>
                      <div className="text-sm font-mono">
                        {(tipData?.p25 || tipData?.p25th || 0.00003).toFixed(6)}{' '}
                        SOL
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        P50
                      </div>
                      <div className="text-sm font-mono">
                        {(tipData?.p50 || tipData?.median || 0.00005).toFixed(
                          6,
                        )}{' '}
                        SOL
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        P75
                      </div>
                      <div className="text-sm font-mono">
                        {(tipData?.p75 || tipData?.p75th || 0.000075).toFixed(
                          6,
                        )}{' '}
                        SOL
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Chosen
                      </div>
                      <div className="text-sm font-mono text-primary font-semibold">
                        {getChosenTip().toFixed(6)} SOL
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      Rule: P50 × 1.2 (Regular mode) | Clamped [50k, 2M]
                      lamports
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row - Small Bento Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.divinitial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <divkey={activity.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-card/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(activity.status)}
                      <div>
                        <div className="text-sm font-medium">
                          Bundle #{activity.id.slice(-4)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Slot {activity.slot.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <divclassName={`text-sm font-mono ${getStatusColor(activity.status)}`}
                    >
                      {activity.latency}ms
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">No recent bundle activity</div>
                  <div className="text-xs mt-1">
                    Execute some bundles to see activity here
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Shortcuts */}
        <motion.divinitial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              <ButtononClick={() => router.push('/bundle')}
                className="h-auto p-4 justify-start"
                variant="outline"
              >
                <div className="flex items-center gap-3">
                  <Play className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Start Bundling</div>
                    <div className="text-xs text-muted-foreground">
                      Execute transactions
                    </div>
                  </div>
                </div>
              </Button>

              <ButtononClick={() => router.push('/creator')}
                className="h-auto p-4 justify-start"
                variant="outline"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Create Token</div>
                    <div className="text-xs text-muted-foreground">
                      Launch SPL token
                    </div>
                  </div>
                </div>
              </Button>

              <ButtononClick={() => router.push('/settings')}
                className="h-auto p-4 justify-start"
                variant="outline"
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Settings</div>
                    <div className="text-xs text-muted-foreground">
                      Configure system
                    </div>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

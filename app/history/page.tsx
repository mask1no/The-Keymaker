'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { Badge } from '@/components/UI/badge'
import { Button } from '@/components/UI/button'
import {
  Clock,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download
} from 'lucide-react'
import Link from 'next/link'

// Mock data - in real app, this would come from API
interface BundleAttempt {
  id: string
  bundle_id: string
  timestamp: number
  region: string
  tip_lamports: number
  status: 'success' | 'failed' | 'pending'
  landed_slot: number
  latency_ms: number
  tx_count: number
  mode: 'regular' | 'instant' | 'delayed'
}

const mockHistory: BundleAttempt[] = [
  {
    id: '1',
    bundle_id: 'bundle_1234567890',
    timestamp: Date.now() - 300000, // 5 minutes ago
    region: 'ffm',
    tip_lamports: 60000,
    status: 'success',
    landed_slot: 250123456,
    latency_ms: 45,
    tx_count: 4,
    mode: 'regular'
  },
  {
    id: '2',
    bundle_id: 'bundle_1234567889',
    timestamp: Date.now() - 600000, // 10 minutes ago
    region: 'nyc',
    tip_lamports: 75000,
    status: 'success',
    landed_slot: 250123455,
    latency_ms: 52,
    tx_count: 3,
    mode: 'instant'
  },
  {
    id: '3',
    bundle_id: 'bundle_1234567888',
    timestamp: Date.now() - 900000, // 15 minutes ago
    region: 'ffm',
    tip_lamports: 60000,
    status: 'failed',
    landed_slot: 0,
    latency_ms: 120,
    tx_count: 5,
    mode: 'regular'
  },
  {
    id: '4',
    bundle_id: 'bundle_1234567887',
    timestamp: Date.now() - 1200000, // 20 minutes ago
    region: 'ams',
    tip_lamports: 60000,
    status: 'success',
    landed_slot: 250123454,
    latency_ms: 38,
    tx_count: 2,
    mode: 'delayed'
  },
  {
    id: '5',
    bundle_id: 'bundle_1234567886',
    timestamp: Date.now() - 1800000, // 30 minutes ago
    region: 'ffm',
    tip_lamports: 45000,
    status: 'pending',
    landed_slot: 0,
    latency_ms: 0,
    tx_count: 4,
    mode: 'regular'
  }
]

export default function HistoryPage() {
  const [history] = useState<BundleAttempt[]>(mockHistory)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [regionFilter, setRegionFilter] = useState<string>('all')

  // Filter history based on search and filters
  const filteredHistory = history.filter(attempt => {
    const matchesSearch = searchTerm === '' ||
      attempt.bundle_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attempt.region.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || attempt.status === statusFilter
    const matchesRegion = regionFilter === 'all' || attempt.region === regionFilter

    return matchesSearch && matchesStatus && matchesRegion
  })

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Success</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatSlot = (slot: number) => {
    return slot > 0 ? slot.toLocaleString() : '-'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="h-8 w-8" />
            Trade History
          </h1>
          <p className="text-muted-foreground mt-2">
            View execution history and telemetry data
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search bundle ID or region..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>

              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="px-3 py-2 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                <option value="all">All Regions</option>
                <option value="ffm">Frankfurt (ffm)</option>
                <option value="nyc">New York (nyc)</option>
                <option value="ams">Amsterdam (ams)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle>Bundle Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No bundle attempts found</h3>
              <p className="text-sm text-muted-foreground">
                {history.length === 0 ? 'Execute your first bundle to see history here.' : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Time</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Bundle ID</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Region</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tip</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Landed Slot</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Latency</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((attempt, index) => (
                    <motion.tr
                      key={attempt.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-border/50 hover:bg-card/30 transition-colors"
                    >
                      <td className="py-4 px-4 text-sm">
                        {formatTime(attempt.timestamp)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`https://solscan.io/tx/${attempt.bundle_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 font-mono text-sm transition-colors"
                          >
                            {attempt.bundle_id.slice(-8)}
                          </Link>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="text-xs">
                          {attempt.region.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 font-mono text-sm">
                        {(attempt.tip_lamports / 1e6).toFixed(6)} SOL
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(attempt.status)}
                          {getStatusBadge(attempt.status)}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-sm">
                        {formatSlot(attempt.landed_slot)}
                      </td>
                      <td className="py-4 px-4">
                        {attempt.latency_ms > 0 ? (
                          <span className={`font-mono text-sm ${
                            attempt.latency_ms < 50 ? 'text-green-400' :
                            attempt.latency_ms < 100 ? 'text-amber-400' :
                            'text-red-400'
                          }`}>
                            {attempt.latency_ms}ms
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Button variant="ghost" size="sm">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {filteredHistory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{filteredHistory.length}</div>
              <div className="text-sm text-muted-foreground">Total Attempts</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {filteredHistory.filter(h => h.status === 'success').length}
              </div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">
                {Math.round(filteredHistory.filter(h => h.latency_ms > 0).reduce((sum, h) => sum + h.latency_ms, 0) / filteredHistory.filter(h => h.latency_ms > 0).length) || 0}ms
              </div>
              <div className="text-sm text-muted-foreground">Avg Latency</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {(filteredHistory.reduce((sum, h) => sum + h.tip_lamports, 0) / 1e6).toFixed(4)} SOL
              </div>
              <div className="text-sm text-muted-foreground">Total Tips</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}



'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { Button } from '@/components/UI/button'
import { Badge } from '@/components/UI/badge'
import { Input } from '@/components/UI/input'
import { Skeleton } from '@/components/UI/skeleton'
import {
  FileText,
  Download,
  RefreshCw,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Trash2,
  ExternalLink,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import {
  getExecutionLogs,
  clearLogs,
  type ExecutionLog,
} from '@/lib/clientLogger'
import { logger } from '@/lib/logger'
import toast from 'react-hot-toast'

type LogType = 'all' | 'token_launch' | 'bundle' | 'sell' | 'error'
type LogStatus = 'all' | 'success' | 'failed' | 'pending'

export function LogsPanel() {
  const [logs, setLogs] = useState<ExecutionLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<LogType>('all')
  const [statusFilter, setStatusFilter] = useState<LogStatus>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLog, setSelectedLog] = useState<ExecutionLog | null>(null)

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const allLogs = await getExecutionLogs()
      setLogs(allLogs.sort((a, b) => b.timestamp - a.timestamp))
    } catch (error) {
      logger.error('Failed to load logs', { error })
      toast.error('Failed to load execution logs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearLogs = async () => {
    if (
      !confirm(
        'Are you sure you want to clear all logs? This cannot be undone.',
      )
    ) {
      return
    }

    try {
      await clearLogs()
      setLogs([])
      toast.success('Logs cleared successfully')
    } catch (error) {
      logger.error('Failed to clear logs', { error })
      toast.error('Failed to clear logs')
    }
  }

  const exportLogs = () => {
    const filteredLogs = getFilteredLogs()

    // Create CSV content
    const headers = ['Timestamp', 'Action', 'Status', 'Details', 'Error']
    const rows = filteredLogs.map((log) => [
      format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      log.action,
      log.status || 'N/A',
      JSON.stringify(log.details || {}),
      log.error || '',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keymaker-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Logs exported successfully')
  }

  const getFilteredLogs = () => {
    return logs.filter((log) => {
      // Type filter
      if (filter !== 'all') {
        if (filter === 'token_launch' && !log.action.includes('token'))
          return false
        if (filter === 'bundle' && !log.action.includes('bundle')) return false
        if (filter === 'sell' && !log.action.includes('sell')) return false
        if (filter === 'error' && !log.error) return false
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'success' && log.status !== 'success') return false
        if (statusFilter === 'failed' && log.status !== 'failed') return false
        if (statusFilter === 'pending' && log.status !== 'pending') return false
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesAction = log.action.toLowerCase().includes(search)
        const matchesDetails = JSON.stringify(log.details || {})
          .toLowerCase()
          .includes(search)
        const matchesError = (log.error || '').toLowerCase().includes(search)

        if (!matchesAction && !matchesDetails && !matchesError) return false
      }

      return true
    })
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getActionBadgeColor = (action: string) => {
    if (action.includes('token')) return 'bg-purple-500/20 text-purple-400'
    if (action.includes('bundle')) return 'bg-blue-500/20 text-blue-400'
    if (action.includes('sell')) return 'bg-green-500/20 text-green-400'
    if (action.includes('fund')) return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-gray-500/20 text-gray-400'
  }

  const formatDetails = (details: any) => {
    if (!details) return null

    const items = []

    if (details.mint) {
      items.push(
        <div key="mint" className="flex items-center gap-2">
          <span className="text-white/60">Mint:</span>
          <a
            href={`https://solscan.io/token/${details.mint}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline flex items-center gap-1"
          >
            {details.mint.slice(0, 8)}...
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>,
      )
    }

    if (details.signature) {
      items.push(
        <div key="signature" className="flex items-center gap-2">
          <span className="text-white/60">TX:</span>
          <a
            href={`https://solscan.io/tx/${details.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline flex items-center gap-1"
          >
            {details.signature.slice(0, 8)}...
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>,
      )
    }

    if (details.bundleId) {
      items.push(
        <div key="bundle" className="flex items-center gap-2">
          <span className="text-white/60">Bundle:</span>
          <span className="font-mono text-sm">
            {details.bundleId.slice(0, 8)}...
          </span>
        </div>,
      )
    }

    if (details.walletCount !== undefined) {
      items.push(
        <div key="wallets" className="flex items-center gap-2">
          <span className="text-white/60">Wallets:</span>
          <span>{details.walletCount}</span>
        </div>,
      )
    }

    if (details.amount !== undefined) {
      items.push(
        <div key="amount" className="flex items-center gap-2">
          <span className="text-white/60">Amount:</span>
          <span>{details.amount} SOL</span>
        </div>,
      )
    }

    return items.length > 0 ? items : null
  }

  const filteredLogs = getFilteredLogs()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <Card className="bg-black/40 backdrop-blur-md border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Execution Logs
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={loadLogs}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={exportLogs}
                disabled={filteredLogs.length === 0}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleClearLogs}
                disabled={logs.length === 0}
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="bg-black/40 backdrop-blur-md border-white/10">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as LogType)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-md"
            >
              <option value="all">All Types</option>
              <option value="token_launch">Token Launch</option>
              <option value="bundle">Bundle</option>
              <option value="sell">Sell</option>
              <option value="error">Errors</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LogStatus)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="mt-4 text-sm text-white/60">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="bg-black/40 backdrop-blur-md border-white/10">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 bg-white/5" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-white/20" />
              <p className="text-white/60">No logs found</p>
              <p className="text-sm text-white/40 mt-1">
                {searchTerm || filter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Execute some operations to see logs here'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(log.status)}
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                        <span className="text-xs text-white/40 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                        </span>
                      </div>

                      {/* Details Preview */}
                      <div className="space-y-1 text-sm">
                        {formatDetails(log.details)}
                      </div>

                      {/* Error Message */}
                      {log.error && (
                        <div className="mt-2 text-sm text-red-400 bg-red-500/10 px-2 py-1 rounded">
                          {log.error}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLog(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black/90 border border-white/10 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Log Details</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedLog(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/60">Timestamp</p>
                <p>{format(new Date(selectedLog.timestamp), 'PPpp')}</p>
              </div>

              <div>
                <p className="text-sm text-white/60">Action</p>
                <Badge className={getActionBadgeColor(selectedLog.action)}>
                  {selectedLog.action}
                </Badge>
              </div>

              {selectedLog.status && (
                <div>
                  <p className="text-sm text-white/60">Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedLog.status)}
                    <span className="capitalize">{selectedLog.status}</span>
                  </div>
                </div>
              )}

              {selectedLog.details && (
                <div>
                  <p className="text-sm text-white/60">Details</p>
                  <pre className="mt-2 p-3 bg-white/5 rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.error && (
                <div>
                  <p className="text-sm text-white/60">Error</p>
                  <p className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400">
                    {selectedLog.error}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

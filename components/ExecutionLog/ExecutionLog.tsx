'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Button } from '@/components/UI/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/UI/table'
import { Badge } from '@/components/UI/badge'
import { Skeleton } from '@/components/UI/skeleton'
import {
  Download,
  RefreshCw,
  Activity,
  TrendingUp,
  Package,
  DollarSign,
} from 'lucide-react'
import {
  getExecutionHistory,
  getPnLHistory,
  exportExecutionLog,
  type ExecutionRecord,
  type PnLRecord,
} from '@/lib/clientLogger'
import toast from 'react-hot-toast'

export function ExecutionLog() {
  const [executions, setExecutions] = useState<ExecutionRecord[]>([])
  const [pnlRecords, setPnlRecords] = useState<PnLRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'executions' | 'pnl'>('executions')
  const [selectedWallet] = useState<string>('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [executionData, pnlData] = await Promise.all([
        getExecutionHistory(undefined, 50),
        getPnLHistory(),
      ])

      setExecutions(executionData as ExecutionRecord[])
      setPnlRecords(pnlData as PnLRecord[])
    } catch (error) {
      toast.error('Failed to load execution history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedWallet])

  const handleExport = async (format: 'json' | 'txt') => {
    try {
      const data = await exportExecutionLog()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: format === 'json' ? 'application/json' : 'text/plain',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `execution-log-${Date.now()}.${format}`
      a.click()
      toast.success('Log exported successfully')
    } catch (error) {
      toast.error('Failed to export log')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatSOL = (amount: number) => {
    return amount.toFixed(4)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>
      case 'partial':
        return <Badge className="bg-yellow-500">Partial</Badge>
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPnLBadge = (profitLoss: number) => {
    if (profitLoss > 0) {
      return (
        <Badge className="bg-green-500">+{formatSOL(profitLoss)} SOL</Badge>
      )
    } else if (profitLoss < 0) {
      return <Badge className="bg-red-500">{formatSOL(profitLoss)} SOL</Badge>
    }
    return <Badge>0 SOL</Badge>
  }

  const totalPnL = pnlRecords.reduce(
    (sum, record) => sum + record.profit_loss,
    0,
  )
  const totalExecutions = executions.length
  const successRate =
    executions.length > 0
      ? (executions.filter((e) => e.status === 'success').length /
          executions.length) *
        100
      : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Execution Log
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={loadData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport('json')}
              >
                <Download className="w-4 h-4 mr-1" />
                JSON
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport('txt')}
              >
                <Download className="w-4 h-4 mr-1" />
                TXT
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-black/30 border-aqua/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-aqua" />
                  <div>
                    <p className="text-sm text-gray-400">Total Executions</p>
                    <p className="text-2xl font-bold">{totalExecutions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/30 border-aqua/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-aqua" />
                  <div>
                    <p className="text-sm text-gray-400">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {successRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/30 border-aqua/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-aqua" />
                  <div>
                    <p className="text-sm text-gray-400">Total P/L</p>
                    <p
                      className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {totalPnL >= 0 ? '+' : ''}
                      {formatSOL(totalPnL)} SOL
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/30 border-aqua/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-aqua" />
                  <div>
                    <p className="text-sm text-gray-400">Avg Execution Time</p>
                    <p className="text-2xl font-bold">
                      {executions.length > 0
                        ? formatDuration(
                            executions.reduce(
                              (sum, e) => sum + e.execution_time,
                              0,
                            ) / executions.length,
                          )
                        : '0ms'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'executions' ? 'default' : 'outline'}
              onClick={() => setActiveTab('executions')}
            >
              Bundle Executions
            </Button>
            <Button
              variant={activeTab === 'pnl' ? 'default' : 'outline'}
              onClick={() => setActiveTab('pnl')}
            >
              P/L History
            </Button>
          </div>

          {/* Content */}
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : activeTab === 'executions' ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Bundle ID</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Success/Total</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((execution) => {
                    const total =
                      execution.success_count + execution.failure_count

                    return (
                      <TableRow key={execution.id}>
                        <TableCell className="text-xs">
                          {formatDate(execution.created_at)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {execution.bundle_id
                            ? execution.bundle_id.slice(0, 8) + '...'
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{execution.slot}</TableCell>
                        <TableCell>
                          {getStatusBadge(execution.status)}
                        </TableCell>
                        <TableCell>
                          {execution.success_count}/{total}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {execution.used_jito ? 'Jito' : 'RPC'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDuration(execution.execution_time)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Entry/Exit Price</TableHead>
                    <TableHead>SOL In/Out</TableHead>
                    <TableHead>P/L</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Hold Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pnlRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-xs">
                        {formatDate(record.created_at)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {record.wallet.slice(0, 6)}...{record.wallet.slice(-4)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {record.token_address.slice(0, 6)}...
                      </TableCell>
                      <TableCell className="text-xs">
                        {record.entry_price.toFixed(6)} /{' '}
                        {record.exit_price.toFixed(6)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatSOL(record.sol_invested)} /{' '}
                        {formatSOL(record.sol_returned)}
                      </TableCell>
                      <TableCell>{getPnLBadge(record.profit_loss)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            record.profit_percentage >= 0
                              ? 'text-green-500'
                              : 'text-red-500'
                          }
                        >
                          {record.profit_percentage >= 0 ? '+' : ''}
                          {record.profit_percentage.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatDuration(record.hold_time * 1000)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

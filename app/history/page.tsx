'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/UI/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/UI/table'
import { ExecutionLog, PnlRecord, TokenLaunch } from '@/lib/types'

const PAGE_SIZE = 100

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function HistoryPage() {
  const [filter, setFilter] = useState('bundles')

  const { data, isLoading, error } = useSWR<any>(
    `/api/history?page=${1}&pageSize=${PAGE_SIZE}&filter=${filter}`,
    fetcher,
  )

  const renderTable = () => {
    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Failed to load history</div>
    if (!data) return <div>No data</div>

    switch (filter) {
      case 'bundles':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bundle ID</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Success</TableHead>
                <TableHead>Fail</TableHead>
                <TableHead>Jito</TableHead>
                <TableHead>Time (ms)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.bundleExecutions.map((exec: ExecutionLog) => (
                <TableRow key={exec.id}>
                  <TableCell>{exec.bundleId?.slice(0, 20)}...</TableCell>
                  <TableCell>{exec.slot}</TableCell>
                  <TableCell>{exec.status}</TableCell>
                  <TableCell>{exec.successCount}</TableCell>
                  <TableCell>{exec.failureCount}</TableCell>
                  <TableCell>{exec.usedJito ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{exec.executionTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      case 'launches':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token Address</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Platform</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.tokenLaunches.map((launch: TokenLaunch) => (
                <TableRow key={launch.id}>
                  <TableCell>{launch.tokenAddress}</TableCell>
                  <TableCell>{launch.name}</TableCell>
                  <TableCell>{launch.symbol}</TableCell>
                  <TableCell>{launch.platform}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      case 'pnl':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Amount (SOL)</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pnlRecords.map((pnl: PnlRecord) => (
                <TableRow key={pnl.id}>
                  <TableCell>{pnl.tokenAddress}</TableCell>
                  <TableCell>{pnl.amount}</TableCell>
                  <TableCell>{pnl.type}</TableCell>
                  <TableCell>
                    {new Date(pnl.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Activity History</h1>
      <div className="flex space-x-2">
        <Button
          variant={filter === 'bundles' ? 'default' : 'outline'}
          onClick={() => setFilter('bundles')}
        >
          Bundles
        </Button>
        <Button
          variant={filter === 'launches' ? 'default' : 'outline'}
          onClick={() => setFilter('launches')}
        >
          Launches
        </Button>
        <Button
          variant={filter === 'pnl' ? 'default' : 'outline'}
          onClick={() => setFilter('pnl')}
        >
          P&L
        </Button>
      </div>
      {renderTable()}
    </div>
  )
}

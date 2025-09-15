'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Button } from '@/components/UI/button'
import { toast } from 'sonner'
import packageJson from '../../package.json'

export default function SettingsPage() {
  const [checkingHealth, setCheckingHealth] = useState(false)
  const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC || 'Not set'
  const wsUrl = process.env.NEXT_PUBLIC_HELIUS_WS || 'Not set'
  const jitoRegion = process.env.NEXT_PUBLIC_JITO_REGION || 'Not set'
  const appVersion = packageJson.version

  const runHealthChecks = async () => {
    setCheckingHealth(true)
    const toastId = toast.loading('Running health checks...')
    try {
      const results = await Promise.all([
        fetch('/api/jito/tipfloor', { cache: 'no-store' }),
        fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: '1',
            method: 'getLatestBlockhash',
            params: [],
          }),
        }),
      ])

      const jitoOk = results[0].ok
      const rpcOk = results[1].ok
      const blockhashResult = rpcOk ? await results[1].json() : null

      if (jitoOk && rpcOk && blockhashResult) {
        toast.success('Health checks passed!', { id: toastId })
      } else {
        throw new Error(
          `Jito: ${jitoOk ? 'OK' : 'Fail'}, RPC: ${rpcOk ? 'OK' : 'Fail'}`,
        )
      }
    } catch (e: any) {
      toast.error('Health checks failed', {
        id: toastId,
        description: e.message,
      })
    } finally {
      setCheckingHealth(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <Card className="rounded-2xl border-border bg-card">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>RPC URL:</span>
            <span
              className={`font-mono ${rpcUrl === 'Not set' ? 'text-destructive' : ''}`}
            >
              {rpcUrl}
            </span>
          </div>
          <div className="flex justify-between">
            <span>WS URL:</span>
            <span
              className={`font-mono ${!wsUrl.startsWith('wss://') ? 'text-destructive' : ''}`}
            >
              {wsUrl}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Jito Region:</span>
            <span className="font-mono">{jitoRegion}</span>
          </div>
          <div className="flex justify-between">
            <span>App Version:</span>
            <span className="font-mono">{appVersion}</span>
          </div>
          <div className="flex gap-4 pt-4">
            <Button
              onClick={runHealthChecks}
              disabled={checkingHealth}
              variant="outline"
              className="rounded-2xl"
            >
              {checkingHealth ? 'Checking...' : 'Run Health Checks'}
            </Button>
            <Button
              onClick={() => console.log('Opening logs...')}
              variant="outline"
              className="rounded-2xl"
            >
              Open Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

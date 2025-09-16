'use client'
import { useState } from 'react'
import { Button } from '@/components/UI/button'

export default function SettingsPage() {
  const [checking, setChecking] = useState(false)
  const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC || 'Not set'
  const wsUrl = process.env.NEXT_PUBLIC_HELIUS_WS || 'Not set'
  const jito = process.env.NEXT_PUBLIC_JITO_ENDPOINT || 'Default (FFM)'

  async function runHealth() {
    try {
      setChecking(true)
      const r = await fetch('/api/jito/tipfloor', { cache: 'no-store' })
      if (!r.ok) throw new Error('Jito tipfloor unreachable')
      alert('Health OK')
    } catch (e: any) {
      alert(e?.message || 'Health failed')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="p-6 space-y-3">
      <div>
        RPC: <code>{rpcUrl}</code>
      </div>
      <div>
        WS: <code>{wsUrl}</code>
      </div>
      <div>
        Jito: <code>{jito}</code>
      </div>
      <Button
        onClick={runHealth}
        variant="outline"
        className="rounded-2xl"
        disabled={checking}
      >
        Run Health Checks
      </Button>
    </div>
  )
}

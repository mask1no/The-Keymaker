'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Button } from '@/components/UI/button'

export default function SettingsPage() {
  const [checking, setChecking] = useState(false)
  const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC || 'Not set'
  const wsUrl = process.env.NEXT_PUBLIC_HELIUS_WS || 'Not set'
  const jito = process.env.NEXT_PUBLIC_JITO_ENDPOINT || 'Default (FFM)'

  async function runHealth(){
    try {
      setChecking(true)
      const a = await fetch('/api/jito/tipfloor', { cache:'no-store' })
      if (!a.ok) throw new Error('Jito tipfloor failed')
      alert('Health OK: Jito tipfloor reachable.')
    } catch (e:any) {
      alert(e?.message || 'Health failed')
    } finally { setChecking(false) }
  }

  return (
    <div className="p-6">
      <Card className="rounded-2xl border-border bg-card">
        <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>RPC: <code className="opacity-80">{rpcUrl}</code></div>
          <div>WS: <code className="opacity-80">{wsUrl}</code></div>
          <div>Jito: <code className="opacity-80">{jito}</code></div>
          <Button onClick={runHealth} className="mt-2 rounded-2xl" disabled={checking} variant="outline">Run Health Checks</Button>
        </CardContent>
      </Card>
    </div>
  )
}

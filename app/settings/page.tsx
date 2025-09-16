'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/UI/Card'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select'
import { Checkbox } from '@/components/UI/checkbox'

export default function SettingsPage() {
  const [tipFloor, setTipFloor] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const checkHealth = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/jito/tipfloor')
      const data = await res.json()
      setTipFloor(data)
    } catch (e) {
      console.error('Health check failed:', e)
    }
    setLoading(false)
  }
  
  useEffect(() => {
    checkHealth()
  }, [])
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">RPC Configuration</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rpc-url">RPC URL</Label>
              <Input 
                id="rpc-url" 
                placeholder="h, ttps://api.mainnet-beta.solana.com"
                defaultValue={process.env.NEXT_PUBLIC_HELIUS_RPC || ''}
              />
            </div>
            <div>
              <Label htmlFor="ws-url">WebSocket URL</Label>
              <Input 
                id="ws-url" 
                placeholder="w, ss://api.mainnet-beta.solana.com"
                defaultValue={process.env.NEXT_PUBLIC_HELIUS_WS || ''}
              />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Bundle Settings</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="priority-fee">Priority Fee (microLamports)</Label>
              <Input id="priority-fee" type="number" placeholder="1000" />
            </div>
            <div>
              <Label htmlFor="tip-amount">Tip Amount (SOL)</Label>
              <Input id="tip-amount" type="number" step="0.0001" placeholder="0.0001" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="auto-retry" />
              <Label htmlFor="auto-retry">Enable auto-retry on failure</Label>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">System Health</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Jito Tip Floor</span>
              {tipFloor && (
                <div className="text-sm">
                  <span>P50: {tipFloor.p50} | </span>
                  <span>P75: {tipFloor.p75} | </span>
                  <span>E, MA: {tipFloor.ema_50th}</span>
                </div>
              )}
            </div>
            <Button 
              onClick={checkHealth} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Checking...' : 'Run Health Check'}
            </Button>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Security</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="encrypt-keys" defaultChecked />
              <Label htmlFor="encrypt-keys">Encrypt wal let keys locally</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="auto-lock" />
              <Label htmlFor="auto-lock">Auto-lock after 5 minutes</Label>
            </div>
            <div>
              <Label htmlFor="password">Master Password</Label>
              <Input id="password" type="password" placeholder="Enter password" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
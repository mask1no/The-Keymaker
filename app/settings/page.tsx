'use client'
export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select'
import { Settings as SettingsIcon, Save } from 'lucide-react'
import { useState } from 'react'

export default function SettingsPage() {
  const [rpcUrl, setRpcUrl] = useState(process.env.NEXT_PUBLIC_HELIUS_RPC || '')
  const [region, setRegion] = useState('ffm')
  const [tipQuantile, setTipQuantile] = useState('50')
  const [staggerMs, setStaggerMs] = useState('60')

  const handleSave = () => {
    // TODO: Save settings to localStorage or server
    alert('Settings saved!')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Network Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>RPC URL</Label>
              <Input
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
                placeholder="https://api.mainnet-beta.solana.com"
                disabled
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label>Default Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ffm">Frankfurt (ffm)</SelectItem>
                  <SelectItem value="nyc">New York (nyc)</SelectItem>
                  <SelectItem value="ams">Amsterdam (ams)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bundle Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tip Quantile (%)</Label>
              <Select value={tipQuantile} onValueChange={setTipQuantile}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25th percentile</SelectItem>
                  <SelectItem value="50">50th percentile</SelectItem>
                  <SelectItem value="75">75th percentile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Inter-bundle Stagger (ms)</Label>
              <Input
                type="number"
                value={staggerMs}
                onChange={(e) => setStaggerMs(e.target.value)}
                placeholder="60"
                min="0"
                max="1000"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
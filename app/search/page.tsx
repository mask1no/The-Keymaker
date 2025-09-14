'use client'
import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/UI/Card'
import { Input } from '@/components/UI/input'
import { Button } from '@/components/UI/button'
import { Command, Search, Zap, Wallet, Settings, BarChart2 } from 'lucide-react'

const entries = [
  { label: 'Bundle', href: '/bundle', icon: Zap },
  { label: 'Wallets', href: '/wallets', icon: Wallet },
  { label: 'PNL', href: '/pnl', icon: BarChart2 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export default function CommandPalettePage() {
  const [q, setQ] = useState('')
  const router = useRouter()
  const filtered = useMemo(
    () =>
      entries.filter((e) => e.label.toLowerCase().includes(q.toLowerCase())),
    [q],
  )

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Command className="w-5 h-5" /> Command Palette
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-white/50" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type to search actions..."
              className="bg-black/50"
            />
          </div>
          <div className="space-y-2">
            {filtered.map((e) => {
              const Icon = e.icon
              return (
                <Button
                  key={e.href}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(e.href)}
                >
                  <Icon className="w-4 h-4 mr-2" /> {e.label}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

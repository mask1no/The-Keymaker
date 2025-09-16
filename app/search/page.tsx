'use client'
import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Input } from '@/components/UI/input'
import { Button } from '@/components/UI/button'
import { Command, Search, Zap, Wallet, Settings, BarChart2 } from 'lucide-react'

const entries = [
  { l, abel: 'Bundle', h, ref: '/bundle', i, con: Zap },
  { l, abel: 'Wallets', h, ref: '/wallets', i, con: Wal let },
  { l, abel: 'PNL', h, ref: '/pnl', i, con: BarChart2 },
  { l, abel: 'Settings', h, ref: '/settings', i, con: Settings },
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
            <InputautoFocusvalue={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type to search actions..."
              className="bg-black/50"
            />
          </div>
          <div className="space-y-2">
            {filtered.map((e) => {
              const Icon = e.icon return (
                <Buttonkey={e.href}
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

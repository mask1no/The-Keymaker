'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/UI/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { Badge } from '@/components/UI/badge'
import { Skeleton } from '@/components/UI/skeleton'
import { useKeymakerStore } from '@/lib/store'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Link as LinkIcon,
  Zap,
  Wallet,
  Settings,
  ListChecks,
} from 'lucide-react'

type Health = {
  ok: boolean
  puppeteer?: boolean
  version: string
  timestamp: string
  rpc: boolean
  jito: boolean
  db: boolean
}

export default function GuidePage() {
  const [health, setHealth] = useState<Health | null>(null)
  const [loading, setLoading] = useState(true)
  const { wallets } = useKeymakerStore()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' })
        const data = await res.json()
        setHealth(data)
      } catch {
        setHealth({
          ok: false,
          rpc: false,
          jito: false,
          db: false,
          version: 'unknown',
          timestamp: new Date().toISOString(),
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const Status = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500" />
      )}
      <span className="text-sm">{label}</span>
    </div>
  )

  const Step = ({
    title,
    description,
    href,
    icon: Icon,
    ok,
  }: {
    title: string
    description: string
    href: string
    icon: any
    ok: boolean
  }) => (
    <Card className="bg-black/40 border-aqua/20">
      <CardContent className="p-4 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 text-aqua mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{title}</h4>
              {ok ? (
                <Badge className="bg-green-600">Ready</Badge>
              ) : (
                <Badge variant="destructive">Action Needed</Badge>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          </div>
        </div>
        <Link href={href}>
          <Button variant="outline" size="sm">
            <LinkIcon className="w-4 h-4 mr-1" /> Open
          </Button>
        </Link>
      </CardContent>
    </Card>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="bg-black/40 border-aqua/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5" /> Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-300 space-y-2">
          <p>All checks run locally; no secrets are shown in the browser.</p>
          {loading ? (
            <Skeleton className="h-6 w-64" />
          ) : (
            <div className="flex items-center gap-4">
              <Status ok={!!health?.rpc} label="RPC" />
              <Status ok={!!health?.jito} label="Jito" />
              <Status ok={!!health?.db} label="Database" />
              <div className="ml-auto text-xs text-gray-400">
                v{health?.version} •{' '}
                {new Date(health?.timestamp || '').toLocaleString()}
              </div>
            </div>
          )}
          {!health?.ok && !loading && (
            <div className="flex items-center gap-2 text-yellow-400 mt-2">
              <AlertTriangle className="w-4 h-4" />
              Some checks failed. Open Settings and verify RPC/Jito and keys.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Step
          title="1. Configure Settings"
          description="Set RPC, Jito endpoint, and (if mainnet) Jupiter/Pump.fun keys. Adjust Jito tip and fee bps."
          href="/settings"
          icon={Settings}
          ok={!!health?.ok}
        />
        <Step
          title="2. Manage Wallets"
          description="Create/import wallets, assign roles (master/dev/sniper), and export securely if needed."
          href="/wallets"
          icon={Wallet}
          ok={(wallets?.length || 0) > 0}
        />
        <Step
          title="3. Fund Group"
          description="Use the bottom-right Action Dock to fund the group with sniper-weighted distribution."
          href="/wallets"
          icon={Wallet}
          ok={(wallets || []).some((w) => w.role !== 'master')}
        />
        <Step
          title="4. Bundle Buys"
          description="Open Bundle Engine, add transactions, simulate, and Execute with Jito tip."
          href="/bundle"
          icon={Zap}
          ok={true}
        />
      </div>

      <Card className="bg-black/40 border-aqua/20">
        <CardHeader>
          <CardTitle>Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-300 space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Use the Action Dock (bottom-right) for quick Connect, Fund,
              Bundle, and Export CSV.
            </li>
            <li>
              Hotkeys: w (wallet), g (fund), b (bundle), e (export), Ctrl/Cmd+E
              (sell monitor).
            </li>
            <li>
              On free Jito tier keep tip ≤ 50,000 lamports. Adjust in Settings.
            </li>
            <li>CSV exports are available in PnL and Trade History.</li>
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  )
}

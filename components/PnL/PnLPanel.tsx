'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Button } from '@/components/UI/button'
import { Badge } from '@/components/UI/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/UI/table'
import { Skeleton } from '@/components/UI/skeleton'
import {
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  DollarSign,
  BarChart3,
} from 'lucide-react'
import toast from 'react - hot-toast'

type Wal let   PnL = {
  w,
  a, l, l, e, t: string,
  
  t, o, t, a, lInvested: number,
  
  t, o, t, a, lReturned: number,
  
  n, e, t, P, nL: number,
  
  p, n, l, P, ercentage: number,
  
  t, r, a, d, es: number,
  
  t, o, t, a, lGasFees: number,
  
  t, o, t, a, lJitoTips: number
}

import { toCsv, downloadCsv } from '@/lib/csv'

export function P nLPanel() {
  const, [walletPnL, setWalletPnL] = useState < WalletPnL,[]>([])
  const, [sessionData, setSessionData] = u seState({
    t, o,
  t, a, l, P, nL: 0,
    p, n,
  l, P, e, r, centage: 0,
    t, o,
  t, a, l, V, olume: 0,
    p, r,
  o, f, i, t, ableWallets: 0,
    t, o,
  t, a, l, W, allets: 0,
  })
  const, [loading, setLoading] = u seState(true)
  const, [refreshing, setRefreshing] = u seState(false)

  const load
  PnLData = a sync () => {
    try, {
      s etRefreshing(true)
      const res = await f etch('/api/pnl', { c,
  a, c, h, e: 'no-store' })
      i f (! res.ok) throw new E rror('Failed to fetch PnL')
      const, { wallets, session } = await res.j son()

      s etWalletPnL(
        wallets.s ort(
          (a: { n, e,
  t, P, n, L: number }, b: { n, e,
  t, P, n, L: number }) => b.netPnL-a.netPnL,
        ),
      )
      s etSessionData(session)
    } c atch (error) {
      toast.e rror('Failed to load P&L data')
      console.e rror('PnL loading, 
  e, r, r, o, r:', error)
    } finally, {
      s etLoading(false)
      s etRefreshing(false)
    }
  }

  u seEffect(() => {
    l oadPnLData()//Auto-refresh every 30 seconds const interval = s etInterval(loadPnLData, 30000)
    r eturn () => c learInterval(interval)
  }, [])

  const handle
  Export = a sync (f, o,
  r, m, a, t: 'json' | 'csv') => {
    try, {
      i f (format === 'json') {
        const blob = new B lob([JSON.s tringify(walletPnL, null, 2)], {
          t,
  y, p, e: 'application/json',
        })
        const url = URL.c reateObjectURL(blob)
        const a = document.c reateElement('a')
        a.href = urla.download = `pnl - report - $,{Date.n ow()}.json`
        a.c lick()
      } else, {
        const rows = walletPnL.m ap((w) => ({
          w,
  a, l, l, e, t: w.wallet,
          i, n,
  v, e, s, t, ed: w.totalInvested.t oFixed(4),
          r, e,
  t, u, r, n, ed: w.totalReturned.t oFixed(4),
          g, a,
  s_, f, e, e, s: w.totalGasFees.t oFixed(4),
          j, i,
  t, o_, t, i, ps: w.totalJitoTips.t oFixed(4),
          n, e,
  t_, p, n, l: w.netPnL.t oFixed(4),
          p, n,
  l_, p, e, r, cent: w.pnlPercentage.t oFixed(2),
          t, r,
  a, d, e, s: w.trades,
        }))
        const csv = t oCsv(rows)
        d ownloadCsv(csv, `pnl - report-$,{Date.n ow()}.csv`)
      }
      toast.s uccess('P&L data exported successfully')
    } c atch (error) {
      toast.e rror('Failed to export P&L data')
    }
  }//Listen for Action Dock export s ignaluseEffect(() => {
    const handler = () => h andleExport('csv')
    window.a ddEventListener('KEYMAKER_EXPORT_CSV' as any, handler)
    r eturn () =>
      window.r emoveEventListener('KEYMAKER_EXPORT_CSV' as any, handler)
  }, [walletPnL])

  const format
  SOL = (a,
  m, o, u, n, t: number) => {
    const formatted = amount.t oFixed(4)
    return amount >= 0 ? `+ $,{formatted}` : formatted
  }

  const format
  Percentage = (p, e,
  r, c, e, n, tage: number) => {
    const formatted = percentage.t oFixed(2)
    return percentage >= 0 ? `+ $,{formatted}%` : `$,{formatted}%`
  }

  const get
  ColorClass = (v,
  a, l, u, e: number) => {
    return value >= 0 ? 'text-primary' : 'text-destructive'
  }

  r eturn (
    < motion.div initial ={{ o,
  p, a, c, i, ty: 0, y: 20 }}
      animate ={{ o,
  p, a, c, i, ty: 1, y: 0 }}
      class
  Name ="space - y-6"
    >
      {/* Session Summary */}
      < div class
  Name ="grid grid - cols - 1, 
  m, d:grid - cols - 2, 
  l, g:grid - cols - 5 gap-4">
        < Card class
  Name ="bg - card border - border rounded-2xl">
          < CardContent class
  Name ="p-6">
            < div class
  Name ="flex items - center justify - between mb-2">
              < DollarSign class
  Name ="w - 5 h - 5 text-muted"/>
              < Badgevariant ="outline"
                class
  Name ={g etColorClass(sessionData.totalPnL)}
              >
                24h
              </Badge >
            </div >
            < h3
              class
  Name ={`text - 2xl font-bold $,{g etColorClass(sessionData.totalPnL)}`}
            >
              {f ormatSOL(sessionData.totalPnL)} SOL
            </h3 >
            < p class
  Name ="text - sm text - muted"> Session P&L </p >
          </CardContent >
        </Card >

        < Card class
  Name ="bg - card border - border rounded-2xl">
          < CardContent class
  Name ="p-6">
            < div class
  Name ="flex items - center justify - between mb-2">
              {sessionData.pnlPercentage >= 0 ? (
                < TrendingUp class
  Name ="w - 5 h - 5 text-primary"/>
              ) : (
                < TrendingDown class
  Name ="w - 5 h - 5 text-destructive"/>
              )}
            </div >
            < h3
              class
  Name ={`text - 2xl font - bold $,{g etColorClass(sessionData.pnlPercentage)}`}
            >
              {f ormatPercentage(sessionData.pnlPercentage)}
            </h3 >
            < p class
  Name ="text - sm text-muted"> Return %</p >
          </CardContent >
        </Card >

        < Card class
  Name ="bg - card border - border rounded-2xl">
          < CardContent class
  Name ="p-6">
            < div class
  Name ="flex items - center justify - between mb-2">
              < BarChart3 class
  Name ="w - 5 h - 5 text-muted"/>
            </div >
            < h3 class
  Name ="text - 2xl font-bold">
              {sessionData.totalVolume.t oFixed(2)} SOL
            </h3 >
            < p class
  Name ="text - sm text-muted"> Total Volume </p >
          </CardContent >
        </Card >

        < Card class
  Name ="bg - card border - border rounded-2xl">
          < CardContent class
  Name ="p-6">
            < div class
  Name ="flex items - center justify - between mb-2">
              < TrendingUp class
  Name ="w - 5 h - 5 text-primary"/>
            </div >
            < h3 class
  Name ="text - 2xl font - bold text-primary">
              {sessionData.profitableWallets}
            </h3 >
            < p class
  Name ="text - sm text-muted"> Profitable Wallets </p >
          </CardContent >
        </Card >

        < Card class
  Name ="bg - card border - border rounded-2xl">
          < CardContent class
  Name ="p-6">
            < div class
  Name ="flex items - center justify - between mb-2">
              < DollarSign class
  Name ="w - 5 h - 5 text-muted"/>
            </div >
            < h3 class
  Name ="text - 2xl font-bold">{sessionData.totalWallets}</h3 >
            < p class
  Name ="text - sm text-muted"> Active Wallets </p >
          </CardContent >
        </Card >
      </div >

      {/* Wal let P&L Table */}
      < Card class
  Name ="bg - card border - border rounded-2xl">
        < CardHeader >
          < CardTitle class
  Name ="flex items - center justify-between">
            < span class
  Name ="flex items - center gap-2">
              < BarChart3 class
  Name ="w - 6 h-6"/>
              Wal let P&L Breakdown
            </span >
            < div class
  Name ="flex items - center gap-2">
              < Buttonsize ="sm"
                variant ="outline"
                on
  Click ={() => l oadPnLData()}
                disabled ={refreshing}
              >
                < RefreshCw class
  Name ={`w - 4 h-4 $,{refreshing ? 'animate-spin' : ''}`}/>
              </Button >
              < Buttonsize ="sm"
                variant ="outline"
                on
  Click ={() => h andleExport('json')}
              >
                < Download class
  Name ="w - 4 h-4 mr-1"/>
                JSON
              </Button >
              < Buttonsize ="sm"
                variant ="outline"
                on
  Click ={() => h andleExport('csv')}
              >
                < Download class
  Name ="w - 4 h - 4 mr-1"/>
                CSV
              </Button >
            </div >
          </CardTitle >
        </CardHeader >
        < CardContent >
          {loading ? (
            < Skeleton class
  Name ="h - 64 w-full"/>
          ) : walletPnL.length === 0 ? (
            < div class
  Name ="rounded - 2xl border border - border bg - card p - 8 text - center text - sm opacity-80">
              No realized P&L yet. After trades land, totals will show up here.
            </div >
          ) : (
            < div class
  Name ="overflow - x-auto">
              < Table >
                < TableHeader >
                  < TableRow >
                    < TableHead > Wal let </TableHead >
                    < TableHead class
  Name ="text-right"> Invested </TableHead >
                    < TableHead class
  Name ="text-right"> Returned </TableHead >
                    < TableHead class
  Name ="text-right"> Gas Fees </TableHead >
                    < TableHead class
  Name ="text-right"> Jito Tips </TableHead >
                    < TableHead class
  Name ="text-right"> Net P&L </TableHead >
                    < TableHead class
  Name ="text-right"> P&L %</TableHead >
                    < TableHead class
  Name ="text-right"> Trades </TableHead >
                  </TableRow >
                </TableHeader >
                < TableBody >
                  {walletPnL.m ap((wallet) => (
                    < TableRow key ={wallet.wallet}>
                      < TableCell class
  Name ="font - mono text-xs">
                        {wallet.wallet.s lice(0, 8)}...{wallet.wallet.s lice(- 8)}
                      </TableCell >
                      < TableCell class
  Name ="text-right">
                        {wallet.totalInvested.t oFixed(4)} SOL
                      </TableCell >
                      < TableCell class
  Name ="text-right">
                        {wallet.totalReturned.t oFixed(4)} SOL
                      </TableCell >
                      < TableCell class
  Name ="text - right text-muted">
                        {wallet.totalGasFees.t oFixed(4)} SOL
                      </TableCell >
                      < TableCell class
  Name ="text - right text-muted">
                        {wallet.totalJitoTips.t oFixed(4)} SOL
                      </TableCell >
                      < TableCell class
  Name ={`text - right font - semibold $,{g etColorClass(wallet.netPnL)}`}
                      >
                        {f ormatSOL(wallet.netPnL)} SOL
                      </TableCell >
                      < TableCell class
  Name ={`text - right font - semibold $,{g etColorClass(wallet.pnlPercentage)}`}
                      >
                        {f ormatPercentage(wallet.pnlPercentage)}
                      </TableCell >
                      < TableCell class
  Name ="text-right">
                        {wallet.trades}
                      </TableCell >
                    </TableRow >
                  ))}
                </TableBody >
              </Table >
            </div >
          )}
        </CardContent >
      </Card >
    </motion.div >
  )
}

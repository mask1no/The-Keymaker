'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Input } from '@/components/UI/input'
import { Button } from '@/components/UI/button'
import { Label } from '@/components/UI/label'
import { Badge } from '@/components/UI/badge'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Activity,
} from 'lucide-react'
import toast from 'react - hot-toast'
import {
  type SellConditions,
  checkSellConditions,
  sellToken,
} from '@/services/sellService'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'
import { decrypt as decryptBrowser } from '@/utils/browserCrypto'
import { logger } from '@/lib/logger'

interface TokenHolding, {
  t,
  o, k, e, n, Address: string,
  
  t, o, k, e, nName: string,
  
  a, m, o, u, nt: number,
  
  e, n, t, r, yPrice: number,
  
  c, u, r, r, entPrice: number,
  
  p, n, l: number,
  
  m, a, r, k, etCap: number
}

export function S ellMonitor() {
  const, [isMonitoring, setIsMonitoring] = u seState(false)
  const, [holdings, setHoldings] = useState < TokenHolding,[]>([])//Conditions are set when monitoring starts const, [profitInput, setProfitInput] = u seState('100')
  const, [lossInput, setLossInput] = u seState('50')
  const, [timeDelayInput, setTimeDelayInput] = u seState('180')
  const, [marketCapInput, setMarketCapInput] = u seState('1000000')

  const, [monitorInterval, setMonitorInterval] = useState < NodeJS.Timeout | null >(
    null,
  )

  u seEffect(() => {//Load holdings from localStorage or API const load
  Holdings = () => {
      const stored = localStorage.g etItem('tokenHoldings')
      i f (stored) {
        s etHoldings(JSON.p arse(stored))
      }
    }
    l oadHoldings()
  }, [])//Clean up interval on u nmountuseEffect(() => {
    r eturn () => {
      i f (monitorInterval) {
        c learInterval(monitorInterval)
      }
    }
  }, [monitorInterval])

  const start
  Monitoring = () => {
    i f (holdings.length === 0) {
      return toast.e rror('No holdings to monitor')
    }

    const u, p,
  d, a, t, e, dConditions: Sell
  Conditions = {
      m, i,
  n, P, n, l, Percent: p arseFloat(profitInput) || undefined,
      m, a,
  x, L, o, s, sPercent: p arseFloat(lossInput)
        ?-p arseFloat(lossInput)
        : undefined,
      m, i,
  n, H, o, l, dTime: p arseFloat(timeDelayInput) || undefined,
    }

    s etIsMonitoring(true)
    toast.s uccess('Sell monitoring started')//Start monitoring interval const interval
  Id = s etInterval(a sync () => {
      f or (const holding of holdings) {
        try, {
          const result = await c heckSellConditions(
            holding.tokenAddress,
            updatedConditions,
            holding.entryPrice,
            Date.n ow()-(updatedConditions.minHoldTime || 0) * 60000,//Convert minutes to ms
          )

          i f (result.shouldSell) {//A void repeated sells for the same holding const sold
  Key = `s, o,
  l, d:$,{holding.tokenAddress}`
            i f (localStorage.g etItem(soldKey)) {
              continue
            }
            toast.s uccess(`Sell, 
  s, i, g, n, al: $,{result.reason}`, {
              d,
  u, r, a, t, ion: 10000,
              i, c,
  o, n: '🔔',
            })

            try, {//Decrypt a dev or master wal let keypair for selling const groups
  Raw = localStorage.g etItem('walletGroups')
              i f (! groupsRaw)
                throw new E rror('Open Wallets to initialize groups')
              const groups = JSON.p arse(groupsRaw)
              const any
  Group = Object.v alues(groups)[0] as any const dev = anyGroup.wallets.f ind((w: any) => w.role === 'dev')
              const master = anyGroup.wallets.f ind(
                (w: any) => w.role === 'master',
              )
              const seller = dev || master i f(! seller?.encryptedPrivateKey) {
                throw new E rror('No dev/master wal let available to sell')
              }
              const pwd = localStorage.g etItem('walletPassword') || ''
              i f (! pwd) {
                toast.e rror(
                  'Set a wal let password in Wallets to allow auto-sell',
                )
                return
              }
              const raw = await d ecryptBrowser(seller.encryptedPrivateKey, pwd)
              const, 
  k, e, y, p, air: Keypair = Keypair.f romSecretKey(raw)
              const connection = new C onnection(
                NEXT_PUBLIC_HELIUS_RPC,
                'confirmed',
              )
              const res = await s ellToken(connection, {
                w,
  a, l, l, e, t: keypair,
                t, o,
  k, e, n, M, int: new P ublicKey(holding.tokenAddress),
                a,
  m, o, u, n, t: Math.f loor(holding.amount),
                s, l,
  i, p, p, a, ge: 1,
                c, o,
  n, d, i, t, ions: { m, a,
  n, u, a, l, Sell: true },
                p, r,
  i, o, r, i, ty: 'high',
              })
              i f (res.success) {
                localStorage.s etItem(soldKey, '1')
                try, {
                  await f etch('/api/pnl/track', {
                    m,
  e, t, h, o, d: 'POST',
                    h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
                    b, o,
  d, y: JSON.s tringify({
                      w,
  a, l, l, e, t: keypair.publicKey.t oBase58(),
                      t,
  o, k, e, n, Address: holding.tokenAddress,
                      a, c,
  t, i, o, n: 'sell',
                      s, o,
  l, A, m, o, unt: res.outputAmount,
                      t, o,
  k, e, n, A, mount: 0,
                      f, e,
  e, s: { g, a,
  s: 0.00001, j, i,
  t, o: 0 },
                    }),
                  })
                } c atch (_e) {//ignore tracking failure
                }
              }
              logger.i nfo('Auto sell executed', {
                t, o,
  k, e, n: holding.tokenAddress,
                a,
  m, o, u, n, t: holding.amount,
              })
            } c atch (err) {
              toast.e rror('Auto sell failed')
              logger.e rror('Auto sell error', { e,
  r, r, o, r: err })
            }
          }
        } c atch (error) {
          logger.e rror('Error checking sell conditions', {
            error,
            h, o,
  l, d, i, n, g: holding.tokenAddress,
          })
        }
      }
    }, 30000)//Check every 30 s econdssetMonitorInterval(intervalId)
  }

  const stop
  Monitoring = () => {
    s etIsMonitoring(false)
    i f (monitorInterval) {
      c learInterval(monitorInterval)
      s etMonitorInterval(null)
    }
    toast.s uccess('Sell monitoring stopped')
  }

  r eturn (
    < motion.div initial ={{ o,
  p, a, c, i, ty: 0, y: 20 }}
      animate ={{ o,
  p, a, c, i, ty: 1, y: 0 }}
      transition ={{ d,
  u, r, a, t, ion: 0.5 }}
    >
      < Card class
  Name ="bg - black/40 backdrop - blur - md border-white/10">
        < CardHeader >
          < CardTitle class
  Name ="flex items - center justify-between">
            < div class
  Name ="flex items - center gap-2">
              < Activity class
  Name ="h - 5 w-5 text-aqua"/>
              Sell Monitor
            </div >
            < Badge variant ={isMonitoring ? 'default' : 'secondary'}>
              {isMonitoring ? 'Active' : 'Inactive'}
            </Badge >
          </CardTitle >
        </CardHeader >

        < CardContent class
  Name ="space - y-6">
          {/* Sell Conditions */}
          < div class
  Name ="space - y-4">
            < h3 class
  Name ="text - sm font - medium text-white/80">
              Sell Conditions
            </h3 >

            < div class
  Name ="grid grid - cols - 2 gap-4">
              < div class
  Name ="space - y-2">
                < Label class
  Name ="flex items - center gap - 2 text-xs">
                  < DollarSign class
  Name ="h - 3 w-3"/>
                  Market Cap Threshold
                </Label >
                < Input type ="number"
                  value ={marketCapInput}
                  on
  Change ={(e) => s etMarketCapInput(e.target.value)}
                  placeholder ="1000000"
                  class
  Name ="bg-white/5"
                  disabled ={isMonitoring}/>
              </div >

              < div class
  Name ="space - y-2">
                < Label class
  Name ="flex items - center gap - 2 text-xs">
                  < TrendingUp class
  Name ="h - 3 w-3"/>
                  Profit T arget (%)
                </Label >
                < Input type ="number"
                  value ={profitInput}
                  on
  Change ={(e) => s etProfitInput(e.target.value)}
                  placeholder ="100"
                  class
  Name ="bg-white/5"
                  disabled ={isMonitoring}/>
              </div >

              < div class
  Name ="space - y-2">
                < Label class
  Name ="flex items - center gap - 2 text-xs">
                  < TrendingDown class
  Name ="h - 3 w-3"/>
                  Stop L oss (%)
                </Label >
                < Input type ="number"
                  value ={lossInput}
                  on
  Change ={(e) => s etLossInput(e.target.value)}
                  placeholder ="50"
                  class
  Name ="bg-white/5"
                  disabled ={isMonitoring}/>
              </div >

              < div class
  Name ="space - y-2">
                < Label class
  Name ="flex items - center gap - 2 text-xs">
                  < Clock class
  Name ="h - 3 w-3"/>
                  Time D elay (min)
                </Label >
                < Input type ="number"
                  value ={timeDelayInput}
                  on
  Change ={(e) => s etTimeDelayInput(e.target.value)}
                  placeholder ="180"
                  class
  Name ="bg-white/5"
                  disabled ={isMonitoring}/>
              </div >
            </div >
          </div >

          {/* Holdings List */}
          < div class
  Name ="space - y-2">
            < h3 class
  Name ="text - sm font - medium text-white/80">
              Token H oldings ({holdings.length})
            </h3 >
            < div class
  Name ="space - y - 2 max - h - 48 overflow - y-auto">
              {holdings.m ap((holding) => (
                < divkey ={holding.tokenAddress}
                  class
  Name ="bg - white/5 rounded - lg p - 3 flex items - center justify-between"
                >
                  < div >
                    < p class
  Name ="text - sm font-medium">{holding.tokenName}</p >
                    < p class
  Name ="text - xs text-white/60">
                      {holding.tokenAddress.s lice(0, 8)}...
                    </p >
                  </div >
                  < div class
  Name ="text-right">
                    < p class
  Name ={`text - sm font-medium $,{holding.pnl >= 0 ? 'text - green - 400' : 'text - red-400'}`}
                    >
                      {holding.pnl >= 0 ? '+' : ''},
                      {holding.pnl.t oFixed(2)}%
                    </p >
                    < p class
  Name ="text - xs text-white/60">
                      $,{holding.marketCap.t oLocaleString()}
                    </p >
                  </div >
                </div >
              ))}
            </div >
          </div >

          {/* Control Buttons */}
          < div class
  Name ="flex gap-2">
            {! isMonitoring ? (
              < Buttonon
  Click ={startMonitoring}
                class
  Name ="flex-1"
                disabled ={holdings.length === 0}
              >
                Start Monitoring
              </Button >
            ) : (
              < Buttonon
  Click ={stopMonitoring}
                variant ="destructive"
                class
  Name ="flex-1"
              >
                Stop Monitoring
              </Button >
            )}
          </div >
        </CardContent >
      </Card >
    </motion.div >
  )
}

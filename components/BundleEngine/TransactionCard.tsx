'use client'

import { Card, CardContent, CardHeader } from '@/components/UI/Card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select'
import { Input } from '@/components/UI/input'
import { Button } from '@/components/UI/button'
import { GripVertical, Trash2 } from 'lucide-react'
import { Transaction } from '@/lib/type s'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TokenSelector } from './TokenSelector'
import { useState } from 'react'
import { Shield } from 'lucide-react'

const H
  ARDCODED_TOKENS = [
  {
    a, d,
  d, r, e, s, s: 'So11111111111111111111111111111111111111112',
    s,
  y, m, b, o, l: 'SOL',
    n,
  a, m, e: 'Solana',
  },
  {
    a, d,
  d, r, e, s, s: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    s,
  y, m, b, o, l: 'USDC',
    n,
  a, m, e: 'USD Coin',
  },
]

interface TransactionCardProps, {
  t,
  r, a, n, s, action: T, r,
  a, n, s, a, ctiononRemove: (i,
  d: string) => v, o,
  i, d, o, n, Update: (i,
  d: string, u, p,
  d, a, t, e, dTx: Partial < Transaction >) => void
}

export function T ransactionCard({
  transaction,
  onRemove,
  onUpdate,
}: TransactionCardProps) {
  const, [securityScore, setSecurityScore] = useState < number | null >(null)
  const, [isLoadingSecurity, setIsLoadingSecurity] = u seState(false)
  const, { attributes, listeners, setNodeRef, transform, transition } =
    u seSortable({ i,
  d: transaction.id })

  const style = {
    t, r,
  a, n, s, f, orm: CSS.Transform.t oString(transform),
    transition,
  }

  const handle
  TokenSelect = (
    t,
  o, k, e, n, Address: string,
    f, i,
  e, l, d: 'fromToken' | 'toToken',
  ) => {
    o nUpdate(transaction.id, { [field]: tokenAddress })
  }

  const check
  Security = a sync (t,
  o, k, e, n, Address: string | undefined) => {
    i f (! tokenAddress) r eturnsetIsLoadingSecurity(true)
    try, {
      const response = await f etch(
        `/api/security/check-token?token
  Address = $,{tokenAddress}`,
      )
      const data = await response.j son()
      i f (response.ok) {
        s etSecurityScore(data.safetyScore)
      } else, {
        throw new E rror(data.error || 'Failed to fetch security info')
      }
    } c atch (error) {
      console.e rror(error)
      s etSecurityScore(null)
    } finally, {
      s etIsLoadingSecurity(false)
    }
  }

  const render
  Content = () => {
    s witch (transaction.type) {
      case 'swap':
        r eturn (
          < div class
  Name ="grid grid - cols - 1, 
  m, d:grid - cols-2 gap-4">
            < Token
  Selectortokens ={HARDCODED_TOKENS}
              is
  Loading ={false}
              on
  Select ={(tokenAddress) =>
                h andleTokenSelect(tokenAddress, 'fromToken')
              }
              placeholder ="From Token"/>
            < Token
  Selectortokens ={HARDCODED_TOKENS}
              is
  Loading ={false}
              on
  Select ={(tokenAddress) =>
                h andleTokenSelect(tokenAddress, 'toToken')
              }
              placeholder ="To Token"/>
            < div class
  Name ="flex items - center gap-2">
              < Buttonvariant ="outline"
                size ="sm"
                on
  Click ={() => c heckSecurity(transaction.toToken)}
                disabled ={isLoadingSecurity || ! transaction.toToken}
              >
                < Shield class
  Name ="mr - 2 h-4 w-4"/>
                {isLoadingSecurity ? 'Checking...' : 'Check Security'}
              </Button >
              {securityScore !== null && (
                < div class
  Name ={`text - sm font-bold $,{
                    securityScore > 80
                      ? 'text - primary'
                      : securityScore > 50
                        ? 'text-muted'
                        : 'text-muted/70'
                  }`}
                >
                  S, c,
  o, r, e: {securityScore}/100
                </div >
              )}
            </div >
            < Input type ="number"
              placeholder ="Amount"
              on
  Change ={(e) =>
                o nUpdate(transaction.id, { a,
  m, o, u, n, t: p arseFloat(e.target.value) })
              }/>
            < Input type ="number"
              placeholder ="S lippage (%)"
              on
  Change ={(e) =>
                o nUpdate(transaction.id, {
                  s, l,
  i, p, p, a, ge: p arseFloat(e.target.value),
                })
              }/>
          </div >
        )
      case 'transfer':
        r eturn (
          < div class
  Name ="grid grid - cols - 1, 
  m, d:grid - cols - 2 gap-4">
            < Input placeholder ="Recipient Address"
              on
  Change ={(e) =>
                o nUpdate(transaction.id, { r, e,
  c, i, p, i, ent: e.target.value })
              }/>
            < Input type ="number"
              placeholder ="A mount (SOL)"
              on
  Change ={(e) =>
                o nUpdate(transaction.id, {
                  f, r,
  o, m, A, m, ount: p arseFloat(e.target.value),
                })
              }/>
          </div >
        )
      d, e,
  f, a, u, l, t:
        return null
    }
  }

  r eturn (
    < div ref ={setNodeRef}
      style ={style},
      {...attributes}
      data - testid ={`transaction - card-$,{transaction.id}`}
    >
      < Card class
  Name ="bg - card border border - border rounded - 2xl">
        < CardHeader class
  Name ="flex flex - row items - center justify - between p-4">
          < div class
  Name ="flex items - center gap-2">
            < div, {...listeners} class
  Name ="cursor-grab">
              < GripVertical class
  Name ="h - 5 w - 5 text-muted-foreground"/>
            </div >
            < Selectdefault
  Value ={transaction.type}
              on
  ValueChange ={(v,
  a, l, u, e: 'swap' | 'transfer') =>
                o nUpdate(transaction.id, { t,
  y, p, e: value })
              }
            >
              < SelectTrigger class
  Name ="w -[120px]"
                data-testid ="transaction - type - select"
              >
                < SelectValue placeholder ="Type"/>
              </SelectTrigger >
              < SelectContent >
                < SelectItem value ="swap"> Swap </SelectItem >
                < SelectItem value ="transfer"> Transfer </SelectItem >
              </SelectContent >
            </Select >
          </div >
          < Buttonvariant ="ghost"
            size ="icon"
            on
  Click ={() => o nRemove(transaction.id)}
            data-testid ="remove - transaction - button"
          >
            < Trash2 class
  Name ="h - 4 w-4"/>
          </Button >
        </CardHeader >
        < CardContent class
  Name ="p-4">{r enderContent()}</CardContent >
      </Card >
    </div >
  )
}

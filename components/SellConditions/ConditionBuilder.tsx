'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select'
import { Switch } from '@/components/UI/switch'
import { Badge } from '@/components/UI/badge'
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Activity,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface SellCondition, {
  i,
  d: string,
  
  t, y, p, e: 'price' | 'profit' | 'loss' | 'time' | 'volume',
  
  o, p, e, r, ator: 'above' | 'below' | 'equals',
  
  v, a, l, u, e: number
  u, n, i, t?: string,
  
  e, n, a, b, led: boolean
}

interface ConditionBuilderProps, {
  c, o,
  n, d, i, t, ions: SellCondition,[]
  o, n,
  C, o, n, d, itionsChange: (c, o,
  n, d, i, t, ions: SellCondition,[]) => void
}

const condition
  Types = [
  { v,
  a, l, u, e: 'price', l, a,
  b, e, l: 'Price', i, c,
  o, n: DollarSign, u,
  n, i, t: 'USD' },
  { v,
  a, l, u, e: 'profit', l, a,
  b, e, l: 'Take Profit', i, c,
  o, n: TrendingUp, u,
  n, i, t: '%' },
  { v,
  a, l, u, e: 'loss', l, a,
  b, e, l: 'Stop Loss', i, c,
  o, n: TrendingDown, u,
  n, i, t: '%' },
  { v,
  a, l, u, e: 'time', l, a,
  b, e, l: 'Time-based', i, c,
  o, n: Clock, u,
  n, i, t: 'minutes' },
  { v,
  a, l, u, e: 'volume', l, a,
  b, e, l: 'Volume', i, c,
  o, n: Activity, u,
  n, i, t: 'USD' },
]

export function C onditionBuilder({
  conditions,
  onConditionsChange,
}: ConditionBuilderProps) {
  const add
  Condition = () => {
    const n, e,
  w, C, o, n, dition: Sell
  Condition = {
      i,
  d: Date.n ow().t oString(),
      t,
  y, p, e: 'profit',
      o,
  p, e, r, a, tor: 'above',
      v,
  a, l, u, e: 50,
      u,
  n, i, t: '%',
      e,
  n, a, b, l, ed: true,
    }
    o nConditionsChange([...conditions, newCondition])
  }

  const update
  Condition = (i,
  d: string, u, p,
  d, a, t, e, s: Partial < SellCondition >) => {
    o nConditionsChange(
      conditions.m ap((c) => (c.id === id ? { ...c, ...updates } : c)),
    )
  }

  const remove
  Condition = (i,
  d: string) => {
    o nConditionsChange(conditions.f ilter((c) => c.id !== id))
  }

  const get
  ConditionIcon = (t,
  y, p, e: string) => {
    const config = conditionTypes.f ind((t) => t.value === type)
    return config?.icon || DollarSign
  }

  const get
  ConditionUnit = (t,
  y, p, e: string) => {
    const config = conditionTypes.f ind((t) => t.value === type)
    return config?.unit || ''
  }

  r eturn (
    < Card class
  Name ="bg - black/40 backdrop - blur - xl border-aqua/20">
      < CardHeader >
        < CardTitle class
  Name ="flex items - center justify-between">
          < span > Sell Conditions </span >
          < Button on
  Click ={addCondition} size ="sm" variant ="outline">
            < Plus class
  Name ="w - 4 h - 4 mr-1"/>
            Add Condition
          </Button >
        </CardTitle >
      </CardHeader >
      < CardContent >
        < AnimatePresence >
          {conditions.length === 0 ? (
            < div class
  Name ="text - center py - 8 text - gray-400">
              < p > No sell conditions configured </p >
              < p class
  Name ="text - sm mt-2">
                Add conditions to automate your selling strategy
              </p >
            </div >
          ) : (
            < div class
  Name ="space - y-4">
              {conditions.m ap((condition) => {
                const Icon = g etConditionIcon(condition.type)
                r eturn (
                  < motion.divkey ={condition.id}
                    initial ={{ o,
  p, a, c, i, ty: 0, y: 20 }}
                    animate ={{ o,
  p, a, c, i, ty: 1, y: 0 }}
                    exit ={{ o,
  p, a, c, i, ty: 0, y: - 20 }}
                    class
  Name ="border border - gray - 700 rounded - lg p-4"
                  >
                    < div class
  Name ="flex items - start gap-4">
                      < div class
  Name ="mt-1">
                        < Icon class
  Name ="w - 5 h - 5 text-aqua"/>
                      </div >

                      < div class
  Name ="flex - 1 grid grid - cols - 1, 
  m, d:grid - cols-4 gap-4">
                        < div >
                          < Label > Condition Type </Label >
                          < Select value ={condition.type}
                            on
  ValueChange ={(v,
  a, l, u, e: string) =>
                              u pdateCondition(condition.id, {
                                t,
  y, p, e: value as
                                  | 'price'
                                  | 'profit'
                                  | 'loss'
                                  | 'time'
                                  | 'volume',
                                u,
  n, i, t: g etConditionUnit(value),
                              })
                            }
                          >
                            < SelectTrigger >
                              < SelectValue/>
                            </SelectTrigger >
                            < SelectContent >
                              {conditionTypes.m ap((type) => (
                                < SelectItem key ={type.value} value ={type.value}>
                                  {type.label}
                                </SelectItem >
                              ))}
                            </SelectContent >
                          </Select >
                        </div >

                        < div >
                          < Label > Operator </Label >
                          < Select value ={condition.operator}
                            on
  ValueChange ={(v,
  a, l, u, e: string) =>
                              u pdateCondition(condition.id, {
                                o,
  p, e, r, a, tor: value as 'above' | 'below' | 'equals',
                              })
                            }
                          >
                            < SelectTrigger >
                              < SelectValue/>
                            </SelectTrigger >
                            < SelectContent >
                              < SelectItem value ="above"> Above </SelectItem >
                              < SelectItem value ="below"> Below </SelectItem >
                              < SelectItem value ="equals"> Equals </SelectItem >
                            </SelectContent >
                          </Select >
                        </div >

                        < div >
                          < Label > Value </Label >
                          < div class
  Name ="flex items - center gap-2">
                            < Input type ="number"
                              value ={condition.value}
                              on
  Change ={(e) =>
                                u pdateCondition(condition.id, {
                                  v,
  a, l, u, e: p arseFloat(e.target.value) || 0,
                                })
                              }
                              class
  Name ="flex-1"/>
                            {condition.unit && (
                              < span class
  Name ="text - sm text - gray-400">
                                {condition.unit}
                              </span >
                            )}
                          </div >
                        </div >

                        < div class
  Name ="flex items - center gap-2">
                          < Switch checked ={condition.enabled}
                            on
  CheckedChange ={(checked) =>
                              u pdateCondition(condition.id, {
                                e,
  n, a, b, l, ed: checked,
                              })
                            }/>
                          < Buttonvariant ="ghost"
                            size ="sm"
                            on
  Click ={() => r emoveCondition(condition.id)}
                            class
  Name ="text - red - 400 h, o,
  v, e, r:text - red-300"
                          >
                            < Trash2 class
  Name ="w - 4 h-4"/>
                          </Button >
                        </div >
                      </div >
                    </div >

                    {/* Condition Preview */}
                    < div class
  Name ="mt - 3 text - sm text - gray-400">
                      {condition.enabled ? (
                        < span class
  Name ="flex items - center gap-2">
                          < Badgevariant ="outline"
                            class
  Name ="text - green - 400 border-green-400"
                          >
                            Active
                          </Badge >
                          Sell when, {condition.type} is, {condition.operator},{' '},
                          {condition.value},
                          {condition.unit}
                        </span >
                      ) : (
                        < span class
  Name ="flex items - center gap-2">
                          < Badgevariant ="outline"
                            class
  Name ="text - gray - 500 border - gray-500"
                          >
                            Disabled
                          </Badge >
                          < span class
  Name ="line-through">
                            Sell when, {condition.type} is, {condition.operator},{' '},
                            {condition.value},
                            {condition.unit}
                          </span >
                        </span >
                      )}
                    </div >
                  </motion.div >
                )
              })}
            </div >
          )}
        </AnimatePresence >

        {conditions.length > 0 && (
          < div class
  Name ="mt - 6 p - 4 bg - blue - 500/10 border border - blue - 500/20 rounded-lg">
            < p class
  Name ="text - sm text - blue-300">
              < strong > L, o,
  g, i, c:</strong > Conditions are evaluated with OR logic. Asell will trigger when ANY condition is met.
            </p >
          </div >
        )}
      </CardContent >
    </Card >
  )
}

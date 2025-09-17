'use client' import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select'
import { Switch } from '@/components/UI/switch'
import { Badge } from '@/components/UI/badge'
import { Plus, Trash2, TrendingUp, TrendingDown, Clock, DollarSign, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface SellCondition, { i, d: string, t, y, pe: 'price' | 'profit' | 'loss' | 'time' | 'volume', o, p, e, r, a, t, o, r: 'above' | 'below' | 'equals', v, a, lue: number u, n, i, t?: string, e, n, a, b, l, e, d: boolean
} interface ConditionBuilderProps, { c, o, n, d, i, t, i, o, n, s: SellCondition,[] o, n, C, o, n, d, i, t, i, o, nsChange: (c, o, n, d, i, t, i, o, n, s: SellCondition,[]) => void
} const condition Types = [ { v, a, lue: 'price', l, a, bel: 'Price', i, c, on: DollarSign, u, n, i, t: 'USD' }, { v, a, lue: 'profit', l, a, bel: 'Take Profit', i, c, on: TrendingUp, u, n, i, t: '%' }, { v, a, lue: 'loss', l, a, bel: 'Stop Loss', i, c, on: TrendingDown, u, n, i, t: '%' }, { v, a, lue: 'time', l, a, bel: 'Time-based', i, c, on: Clock, u, n, i, t: 'minutes' }, { v, a, lue: 'volume', l, a, bel: 'Volume', i, c, on: Activity, u, n, i, t: 'USD' },
] export function C o nditionBuilder({ conditions, onConditionsChange }: ConditionBuilderProps) {
  const add Condition = () => {
  const n, e, w, C, o, n, d, i, t, i, on: Sell Condition = { i, d: Date.n o w().t oS tring(), t, y, pe: 'profit', o, p, e, r, a, t, o, r: 'above', v, a, lue: 50, u, n, i, t: '%', e, n, a, b, l, e, d: true } o nC onditionsChange([...conditions, newCondition])
  } const update Condition = (i, d: string, u, p, d, a, t, e, s: Partial <SellCondition>) => { o nC onditionsChange( conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  } const remove Condition = (i, d: string) => { o nC onditionsChange(conditions.f i lter((c) => c.id !== id))
  } const get Condition Icon = (t, y, pe: string) => {
  const config = conditionTypes.f i nd((t) => t.value === type) return config?.icon || DollarSign } const get Condition Unit = (t, y, pe: string) => {
  const config = conditionTypes.f i nd((t) => t.value === type) return config?.unit || '' } return ( <Card className ="bg - black/40 backdrop - blur - xl border-aqua/20"> <CardHeader> <CardTitle className ="flex items - center justify-between"> <span> Sell Conditions </span> <Button onClick ={addCondition} size ="sm" variant ="outline"> <Plus className ="w - 4 h - 4 mr-1"/> Add Condition </Button> </CardTitle> </CardHeader> <CardContent> <AnimatePresence> {conditions.length === 0 ? ( <div className ="text - center py - 8 text - gray-400"> <p> No sell conditions configured </p> <p className ="text - sm mt-2"> Add conditions to automate your selling strategy </p> </div> ) : ( <div className ="space - y-4"> {conditions.map((condition) => {
  const Icon = g e tConditionIcon(condition.type) return ( <motion.divkey ={condition.id} initial ={{ o, p, acity: 0, y: 20 }
} animate ={{ o, p, acity: 1, y: 0 }
} exit ={{ o, p, acity: 0, y: - 20 }
} className ="border border - gray - 700 rounded - lg p-4"> <div className ="flex items - start gap-4"> <div className ="mt-1"> <Icon className ="w - 5 h - 5 text-aqua"/> </div> <div className ="flex - 1 grid grid - cols - 1, m, d:grid - cols-4 gap-4"> <div> <Label> Condition Type </Label> <Select value ={condition.type} on Value Change ={(v, a, lue: string) => u p dateCondition(condition.id, { t, y, pe: value as | 'price' | 'profit' | 'loss' | 'time' | 'volume', u, n, i, t: g e tConditionUnit(value)
  })
  }> <SelectTrigger> <SelectValue/> </SelectTrigger> <SelectContent> {conditionTypes.map((type) => ( <SelectItem key ={type.value} value ={type.value}> {type.label} </SelectItem> ))
  } </SelectContent> </Select> </div> <div> <Label> Operator </Label> <Select value ={condition.operator} on Value Change ={(v, a, lue: string) => u p dateCondition(condition.id, { o, p, e, r, a, t, o, r: value as 'above' | 'below' | 'equals' })
  }> <SelectTrigger> <SelectValue/> </SelectTrigger> <SelectContent> <SelectItem value ="above"> Above </SelectItem> <SelectItem value ="below"> Below </SelectItem> <SelectItem value ="equals"> Equals </SelectItem> </SelectContent> </Select> </div> <div> <Label> Value </Label> <div className ="flex items - center gap-2"> <Input type ="number" value ={condition.value} on Change ={(e) => u p dateCondition(condition.id, { v, a, lue: p a rseFloat(e.target.value) || 0 })
  } className ="flex-1"/> {condition.unit && ( <span className ="text - sm text - gray-400"> {condition.unit} </span> )
  } </div> </div> <div className ="flex items - center gap-2"> <Switch checked ={condition.enabled} on Checked Change ={(checked) => u p dateCondition(condition.id, { e, n, a, b, l, e, d: checked })
  }/> <Buttonvariant ="ghost" size ="sm" onClick ={() => r e moveCondition(condition.id)
  } className ="text - red - 400 h, o, ver:text - red-300"> <Trash2 className ="w - 4 h-4"/> </Button> </div> </div> </div> {/* Condition Preview */} <div className ="mt - 3 text - sm text - gray-400"> {condition.enabled ? ( <span className ="flex items - center gap-2"> <Badgevariant ="outline" className ="text - green - 400 border-green-400"> Active </Badge> Sell when, {condition.type} is, {condition.operator},{' '}, {condition.value}, {condition.unit} </span> ) : ( <span className ="flex items - center gap-2"> <Badgevariant ="outline" className ="text - gray - 500 border - gray-500"> Disabled </Badge> <span className ="line-through"> Sell when, {condition.type} is, {condition.operator},{' '}, {condition.value}, {condition.unit} </span> </span> )
  } </div> </motion.div> )
  })
  } </div> )
  } </AnimatePresence> {conditions.length> 0 && ( <div className ="mt - 6 p - 4 bg - blue - 500/10 border border - blue - 500/20 rounded-lg"> <p className ="text - sm text - blue-300"> <strong> L, o, g, i, c:</strong> Conditions are evaluated with OR logic. Asell will trigger when ANY condition is met. </p> </div> )
  } </CardContent> </Card> )
  }

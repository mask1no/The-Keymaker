'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
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

export interface SellCondition {
  id: string
  type: 'price' | 'profit' | 'loss' | 'time' | 'volume'
  operator: 'above' | 'below' | 'equals'
  value: number
  unit?: string
  enabled: boolean
}

interface ConditionBuilderProps {
  conditions: SellCondition[]
  onConditionsChange: (conditions: SellCondition[]) => void
}

const conditionTypes = [
  { value: 'price', label: 'Price', icon: DollarSign, unit: 'USD' },
  { value: 'profit', label: 'Take Profit', icon: TrendingUp, unit: '%' },
  { value: 'loss', label: 'Stop Loss', icon: TrendingDown, unit: '%' },
  { value: 'time', label: 'Time-based', icon: Clock, unit: 'minutes' },
  { value: 'volume', label: 'Volume', icon: Activity, unit: 'USD' },
]

export function ConditionBuilder({
  conditions,
  onConditionsChange,
}: ConditionBuilderProps) {
  const addCondition = () => {
    const newCondition: SellCondition = {
      id: Date.now().toString(),
      type: 'profit',
      operator: 'above',
      value: 50,
      unit: '%',
      enabled: true,
    }
    onConditionsChange([...conditions, newCondition])
  }

  const updateCondition = (id: string, updates: Partial<SellCondition>) => {
    onConditionsChange(
      conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    )
  }

  const removeCondition = (id: string) => {
    onConditionsChange(conditions.filter((c) => c.id !== id))
  }

  const getConditionIcon = (type: string) => {
    const config = conditionTypes.find((t) => t.value === type)
    return config?.icon || DollarSign
  }

  const getConditionUnit = (type: string) => {
    const config = conditionTypes.find((t) => t.value === type)
    return config?.unit || ''
  }

  return (
    <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Sell Conditions</span>
          <Button onClick={addCondition} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add Condition
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence>
          {conditions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No sell conditions configured</p>
              <p className="text-sm mt-2">
                Add conditions to automate your selling strategy
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {conditions.map((condition) => {
                const Icon = getConditionIcon(condition.type)
                return (
                  <motion.div
                    key={condition.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <Icon className="w-5 h-5 text-aqua" />
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Condition Type</Label>
                          <Select
                            value={condition.type}
                            onValueChange={(value: string) =>
                              updateCondition(condition.id, {
                                type: value as 'price' | 'profit' | 'loss' | 'time' | 'volume',
                                unit: getConditionUnit(value),
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {conditionTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Operator</Label>
                          <Select
                            value={condition.operator}
                            onValueChange={(value: string) =>
                              updateCondition(condition.id, { operator: value as 'above' | 'below' | 'equals' })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="above">Above</SelectItem>
                              <SelectItem value="below">Below</SelectItem>
                              <SelectItem value="equals">Equals</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Value</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={condition.value}
                              onChange={(e) =>
                                updateCondition(condition.id, {
                                  value: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="flex-1"
                            />
                            {condition.unit && (
                              <span className="text-sm text-gray-400">
                                {condition.unit}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={condition.enabled}
                            onCheckedChange={(checked) =>
                              updateCondition(condition.id, {
                                enabled: checked,
                              })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCondition(condition.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Condition Preview */}
                    <div className="mt-3 text-sm text-gray-400">
                      {condition.enabled ? (
                        <span className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-green-400 border-green-400"
                          >
                            Active
                          </Badge>
                          Sell when {condition.type} is {condition.operator}{' '}
                          {condition.value}
                          {condition.unit}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-gray-500 border-gray-500"
                          >
                            Disabled
                          </Badge>
                          <span className="line-through">
                            Sell when {condition.type} is {condition.operator}{' '}
                            {condition.value}
                            {condition.unit}
                          </span>
                        </span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>

        {conditions.length > 0 && (
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Logic:</strong> Conditions are evaluated with OR logic. A
              sell will trigger when ANY condition is met.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

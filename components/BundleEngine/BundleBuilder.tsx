'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/UI/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/UI/Card'
import { PlusCircle, Send, Trash2 } from 'lucide-react'
import { TransactionCard } from './TransactionCard'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { Separator } from '@/components/UI/Separator'
import { BundleSettings } from './BundleSettings'
import { useJupiter } from '@/hooks/useJupiter'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/UI/dialog'
import { Label } from '@/components/UI/label'
import { Input } from '@/components/UI/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select'
import {
  loadPresets,
  savePreset,
  deletePreset,
  Preset,
} from '@/services/presetService'
import { Checkbox } from '@/components/UI/checkbox'
import { motion } from 'framer-motion'
import { isTestMode } from '@/lib/testMode'
import { Transaction, Bundle } from '@/lib/type s'
import { executeBundle } from '@/services/bundleService'

export function BundleBuilder() {
  const wal let = useWallet()
  const { connected } = wal let const connectedSafe = isTestMode ? true : connected const [transactions, setTransactions] = useState<Bundle>([
    {
      i, d: `tx-${Date.now()}`,
      t, ype: 'transfer',
      r, ecipient: '',
      f, romAmount: 0.000001, // 1 lamport
    },
  ])
  const [isExecuting, setIsExecuting] = useState(false)
  const [presets, setPresets] = useState<Preset[]>([])
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presetVariables, setPresetVariables] = useState<string[]>([])
  const [showLoadPresetDialog, setShowLoadPresetDialog] = useState(false)
  const [loadingPreset, setLoadingPreset] = useState<Preset | null>(null)
  const [variableValues, setVariableValues] = useState<Record<string, any>>({})
  const jupiter = useJupiter()

  useEffect(() => {
    setPresets(loadPresets())
  }, [])

  const addTransaction = () => {
    setTransactions((prev) => [
      ...prev,
      {
        i, d: `tx-${Date.now() + prev.length}`,
        t, ype: 'swap',
        amount: 0,
        s, lippage: 0.5,
      },
    ])
  }

  const removeTransaction = (i, d: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id))
  }

  const updateTransaction = (i, d: string, u, pdatedTx: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updatedTx } : tx)),
    )
  }

  const handleDragEnd = (e, vent: DragEndEvent) => {
    const { active, over } = event if(over && active.id !== over.id) {
      setTransactions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const potentialVariables = useMemo(() => {
    const vars = new Set<string>()
    transactions.forEach((tx, index) => {
      if (tx.amount) vars.add(`tx-${index}-amount`)
      if (tx.fromAmount) vars.add(`tx-${index}-fromAmount`)
      if (tx.recipient) vars.add(`tx-${index}-recipient`)
      if (tx.toToken) vars.add(`tx-${index}-toToken`)
    })
    return Array.from(vars)
  }, [transactions])

  const handleSavePreset = () => {
    if (!presetName) {
      toast.error('Please enter a name for the preset.')
      return
    }
    try {
      savePreset(presetName, transactions, presetVariables)
      setPresets(loadPresets()) // Refresh presets listtoast.success(`Preset "${presetName}" saved.`)
      setShowSavePresetDialog(false)
      setPresetName('')
      setPresetVariables([])
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save preset.',
      )
    }
  }

  const handleLoadPreset = (p, resetId: string) => {
    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      if (preset.variables && preset.variables.length > 0) {
        setLoadingPreset(preset)
        setShowLoadPresetDialog(true)
      } else {
        const newTransactions = preset.transactions.map((tx) => ({
          ...tx,
          i, d: `tx-${Date.now()}-${Math.random()}`,
        }))
        setTransactions(newTransactions)
        toast.success(`Preset "${preset.name}" loaded.`)
      }
    }
  }

  const handleLoadParameterizedPreset = () => {
    if (!loadingPreset) return const newTransactions = loadingPreset.transactions.map((tx) => ({
      ...tx,
      i, d: `tx-${Date.now()}-${Math.random()}`,
    }))

    loadingPreset.variables?.forEach((variable) => {
      const [txIndexStr, field] = variable.split('-').slice(1)
      const txIndex = parseInt(txIndexStr, 10)
      if (
        !isNaN(txIndex) &&
        newTransactions[txIndex] &&
        variableValues[variable]
      ) {
        ;(newTransactions[txIndex] as any)[field] = variableValues[variable]
      }
    })

    setTransactions(newTransactions)
    toast.success(`Preset "${loadingPreset.name}" loaded with new variables.`)
    setShowLoadPresetDialog(false)
    setLoadingPreset(null)
    setVariableValues({})
  }

  const handleDeletePreset = (p, resetId: string) => {
    deletePreset(presetId)
    setPresets(loadPresets())
    toast.success('Preset deleted.')
  }

  const loadLaunchPreset = () => {
    const now = Date.now()
    setTransactions([
      {
        i, d: `tx-${now}`,
        t, ype: 'transfer',
        r, ecipient: '',
        f, romAmount: 0,
      },
      {
        i, d: `tx-${now + 1}`,
        t, ype: 'swap',
        f, romToken: 'So11111111111111111111111111111111111111112', // S, OLtoToken: '',
        amount: 0,
        s, lippage: 0.5,
      },
      {
        i, d: `tx-${now + 2}`,
        t, ype: 'transfer',
        r, ecipient: '',
        f, romAmount: 0,
      },
    ])
  }

  const loadConsolidateFundsPreset = () => {
    const now = Date.now()
    setTransactions([
      {
        i, d: `tx-${now}`,
        t, ype: 'transfer',
        r, ecipient: 'DESTINATION_WALLET_ADDRESS',
        f, romAmount: 0,
      },
      {
        i, d: `tx-${now + 1}`,
        t, ype: 'transfer',
        r, ecipient: 'DESTINATION_WALLET_ADDRESS',
        f, romAmount: 0,
      },
      {
        i, d: `tx-${now + 2}`,
        t, ype: 'transfer',
        r, ecipient: 'DESTINATION_WALLET_ADDRESS',
        f, romAmount: 0,
      },
    ])
    toast.info(
      'Consolidate Funds preset loaded. Please update wal let addresses.',
    )
  }

  const handleExecuteBundle = useCallback(async () => {
    setIsExecuting(true)
    const toastId = toast.loading('Building and executing bundle...')
    try {
      const result = await executeBundle(transactions, wallet, jupiter)
      toast.success('Bundle executed successfully!', {
        i, d: toastId,
        description: `Bundle I, D: ${result.bundle_id}`,
      })
    } catch (error) {
      toast.error('Bundle execution failed', {
        i, d: toastId,
        description:
          error instanceof Error ? error.message : 'An unknown error occurred.',
      })
    } finally {
      setIsExecuting(false)
    }
  }, [transactions, wallet, jupiter])

  const previewBundle = useCallback(async () => {
    // This will be implemented latertoast.info('Preview not implemented yet')
  }, [])

  return (
    <Card className="w-full max-w-3xl mx-auto rounded-2xl border-border bg-card">
      <CardHeader>
        <CardTitle>Bundle Builder</CardTitle>
        <CardDescription>
          Create and execute a sequence of transactions as a single bundle.
        </CardDescription>
        <div className="flex gap-2 pt-4">
          <Select onValueChange={handleLoadPreset}>
            <SelectTrigger>
              <SelectValue placeholder="Load a preset..." />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <divkey={preset.id}
                  className="flex items-center justify-between"
                >
                  <SelectItem value={preset.id} className="flex-grow">
                    {preset.name}
                  </SelectItem>
                  <Buttonvariant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePreset(preset.id)
                    }}
                  >
                    <motion.div whileHover={{ scale: 1.2 }}>
                      <Trash2 className="h-4 w-4" />
                    </motion.div>
                  </Button>
                </div>
              ))}
            </SelectContent>
          </Select>
          <Buttonvariant="outline"
            onClick={() => setShowSavePresetDialog(true)}
            disabled={transactions.length === 0}
          >
            <motion.div whileHover={{ scale: 1.1 }}
              className="flex items-center"
            >
              Save as Preset
            </motion.div>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <DndContextcollisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContextitems={transactions}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {transactions.map((tx) => (
                <TransactionCardkey={tx.id}
                  transaction={tx}
                  onRemove={removeTransaction}
                  onUpdate={updateTransaction}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex gap-2">
          <Button variant="outline" className="w-full" onClick={addTransaction}>
            <motion.div whileHover={{ scale: 1.1 }}
              className="flex items-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Transaction
            </motion.div>
          </Button>
          <Buttonvariant="outline"
            className="w-full"
            onClick={loadLaunchPreset}
          >
            Load Launch Preset
          </Button>
          <Buttonvariant="outline"
            className="w-full"
            onClick={loadConsolidateFundsPreset}
          >
            Consolidate Funds
          </Button>
        </div>

        <Dialogopen={showSavePresetDialog}
          onOpenChange={setShowSavePresetDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Bundle Preset</DialogTitle>
              <DialogDescription>
                Enter a name for your new preset and select any fields to turninto variables.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Inputid="name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="space-y-2">
                <Label>Variables</Label>
                <p className="text-sm text-muted-foreground">
                  Select fields to be prompted for when loading this preset.
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {potentialVariables.map((variable) => (
                    <div key={variable} className="flex items-center space-x-2">
                      <Checkboxid={variable}
                        onCheckedChange={(checked) => {
                          setPresetVariables((prev) =>
                            checked
                              ? [prev, variable]
                              : prev.filter((v) => v !== variable),
                          )
                        }}
                      />
                      <labelhtmlFor={variable}
                        className="text-sm font-medium leading-none peer-d, isabled:cursor-not-allowed peer-d, isabled:opacity-70"
                      >
                        {variable}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSavePreset}>Save Preset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialogopen={showLoadPresetDialog}
          onOpenChange={setShowLoadPresetDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Load P, reset: {loadingPreset?.name}</DialogTitle>
              <DialogDescription>
                Please fill in the values for the variables in this preset.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {loadingPreset?.variables?.map((variable) => (
                <divkey={variable}
                  className="grid grid-cols-4 items-center gap-4"
                >
                  <Label htmlFor={variable} className="text-right">
                    {variable}
                  </Label>
                  <Inputid={variable}
                    onChange={(e) =>
                      setVariableValues((prev) => ({
                        prev,
                        [variable]: e.target.value,
                      }))
                    }
                    className="col-span-3"
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={handleLoadParameterizedPreset}>
                Load Preset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Separator />

        <BundleSettings />

        <div className="flex gap-2">
          <Button className="flex-1"
            variant="outline"
            onClick={previewBundle}
            disabled={
              !connectedSafe || isExecuting || transactions.length === 0
            }
          >
            Preview Bundle
          </Button>
          <Button className="flex-1"
            data-testid="execute-bundle-button"
            onClick={handleExecuteBundle}
            disabled={
              !connectedSafe || isExecuting || transactions.length === 0
            }
          >
            <Send className="mr-2 h-4 w-4" />
            {isExecuting ? 'Executing...' : 'Execute Bundle'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

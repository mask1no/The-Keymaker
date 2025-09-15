'use client'

import { useState, useCallback, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/UI/button'
import {
  Card,
  CardContent,
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
  VersionedTransaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  TransactionMessage,
} from '@solana/web3.js'
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
import { useEffect } from 'react'
import { Checkbox } from '@/components/UI/checkbox'
import { motion } from 'framer-motion'
import { isTestMode, testPubkeyBase58 } from '@/lib/testMode'

export type Transaction = {
  id: string
  type: 'swap' | 'transfer'
  // Swap specific
  fromToken?: string
  toToken?: string
  amount?: number
  slippage?: number
  // Transfer specific
  recipient?: string
  // Common
  fromAmount?: number
}

export type Bundle = Transaction[]

export function BundleBuilder() {
  const { connected, publicKey, signAllTransactions } = useWallet()
  const testPublicKey = isTestMode ? new PublicKey(testPubkeyBase58) : null
  const connectedSafe = isTestMode ? true : connected
  const publicKeySafe = isTestMode ? testPublicKey! : publicKey!
  const signTxSafe = isTestMode
    ? async (tx: any) => tx // no-op signer
    : signAllTransactions
  const [transactions, setTransactions] = useState<Bundle>([
    {
      id: `tx-${Date.now()}`,
      type: 'transfer',
      recipient: '',
      fromAmount: 0.000001, // 1 lamport
    },
  ])
  const [isExecuting, setIsExecuting] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [presets, setPresets] = useState<Preset[]>([])
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presetVariables, setPresetVariables] = useState<string[]>([])
  const [showLoadPresetDialog, setShowLoadPresetDialog] = useState(false)
  const [loadingPreset, setLoadingPreset] = useState<Preset | null>(null)
  const [variableValues, setVariableValues] = useState<Record<string, any>>({})
  const { getQuote, getSwapTransaction, connection } = useJupiter()

  useEffect(() => {
    setPresets(loadPresets())
  }, [])

  const addTransaction = () => {
    setTransactions((prev) => [
      ...prev,
      {
        id: `tx-${Date.now() + prev.length}`,
        type: 'swap',
        amount: 0,
        slippage: 0.5,
      },
    ])
  }

  const removeTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id))
  }

  const updateTransaction = (id: string, updatedTx: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updatedTx } : tx)),
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
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
      setPresets(loadPresets()) // Refresh presets list
      toast.success(`Preset "${presetName}" saved.`)
      setShowSavePresetDialog(false)
      setPresetName('')
      setPresetVariables([])
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save preset.',
      )
    }
  }

  const handleLoadPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      if (preset.variables && preset.variables.length > 0) {
        setLoadingPreset(preset)
        setShowLoadPresetDialog(true)
      } else {
        const newTransactions = preset.transactions.map((tx) => ({
          ...tx,
          id: `tx-${Date.now()}-${Math.random()}`,
        }))
        setTransactions(newTransactions)
        toast.success(`Preset "${preset.name}" loaded.`)
      }
    }
  }

  const handleLoadParameterizedPreset = () => {
    if (!loadingPreset) return

    const newTransactions = loadingPreset.transactions.map((tx) => ({
      ...tx,
      id: `tx-${Date.now()}-${Math.random()}`,
    }))

    loadingPreset.variables?.forEach((variable) => {
      const [txIndexStr, field] = variable.split('-').slice(1)
      const txIndex = parseInt(txIndexStr, 10)
      if (
        !isNaN(txIndex) &&
        newTransactions[txIndex] &&
        variableValues[variable]
      ) {
        (newTransactions[txIndex] as any)[field] = variableValues[variable]
      }
    })

    setTransactions(newTransactions)
    toast.success(`Preset "${loadingPreset.name}" loaded with new variables.`)
    setShowLoadPresetDialog(false)
    setLoadingPreset(null)
    setVariableValues({})
  }

  const handleDeletePreset = (presetId: string) => {
    deletePreset(presetId)
    setPresets(loadPresets())
    toast.success('Preset deleted.')
  }

  const loadLaunchPreset = () => {
    const now = Date.now()
    setTransactions([
      {
        id: `tx-${now}`,
        type: 'transfer',
        recipient: '',
        fromAmount: 0,
      },
      {
        id: `tx-${now + 1}`,
        type: 'swap',
        fromToken: 'So11111111111111111111111111111111111111112', // SOL
        toToken: '',
        amount: 0,
        slippage: 0.5,
      },
      {
        id: `tx-${now + 2}`,
        type: 'transfer',
        recipient: '',
        fromAmount: 0,
      },
    ])
  }

  const loadConsolidateFundsPreset = () => {
    const now = Date.now()
    setTransactions([
      {
        id: `tx-${now}`,
        type: 'transfer',
        recipient: 'DESTINATION_WALLET_ADDRESS',
        fromAmount: 0,
      },
      {
        id: `tx-${now + 1}`,
        type: 'transfer',
        recipient: 'DESTINATION_WALLET_ADDRESS',
        fromAmount: 0,
      },
      {
        id: `tx-${now + 2}`,
        type: 'transfer',
        recipient: 'DESTINATION_WALLET_ADDRESS',
        fromAmount: 0,
      },
    ])
    toast.info(
      'Consolidate Funds preset loaded. Please update wallet addresses.',
    )
  }

  const executeBundle = useCallback(async () => {
    if (!connectedSafe || !publicKeySafe || !signTxSafe) {
      toast.error('Please connect your wallet.')
      return
    }

    setIsExecuting(true)
    const toastId = toast.loading('Building and executing bundle...')

    try {
      const builtTransactions: VersionedTransaction[] = []

      for (const tx of transactions) {
        if (tx.type === 'swap') {
          if (!tx.fromToken || !tx.toToken || !tx.amount || tx.amount <= 0) {
            throw new Error(`Invalid swap parameters for transaction ${tx.id}`)
          }
          const quote = await getQuote(
            tx.fromToken,
            tx.toToken,
            tx.amount,
            (tx.slippage || 0.5) * 100,
          )
          if (!quote) {
            throw new Error(`Could not get a quote for transaction ${tx.id}`)
          }
          const swapResult = await getSwapTransaction(
            quote,
            publicKeySafe.toBase58(),
          )
          if (!swapResult?.swapTransaction) {
            throw new Error(`Could not build swap transaction ${tx.id}`)
          }
          const swapTx = VersionedTransaction.deserialize(
            Buffer.from(swapResult.swapTransaction, 'base64'),
          )
          builtTransactions.push(swapTx)
        }
        // Handle 'transfer' type - minimal lamport transfer
        if (tx.type === 'transfer') {
          if (!tx.recipient || !tx.fromAmount || tx.fromAmount <= 0) {
            throw new Error(
              `Invalid transfer parameters for transaction ${tx.id}`,
            )
          }
          const recipientPubKey = new PublicKey(tx.recipient)
          const lamports = Math.max(
            1,
            Math.floor(tx.fromAmount * LAMPORTS_PER_SOL),
          )

          const transferInstruction = SystemProgram.transfer({
            fromPubkey: publicKeySafe,
            toPubkey: recipientPubKey,
            lamports: lamports,
          })

          const { blockhash } = await connection.getLatestBlockhash()
          const message = new TransactionMessage({
            payerKey: publicKeySafe,
            recentBlockhash: blockhash,
            instructions: [transferInstruction],
          }).compileToV0Message()

          const transferTx = new VersionedTransaction(message)
          builtTransactions.push(transferTx)
        }
      }

      if (builtTransactions.length === 0) {
        throw new Error('No valid transactions to bundle.')
      }

      // In a real scenario with a backend that can't sign,
      // you would sign the transactions on the client-side.
      // const signedTransactions = await signTxSafe(builtTransactions);

      const serializedTxs = builtTransactions.map((tx) =>
        Buffer.from(tx.serialize()).toString('base64'),
      )

      const response = await fetch('/api/bundles/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txs_b64: serializedTxs, region: 'ffm' }), // region can be dynamic
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit bundle')
      }

      // Record to history
      try {
        await fetch('/api/history/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bundle_id: result.bundle_id,
            region: 'ffm',
            signatures: result.signatures || [],
            status: 'pending',
            tip_sol: 0.00005, // 50k lamports default
          }),
        })
      } catch (historyError) {
        console.warn('Failed to record to history:', historyError)
      }

      toast.success('Bundle executed successfully!', {
        id: toastId,
        description: `Bundle ID: ${result.bundle_id}`,
      })
    } catch (error) {
      toast.error('Bundle execution failed', {
        id: toastId,
        description:
          error instanceof Error ? error.message : 'An unknown error occurred.',
      })
    } finally {
      setIsExecuting(false)
    }
  }, [
    transactions,
    connectedSafe,
    publicKeySafe,
    getQuote,
    getSwapTransaction,
    signTxSafe,
  ])

  const previewBundle = useCallback(async () => {
    if (!connectedSafe || !publicKeySafe) {
      toast.error('Please connect your wallet.')
      return
    }

    setIsPreviewing(true)
    const toastId = toast.loading('Simulating bundle...')

    try {
      const builtTransactions: VersionedTransaction[] = []

      for (const tx of transactions) {
        if (tx.type === 'swap') {
          if (!tx.fromToken || !tx.toToken || !tx.amount || tx.amount <= 0) {
            throw new Error(`Invalid swap parameters for transaction ${tx.id}`)
          }
          const quote = await getQuote(
            tx.fromToken,
            tx.toToken,
            tx.amount,
            (tx.slippage || 0.5) * 100,
          )
          if (!quote) {
            throw new Error(`Could not get a quote for transaction ${tx.id}`)
          }
          const swapResult = await getSwapTransaction(
            quote,
            publicKeySafe.toBase58(),
          )
          if (!swapResult?.swapTransaction) {
            throw new Error(`Could not build swap transaction ${tx.id}`)
          }
          const swapTx = VersionedTransaction.deserialize(
            Buffer.from(swapResult.swapTransaction, 'base64'),
          )
          builtTransactions.push(swapTx)
        }
        // Handle 'transfer' type - minimal lamport transfer
        if (tx.type === 'transfer') {
          if (!tx.recipient || !tx.fromAmount || tx.fromAmount <= 0) {
            throw new Error(
              `Invalid transfer parameters for transaction ${tx.id}`,
            )
          }
          const recipientPubKey = new PublicKey(tx.recipient)
          const lamports = Math.max(
            1,
            Math.floor(tx.fromAmount * LAMPORTS_PER_SOL),
          )

          const transferInstruction = SystemProgram.transfer({
            fromPubkey: publicKeySafe,
            toPubkey: recipientPubKey,
            lamports: lamports,
          })

          const { blockhash } = await connection.getLatestBlockhash()
          const message = new TransactionMessage({
            payerKey: publicKeySafe,
            recentBlockhash: blockhash,
            instructions: [transferInstruction],
          }).compileToV0Message()

          const transferTx = new VersionedTransaction(message)
          builtTransactions.push(transferTx)
        }
      }

      if (builtTransactions.length === 0) {
        throw new Error('No valid transactions to bundle.')
      }

      const serializedTxs = builtTransactions.map((tx) =>
        Buffer.from(tx.serialize()).toString('base64'),
      )

      const response = await fetch('/api/bundles/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txs_b64: serializedTxs,
          region: 'ffm',
          simulateOnly: true,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Simulation failed')
      }

      toast.success('Bundle simulation successful!', {
        id: toastId,
        description: `${builtTransactions.length} transactions simulated successfully`,
      })
    } catch (error) {
      toast.error('Bundle simulation failed', {
        id: toastId,
        description:
          error instanceof Error ? error.message : 'An unknown error occurred.',
      })
    } finally {
      setIsPreviewing(false)
    }
  }, [
    transactions,
    connectedSafe,
    publicKeySafe,
    getQuote,
    getSwapTransaction,
    connection,
  ])

  return (
    <Card className="w-full max-w-3xl mx-auto">
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
                <div
                  key={preset.id}
                  className="flex items-center justify-between"
                >
                  <SelectItem value={preset.id} className="flex-grow">
                    {preset.name}
                  </SelectItem>
                  <Button
                    variant="ghost"
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
          <Button
            variant="outline"
            onClick={() => setShowSavePresetDialog(true)}
            disabled={transactions.length === 0}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex items-center"
            >
              Save as Preset
            </motion.div>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={transactions}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {transactions.map((tx) => (
                <TransactionCard
                  key={tx.id}
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
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex items-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Transaction
            </motion.div>
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={loadLaunchPreset}
          >
            Load Launch Preset
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={loadConsolidateFundsPreset}
          >
            Consolidate Funds
          </Button>
        </div>

        <Dialog
          open={showSavePresetDialog}
          onOpenChange={setShowSavePresetDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Bundle Preset</DialogTitle>
              <DialogDescription>
                Enter a name for your new preset and select any fields to turn
                into variables.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
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
                      <Checkbox
                        id={variable}
                        onCheckedChange={(checked) => {
                          setPresetVariables((prev) =>
                            checked
                              ? [...prev, variable]
                              : prev.filter((v) => v !== variable),
                          )
                        }}
                      />
                      <label
                        htmlFor={variable}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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

        <Dialog
          open={showLoadPresetDialog}
          onOpenChange={setShowLoadPresetDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Load Preset: {loadingPreset?.name}</DialogTitle>
              <DialogDescription>
                Please fill in the values for the variables in this preset.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {loadingPreset?.variables?.map((variable) => (
                <div
                  key={variable}
                  className="grid grid-cols-4 items-center gap-4"
                >
                  <Label htmlFor={variable} className="text-right">
                    {variable}
                  </Label>
                  <Input
                    id={variable}
                    onChange={(e) =>
                      setVariableValues((prev) => ({
                        ...prev,
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
          <Button
            className="flex-1"
            variant="outline"
            onClick={previewBundle}
            disabled={
              !connectedSafe ||
              isPreviewing ||
              isExecuting ||
              transactions.length === 0
            }
          >
            {isPreviewing ? 'Simulating...' : 'Preview Bundle'}
          </Button>
          <Button
            className="flex-1"
            data-testid="execute-bundle-button"
            onClick={executeBundle}
            disabled={
              !connectedSafe ||
              isExecuting ||
              isPreviewing ||
              transactions.length === 0
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

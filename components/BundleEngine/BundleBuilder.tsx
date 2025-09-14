'use client'

import { useState, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/UI/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/UI/Card'
import { PlusCircle, Send } from 'lucide-react'
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
  const [transactions, setTransactions] = useState<Bundle>([
    { id: `tx-${Date.now()}`, type: 'swap', amount: 0, slippage: 0.5 },
  ])
  const [isExecuting, setIsExecuting] = useState(false)
  const { getQuote, getSwapTransaction, connection } = useJupiter()

  const addTransaction = () => {
    setTransactions((prev) => [
      ...prev,
      { id: `tx-${Date.now() + prev.length}`, type: 'swap', amount: 0, slippage: 0.5 },
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

  const executeBundle = useCallback(async () => {
    if (!connected || !publicKey || !signAllTransactions) {
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
          const swapResult = await getSwapTransaction(quote, publicKey.toBase58())
          if (!swapResult?.swapTransaction) {
            throw new Error(`Could not build swap transaction ${tx.id}`)
          }
          const swapTx = VersionedTransaction.deserialize(Buffer.from(swapResult.swapTransaction, 'base64'))
          builtTransactions.push(swapTx)
        }
        // Handle 'transfer' type here in the future
        if (tx.type === 'transfer') {
            if (!tx.recipient || !tx.fromAmount || tx.fromAmount <= 0) {
                throw new Error(`Invalid transfer parameters for transaction ${tx.id}`);
            }
            const recipientPubKey = new PublicKey(tx.recipient);
            const lamports = tx.fromAmount * LAMPORTS_PER_SOL;
            
            const transferInstruction = SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: recipientPubKey,
                lamports: lamports,
            });

            const { blockhash } = await connection.getLatestBlockhash();
            const message = new TransactionMessage({
                payerKey: publicKey,
                recentBlockhash: blockhash,
                instructions: [transferInstruction],
            }).compileToV0Message();

            const transferTx = new VersionedTransaction(message);
            builtTransactions.push(transferTx);
        }
      }
      
      if(builtTransactions.length === 0) {
        throw new Error("No valid transactions to bundle.")
      }

      // In a real scenario with a backend that can't sign,
      // you would sign the transactions on the client-side.
      // const signedTransactions = await signAllTransactions(builtTransactions);
      
      const serializedTxs = builtTransactions.map(tx => 
        Buffer.from(tx.serialize()).toString('base64')
      );

      const response = await fetch('/api/bundles/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txs_b64: serializedTxs, region: 'ffm' }), // region can be dynamic
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit bundle')
      }
      
      toast.success('Bundle executed successfully!', {
        id: toastId,
        description: `Bundle ID: ${result.bundle_id}`,
      })

    } catch (error) {
      toast.error('Bundle execution failed', {
        id: toastId,
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      })
    } finally {
      setIsExecuting(false)
    }
  }, [transactions, connected, publicKey, getQuote, getSwapTransaction, signAllTransactions])

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Bundle Builder</CardTitle>
        <CardDescription>
          Create and execute a sequence of transactions as a single bundle.
        </CardDescription>
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

        <Button
          variant="outline"
          className="w-full"
          onClick={addTransaction}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>

        <Separator />

        <BundleSettings />

        <Button
          className="w-full"
          data-testid="execute-bundle-button"
          onClick={executeBundle}
          disabled={!connected || isExecuting || transactions.length === 0}
        >
          <Send className="mr-2 h-4 w-4" />
          {isExecuting ? 'Executing...' : 'Execute Bundle'}
        </Button>
      </CardContent>
    </Card>
  )
}

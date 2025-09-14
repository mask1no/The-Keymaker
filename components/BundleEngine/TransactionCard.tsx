'use client'

import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/UI/card'
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
import { Transaction } from './BundleBuilder'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TokenSelector } from './TokenSelector'
import { useState } from 'react'
import { Checkbox } from '@/components/UI/checkbox'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

const HARDCODED_TOKENS = [
    { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana' },
    { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin' },
];

interface TransactionCardProps {
  transaction: Transaction
  onRemove: (id: string) => void
  onUpdate: (id: string, updatedTx: Partial<Transaction>) => void
}

export function TransactionCard({
  transaction,
  onRemove,
  onUpdate,
}: TransactionCardProps) {
  const [securityScore, setSecurityScore] = useState<number | null>(null)
  const [isLoadingSecurity, setIsLoadingSecurity] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: transaction.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleTokenSelect = (tokenAddress: string, field: 'fromToken' | 'toToken') => {
    onUpdate(transaction.id, { [field]: tokenAddress })
  }

  const checkSecurity = async (tokenAddress: string | undefined) => {
    if (!tokenAddress) return
    setIsLoadingSecurity(true)
    try {
      const response = await fetch(
        `/api/security/check-token?tokenAddress=${tokenAddress}`,
      )
      const data = await response.json()
      if (response.ok) {
        setSecurityScore(data.safetyScore)
      } else {
        throw new Error(data.error || 'Failed to fetch security info')
      }
    } catch (error) {
      console.error(error)
      setSecurityScore(null)
    } finally {
      setIsLoadingSecurity(false)
    }
  }

  const renderContent = () => {
    switch (transaction.type) {
      case 'swap':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TokenSelector
              tokens={HARDCODED_TOKENS}
              isLoading={false}
              onSelect={(tokenAddress) => handleTokenSelect(tokenAddress, 'fromToken')}
              placeholder="From Token"
            />
            <TokenSelector
              tokens={HARDCODED_TOKENS}
              isLoading={false}
              onSelect={(tokenAddress) => handleTokenSelect(tokenAddress, 'toToken')}
              placeholder="To Token"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => checkSecurity(transaction.toToken)}
                disabled={isLoadingSecurity || !transaction.toToken}
              >
                <Shield className="mr-2 h-4 w-4" />
                {isLoadingSecurity ? 'Checking...' : 'Check Security'}
              </Button>
              {securityScore !== null && (
                <div
                  className={`text-sm font-bold ${
                    securityScore > 80
                      ? 'text-green-500'
                      : securityScore > 50
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  }`}
                >
                  Score: {securityScore}/100
                </div>
              )}
            </div>
            <Input
              type="number"
              placeholder="Amount"
              onChange={(e) => onUpdate(transaction.id, { amount: parseFloat(e.target.value) })}
            />
            <Input
              type="number"
              placeholder="Slippage (%)"
              onChange={(e) => onUpdate(transaction.id, { slippage: parseFloat(e.target.value) })}
            />
          </div>
        )
      case 'transfer':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Recipient Address"
              onChange={(e) => onUpdate(transaction.id, { recipient: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Amount (SOL)"
              onChange={(e) => onUpdate(transaction.id, { fromAmount: parseFloat(e.target.value) })}
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} data-testid={`transaction-card-${transaction.id}`}>
      <Card className="bg-background/50">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div {...listeners} className="cursor-grab">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <Select
              defaultValue={transaction.type}
              onValueChange={(value: 'swap' | 'transfer') =>
                onUpdate(transaction.id, { type: value })
              }
            >
              <SelectTrigger className="w-[120px]" data-testid="transaction-type-select">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="swap">Swap</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onRemove(transaction.id)} data-testid="remove-transaction-button">
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4">{renderContent()}</CardContent>
      </Card>
    </div>
  )
}

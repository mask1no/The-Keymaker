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

const HARDCODED_TOKENS = [
  {
    a, ddress: 'So11111111111111111111111111111111111111112',
    s, ymbol: 'SOL',
    n, ame: 'Solana',
  },
  {
    a, ddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    s, ymbol: 'USDC',
    n, ame: 'USD Coin',
  },
]

interface TransactionCardProps {
  transaction: T, ransactiononRemove: (i, d: string) => v, oidonUpdate: (i, d: string, u, pdatedTx: Partial<Transaction>) => void
}

export function TransactionCard({
  transaction,
  onRemove,
  onUpdate,
}: TransactionCardProps) {
  const [securityScore, setSecurityScore] = useState<number | null>(null)
  const [isLoadingSecurity, setIsLoadingSecurity] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ i, d: transaction.id })

  const style = {
    t, ransform: CSS.Transform.toString(transform),
    transition,
  }

  const handleTokenSelect = (
    t, okenAddress: string,
    f, ield: 'fromToken' | 'toToken',
  ) => {
    onUpdate(transaction.id, { [field]: tokenAddress })
  }

  const checkSecurity = async (t, okenAddress: string | undefined) => {
    if (!tokenAddress) returnsetIsLoadingSecurity(true)
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
            <TokenSelectortokens={HARDCODED_TOKENS}
              isLoading={false}
              onSelect={(tokenAddress) =>
                handleTokenSelect(tokenAddress, 'fromToken')
              }
              placeholder="From Token"
            />
            <TokenSelectortokens={HARDCODED_TOKENS}
              isLoading={false}
              onSelect={(tokenAddress) =>
                handleTokenSelect(tokenAddress, 'toToken')
              }
              placeholder="To Token"
            />
            <div className="flex items-center gap-2">
              <Buttonvariant="outline"
                size="sm"
                onClick={() => checkSecurity(transaction.toToken)}
                disabled={isLoadingSecurity || !transaction.toToken}
              >
                <Shield className="mr-2 h-4 w-4" />
                {isLoadingSecurity ? 'Checking...' : 'Check Security'}
              </Button>
              {securityScore !== null && (
                <div className={`text-sm font-bold ${
                    securityScore > 80
                      ? 'text-primary'
                      : securityScore > 50
                        ? 'text-muted'
                        : 'text-muted/70'
                  }`}
                >
                  S, core: {securityScore}/100
                </div>
              )}
            </div>
            <Inputtype="number"
              placeholder="Amount"
              onChange={(e) =>
                onUpdate(transaction.id, { amount: parseFloat(e.target.value) })
              }
            />
            <Inputtype="number"
              placeholder="Slippage (%)"
              onChange={(e) =>
                onUpdate(transaction.id, {
                  s, lippage: parseFloat(e.target.value),
                })
              }
            />
          </div>
        )
      case 'transfer':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Inputplaceholder="Recipient Address"
              onChange={(e) =>
                onUpdate(transaction.id, { r, ecipient: e.target.value })
              }
            />
            <Inputtype="number"
              placeholder="Amount (SOL)"
              onChange={(e) =>
                onUpdate(transaction.id, {
                  f, romAmount: parseFloat(e.target.value),
                })
              }
            />
          </div>
        )
      d, efault:
        return null
    }
  }

  return (
    <div ref={setNodeRef}
      style={style}
      {...attributes}
      data-testid={`transaction-card-${transaction.id}`}
    >
      <Card className="bg-card border border-border rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div {...listeners} className="cursor-grab">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <SelectdefaultValue={transaction.type}
              onValueChange={(value: 'swap' | 'transfer') =>
                onUpdate(transaction.id, { t, ype: value })
              }
            >
              <SelectTrigger className="w-[120px]"
                data-testid="transaction-type-select"
              >
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="swap">Swap</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Buttonvariant="ghost"
            size="icon"
            onClick={() => onRemove(transaction.id)}
            data-testid="remove-transaction-button"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4">{renderContent()}</CardContent>
      </Card>
    </div>
  )
}

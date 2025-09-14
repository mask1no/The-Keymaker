'use client'
import React, { useState } from 'react'
import { useKeymakerStore, ExecutionStep } from '@/lib/store'
import {
  Connection,
  LAMPORTS_PER_SOL,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { Button } from '@/components/UI/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select'
import { Badge } from '@/components/UI/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/UI/dialog'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import {
  Rocket,
  PlayCircle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'
import { fundWalletGroup } from '@/services/fundingService'
import { executeBundle } from '@/services/bundleService'
import { batchSellTokens, SellConditions } from '@/services/sellService'
import { launchToken } from '@/services/platformService'
import { buildSwapTransaction } from '@/services/jupiterService'
import { decryptAES256ToKeypair } from '@/utils/crypto'

async function getKeypairs(
  wallets: { encryptedPrivateKey: string }[],
  password: string,
): Promise<Keypair[]> {
  return Promise.all(
    wallets.map((w) => decryptAES256ToKeypair(w.encryptedPrivateKey, password)),
  )
}

export function ControlCenter() {
  const {
    wallets,
    tokenLaunchData,
    executionStrategy,
    executionSteps,
    isExecuting,
    jitoEnabled,
    tipAmount,
    autoSellDelay,
    setExecutionStrategy,
    startExecution,
    updateStepStatus,
    resetExecution,
  } = useKeymakerStore()

  const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
  const [currentStep, setCurrentStep] = useState(0)
  const [walletPassword, setWalletPassword] = useState('')
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [decryptedWallets, setDecryptedWallets] = useState<
    Map<string, Keypair>
  >(new Map())
  const [mintAddress, setMintAddress] = useState<string>('')

  // Get wallets by role
  const masterWallet = wallets.find((w) => w.role === 'master')
  const devWallets = wallets.filter((w) => w.role === 'dev')
  const sniperWallets = wallets.filter((w) => w.role === 'sniper')

  // Calculate progress
  const completedSteps = executionSteps.filter(
    (s) => s.status === 'completed',
  ).length
  const progress = (completedSteps / executionSteps.length) * 100

  // Decrypt wallets with password
  const decryptWallets = async (password: string) => {
    const decrypted = new Map<string, Keypair>()

    try {
      // Decrypt all wallets at once
      const walletsToDecrypt = wallets.filter((w) => w.encryptedPrivateKey)
      const keypairs = await getKeypairs(walletsToDecrypt as any[], password)

      walletsToDecrypt.forEach((wallet, index) => {
        if (keypairs[index]) {
          decrypted.set(wallet.publicKey, keypairs[index])
        }
      })
    } catch (error) {
      console.error('Failed to decrypt wallets:', error)
      throw error
    }

    return decrypted
  }

  // Execute the orchestration flow
  const executeKeymaker = async () => {
    // First check if we need to decrypt wallets
    const needsDecryption = wallets.some(
      (w) => w.encryptedPrivateKey && !decryptedWallets.has(w.publicKey),
    )

    if (needsDecryption) {
      setShowPasswordDialog(true)
      return
    }

    await runExecution()
  }

  const handlePasswordSubmit = async () => {
    if (!walletPassword) {
      toast.error('Password is required')
      return
    }

    try {
      const decrypted = await decryptWallets(walletPassword)
      if (decrypted.size === 0) {
        toast.error('Invalid password or no wallets to decrypt')
        return
      }

      setDecryptedWallets(decrypted)
      setShowPasswordDialog(false)
      setWalletPassword('')

      // Continue with execution
      await runExecution()
    } catch (error) {
      toast.error('Failed to decrypt wallets')
    }
  }

  const runExecution = async () => {
    // Get wallets with decrypted keypairs
    const getWalletWithKeypair = (publicKey: string): Keypair | null => {
      return decryptedWallets.get(publicKey) || null
    }

    const masterWallet = wallets.find((w) => w.role === 'master')
    const masterKeypair = masterWallet
      ? getWalletWithKeypair(masterWallet.publicKey)
      : null

    if (!masterKeypair) {
      toast.error('No master wallet keypair available')
      return
    }

    if (!tokenLaunchData) {
      toast.error('No token launch data configured')
      return
    }

    const sniperKeypairs = wallets
      .filter((w) => w.role === 'sniper')
      .map((w) => getWalletWithKeypair(w.publicKey))
      .filter((kp) => kp !== null) as Keypair[]

    if (sniperKeypairs.length === 0) {
      toast.error('No sniper wallet keypairs available')
      return
    }

    startExecution()
    setCurrentStep(0)

    try {
      // Step 1: Deploy Token with Liquidity
      updateStepStatus(
        'deploy',
        'running',
        'Deploying token and creating liquidity...',
      )

      const launchWalletPubkey = tokenLaunchData.walletPublicKey
      const launchKeypair = getWalletWithKeypair(launchWalletPubkey)
      if (!launchKeypair) {
        throw new Error('Launch wallet keypair not found')
      }

      const tokenResult = await launchToken(
        connection,
        launchKeypair,
        {
          name: tokenLaunchData.name,
          symbol: tokenLaunchData.symbol,
          decimals: tokenLaunchData.decimals,
          supply: tokenLaunchData.supply,
          description: `${tokenLaunchData.name} - Created with The Keymaker`,
        },
        {
          platform:
            tokenLaunchData.platform === 'pump.fun' ? 'pump.fun' : 'raydium',
          solAmount: tokenLaunchData.lpAmount,
          tokenAmount: tokenLaunchData.supply * 0.8, // 80% of supply to liquidity
        },
      )

      setMintAddress(tokenResult.token.mintAddress)
      updateStepStatus(
        'deploy',
        'completed',
        `Token deployed: ${tokenResult.token.mintAddress}`,
      )
      setCurrentStep(1)

      // Step 2: Fund Wallets
      updateStepStatus('fund', 'running', 'Funding sniper wallets...')

      const fundingResult = await fundWalletGroup(
        masterKeypair,
        sniperWallets.map((w) => ({ publicKey: w.publicKey, role: w.role })),
        10, // total funding
        0.5, // min SOL
        2.0, // max SOL
        connection,
      )

      if (!fundingResult || fundingResult.length === 0) {
        throw new Error('Funding failed')
      }

      updateStepStatus(
        'fund',
        'completed',
        `Funded ${fundingResult.length} wallets`,
      )
      setCurrentStep(2)

      // Step 3: Wait
      updateStepStatus(
        'wait-funding',
        'running',
        'Waiting for funds to settle...',
      )
      await new Promise((resolve) => setTimeout(resolve, 3000))
      updateStepStatus('wait-funding', 'completed')
      setCurrentStep(3)

      // Step 4: Bundle Buys
      updateStepStatus(
        'bundle',
        'running',
        'Creating and executing bundle buys...',
      )

      // Create swap transactions for each sniper wallet
      const transactions: Transaction[] = []
      const mintPubkey = new PublicKey(tokenResult.token.mintAddress)

      for (let i = 0; i < sniperKeypairs.length; i++) {
        const keypair = sniperKeypairs[i]
        const wallet = sniperWallets[i]

        // Calculate buy amount (use part of the funded amount)
        const buyAmountSol = (wallet.balance * 0.8) / LAMPORTS_PER_SOL // Use 80% of balance

        try {
          // Build swap transaction (SOL -> Token)
          const swapTx = await buildSwapTransaction(
            'So11111111111111111111111111111111111111112', // SOL
            mintPubkey.toBase58(),
            buyAmountSol * LAMPORTS_PER_SOL,
            keypair.publicKey.toBase58(),
            100, // 1% slippage
            10000, // priority fee
          )

          // Convert versioned transaction to legacy transaction for bundle
          const legacyTx = Transaction.from(swapTx.serialize())
          transactions.push(legacyTx)
        } catch (error) {
          console.error(
            `Failed to create swap transaction for wallet ${i}:`,
            error,
          )
        }
      }

      if (transactions.length === 0) {
        throw new Error('No swap transactions created')
      }

      // Execute based on strategy
      let bundleResult

      switch (executionStrategy) {
        case 'flash': {
          // Instant mode with Jito bundling
          updateStepStatus(
            'bundle',
            'running',
            'Executing instant bundle via Jito...',
          )
          bundleResult = await executeBundle(
            transactions,
            sniperWallets.map((w) => ({
              publicKey: w.publicKey,
              role: w.role,
            })),
            sniperKeypairs,
            {
              connection,
              tipAmount: tipAmount * LAMPORTS_PER_SOL,
              logger: (msg) => {
                updateStepStatus('bundle', 'running', msg)
              },
            },
          )
          break
        }

        case 'stealth': {
          // Delayed mode with staggered execution
          updateStepStatus(
            'bundle',
            'running',
            'Executing stealth mode with delays...',
          )
          const results: any = {
            metrics: { successRate: 0 },
            signatures: [],
            results: [],
          }
          let successCount = 0

          for (let i = 0; i < transactions.length; i++) {
            updateStepStatus(
              'bundle',
              'running',
              `Executing wallet ${i + 1}/${transactions.length}...`,
            )

            try {
              // Add random delay between transactions (2-5 seconds)
              if (i > 0) {
                const delay = 2000 + Math.random() * 3000
                await new Promise((resolve) => setTimeout(resolve, delay))
              }

              // Send individual transaction
              const signature = await connection.sendTransaction(
                transactions[i],
                [sniperKeypairs[i]],
                {
                  skipPreflight: false,
                  maxRetries: 2,
                },
              )

              results.signatures.push(signature)
              results.results.push('success')
              successCount++

              // Wait for confirmation
              await connection.confirmTransaction(signature, 'confirmed')
            } catch (error) {
              console.error(`Wallet ${i} transaction failed:`, error)
              results.signatures.push('')
              results.results.push('failed')
            }
          }

          results.metrics.successRate = successCount / transactions.length
          bundleResult = results
          break
        }

        case 'manual': {
          // Manual mode - prepare but don't execute
          updateStepStatus(
            'bundle',
            'completed',
            'Manual mode - transactions prepared for manual execution',
          )
          // Store transactions for manual execution
          // In a real implementation, you'd store these and provide UI controls
          bundleResult = {
            metrics: { successRate: 1 },
            signatures: [],
            results: [],
          }
          toast.success(
            'Transactions prepared. Use manual controls to execute.',
          )
          break
        }

        default: {
          // Regular mode - fast sequential execution
          updateStepStatus('bundle', 'running', 'Executing regular bundle...')
          const regularResults: any = {
            metrics: { successRate: 0 },
            signatures: [],
            results: [],
          }
          let regularSuccessCount = 0

          // Send all transactions as fast as possible
          const sendPromises = transactions.map(async (tx, i) => {
            try {
              const signature = await connection.sendTransaction(
                tx,
                [sniperKeypairs[i]],
                {
                  skipPreflight: false,
                  maxRetries: 2,
                },
              )
              return { success: true, signature, index: i }
            } catch (error) {
              return { success: false, signature: '', index: i, error }
            }
          })

          // Wait for all to complete
          const sendResults = await Promise.all(sendPromises)

          // Process results
          for (const result of sendResults) {
            if (result.success) {
              regularResults.signatures.push(result.signature)
              regularResults.results.push('success')
              regularSuccessCount++
            } else {
              regularResults.signatures.push('')
              regularResults.results.push('failed')
            }
          }

          regularResults.metrics.successRate =
            regularSuccessCount / transactions.length
          bundleResult = regularResults
          break
        }
      }

      updateStepStatus(
        'bundle',
        'completed',
        `Bundle executed: ${bundleResult.metrics.successRate * 100}% success`,
      )
      setCurrentStep(4)

      // Track holdings for successful purchases
      if (bundleResult.metrics.successRate > 0) {
        try {
          // Calculate average buy amount per wallet
          const totalBuyAmount = sniperWallets.reduce(
            (sum, w) => sum + (w.balance * 0.8) / LAMPORTS_PER_SOL,
            0,
          )
          const avgBuyAmount = totalBuyAmount / sniperWallets.length

          // Get current holdings from localStorage
          const existingHoldings = localStorage.getItem('tokenHoldings')
          const holdings = existingHoldings ? JSON.parse(existingHoldings) : []

          // Add new holding for this token
          const newHolding = {
            tokenAddress: mintPubkey.toBase58(),
            tokenName: tokenLaunchData.symbol || 'Unknown',
            amount: transactions.length * avgBuyAmount, // Approximate total SOL spent
            entryPrice: 0.000001, // Will be updated with actual price from market
            currentPrice: 0.000001,
            pnl: 0,
            marketCap: 0,
            walletAddresses: sniperWallets.map((w) => w.publicKey),
            purchaseTime: Date.now(),
          }

          // Check if holding already exists
          const existingIndex = holdings.findIndex(
            (h: any) => h.tokenAddress === newHolding.tokenAddress,
          )
          if (existingIndex >= 0) {
            // Update existing holding
            holdings[existingIndex] = {
              ...holdings[existingIndex],
              amount: holdings[existingIndex].amount + newHolding.amount,
              walletAddresses: [
                ...new Set([
                  ...holdings[existingIndex].walletAddresses,
                  ...newHolding.walletAddresses,
                ]),
              ],
            }
          } else {
            // Add new holding
            holdings.push(newHolding)
          }

          // Save updated holdings
          localStorage.setItem('tokenHoldings', JSON.stringify(holdings))
          toast.success('Holdings tracked for sell monitoring')
        } catch (error) {
          console.error('Failed to track holdings:', error)
        }
      }

      // Step 5: Wait before selling
      if (executionStrategy !== 'manual') {
        updateStepStatus(
          'wait-sells',
          'running',
          `Waiting ${autoSellDelay}s before selling...`,
        )
        for (let i = autoSellDelay; i > 0; i--) {
          updateStepStatus(
            'wait-sells',
            'running',
            `Waiting ${i}s before selling...`,
          )
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
        updateStepStatus('wait-sells', 'completed')
        setCurrentStep(5)

        // Step 6: Sell
        updateStepStatus(
          'sell',
          'running',
          'Executing sells from sniper wallets...',
        )

        // Define sell conditions based on strategy
        const sellConditions: SellConditions = {
          minPnlPercent: executionStrategy === 'flash' ? 50 : 100, // 50% for flash, 100% for stealth
          maxLossPercent: 20, // 20% stop loss
          minHoldTime: 0,
          maxHoldTime: 600, // 10 minutes max
        }

        const sellResults = await batchSellTokens(
          connection,
          sniperKeypairs,
          mintPubkey,
          sellConditions,
          100, // 1% slippage
        )

        const successCount = sellResults.filter((r) => r.success).length
        const totalProceeds = sellResults.reduce(
          (sum, r) => sum + r.outputAmount,
          0,
        )

        updateStepStatus(
          'sell',
          'completed',
          `Sold from ${successCount} wallets, ${totalProceeds.toFixed(2)} SOL earned`,
        )
      } else {
        updateStepStatus(
          'wait-sells',
          'completed',
          'Manual mode - skipping auto-sell',
        )
        updateStepStatus(
          'sell',
          'completed',
          'Manual mode - user controls sells',
        )
      }

      // Step 7: Complete
      updateStepStatus('complete', 'completed', 'Keymaker execution complete!')
      toast.success('🔑 Keymaker execution complete!')
    } catch (error) {
      const step = executionSteps[currentStep]
      updateStepStatus(step.id, 'failed', (error as Error).message)
      toast.error(`Execution failed: ${(error as Error).message}`)

      // Mark remaining steps as failed
      executionSteps.slice(currentStep + 1).forEach((s) => {
        updateStepStatus(s.id, 'failed', 'Skipped due to previous error')
      })
    }
  }

  // Strategy descriptions
  const strategyDescriptions = {
    flash: '⚡ Instant atomic execution using Jito bundles',
    stealth: '🥷 Delayed execution with random timing between transactions',
    manual: '🎮 Prepare transactions for manual execution',
    regular: '🚀 Fast sequential execution without bundling',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-6 w-6" />
            Keymaker Control Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Strategy Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Execution Strategy</label>
            <Select
              value={executionStrategy}
              onValueChange={(value) => setExecutionStrategy(value as any)}
              disabled={isExecuting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flash">⚡ Flash (Jito Bundle)</SelectItem>
                <SelectItem value="regular">
                  🚀 Regular (Fast Sequential)
                </SelectItem>
                <SelectItem value="stealth">🥷 Stealth (Delayed)</SelectItem>
                <SelectItem value="manual">🎮 Manual Mode</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {strategyDescriptions[executionStrategy]}
            </p>
          </div>

          {/* Pre-flight Checks */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Pre-flight Checks</h3>
            <div className="space-y-1">
              <CheckItem
                label="Master Wallet"
                checked={!!masterWallet}
                detail={
                  masterWallet
                    ? `${(masterWallet.balance / LAMPORTS_PER_SOL).toFixed(2)} SOL`
                    : 'Not assigned'
                }
              />
              <CheckItem
                label="Dev Wallets"
                checked={devWallets.length > 0}
                detail={`${devWallets.length} wallets`}
              />
              <CheckItem
                label="Sniper Wallets"
                checked={sniperWallets.length > 0}
                detail={`${sniperWallets.length} wallets`}
              />
              <CheckItem
                label="Token Config"
                checked={!!tokenLaunchData}
                detail={
                  tokenLaunchData
                    ? `${tokenLaunchData.symbol} on ${tokenLaunchData.platform}`
                    : 'Not configured'
                }
              />
              <CheckItem
                label="Jito Bundle"
                checked={jitoEnabled}
                detail={jitoEnabled ? `${tipAmount} SOL tip` : 'Disabled'}
              />
            </div>
          </div>

          {/* Execute Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={executeKeymaker}
            disabled={
              isExecuting ||
              !masterWallet ||
              !tokenLaunchData ||
              sniperWallets.length === 0
            }
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-5 w-5" />
                🔑 Execute Keymaker
              </>
            )}
          </Button>

          {/* Show mint address if token is deployed */}
          {mintAddress && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Token Mint:</strong>{' '}
                <a
                  href={`https://solscan.io/token/${mintAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {mintAddress.slice(0, 8)}...{mintAddress.slice(-8)}
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Progress */}
      {(isExecuting || executionSteps.some((s) => s.status !== 'pending')) && (
        <Card>
          <CardHeader>
            <CardTitle>Execution Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="sync">
                {executionSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <StepItem step={step} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {executionSteps.every(
              (s) => s.status === 'completed' || s.status === 'failed',
            ) && (
              <Button
                variant="outline"
                className="w-full"
                onClick={resetExecution}
              >
                Reset Execution
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Wallet Password</DialogTitle>
            <DialogDescription>
              Please enter the password to decrypt your wallets for execution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={walletPassword}
                onChange={(e) => setWalletPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Enter your wallet password"
              />
            </div>
            <Button onClick={handlePasswordSubmit} className="w-full">
              Decrypt Wallets
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper Components
function CheckItem({
  label,
  checked,
  detail,
}: {
  label: string
  checked: boolean
  detail: string
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        {checked ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </div>
  )
}

function StepItem({ step }: { step: ExecutionStep }) {
  const statusIcons: Record<ExecutionStep['status'], React.ReactElement> = {
    pending: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
    running: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
    completed: <CheckCircle className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />,
  }

  const statusColors: Record<
    ExecutionStep['status'],
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    pending: 'default',
    running: 'secondary',
    completed: 'outline',
    failed: 'destructive',
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        {statusIcons[step.status]}
        <span className="font-medium">{step.name}</span>
      </div>
      <div className="flex items-center gap-2">
        {step.message && (
          <span className="text-xs text-muted-foreground max-w-[200px] truncate">
            {step.message}
          </span>
        )}
        <Badge variant={statusColors[step.status]}>{step.status}</Badge>
      </div>
    </div>
  )
}

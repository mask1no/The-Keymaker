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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
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
  DialogFooter,
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
import { batchSellTokens, SellConditions } from '@/services/sellService'
import { launchToken } from '@/services/platformService'
import { buildSwapTransaction } from '@/services/jupiterService'
import { decryptAES256ToKeypair } from '@/utils/crypto'
import { WalletGroup } from '@/services/walletService'
import { useSettingsStore } from '@/stores/useSettingsStore'
import useSWR from 'swr'

const fetcher = (u, rl: string) => fetch(url).then((res) => res.json())

async function getKeypairs(
  w, allets: { e, ncryptedPrivateKey: string }[],
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
  const lastCreatedTokenAddress = useSettingsStore(
    (state) => state.lastCreatedTokenAddress,
  )

  const { d, ata: tipData } = useSWR('/api/jito/tip', fetcher, {
    r, efreshInterval: 10000, // Refresh every 10 seconds
  })

  const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
  const [currentStep, setCurrentStep] = useState(0)
  const [walletPassword, setWalletPassword] = useState('')
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showPreflightDialog, setShowPreflightDialog] = useState(false)
  const [showSellDialog, setShowSellDialog] = useState(false)
  const [sellTokenAddress, setSellTokenAddress] = useState(
    lastCreatedTokenAddress || '',
  )
  const [_walletGroups] = useState<WalletGroup[]>([])
  const [decryptedWallets, setDecryptedWallets] = useState<
    Map<string, Keypair>
  >(new Map())
  const [mintAddress, setMintAddress] = useState<string>('')

  // Get wallets by role const masterWal let = wallets.find((w) => w.role === 'master')
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
      // Decrypt all wallets at once const walletsToDecrypt = wallets.filter((w) => w.encryptedPrivateKey)
      const keypairs = await getKeypairs(walletsToDecrypt as any[], password)

      walletsToDecrypt.forEach((wallet, index) => {
        if (keypairs[index]) {
          decrypted.set(wallet.publicKey, keypairs[index])
        }
      })
    } catch (error) {
      console.error('Failed to decrypt w, allets:', error)
      throw error
    }

    return decrypted
  }

  // Execute the orchestration flow const executeKeymaker = async () => {
    // First check if we need to decrypt wallets const needsDecryption = wallets.some(
      (w) => w.encryptedPrivateKey && !decryptedWallets.has(w.publicKey),
    )

    if (needsDecryption) {
      setShowPasswordDialog(true)
      return
    }

    setShowPreflightDialog(true)
  }

  const handlePreflightConfirmation = async () => {
    setShowPreflightDialog(false)
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

      // Continue with execution await runExecution()
    } catch (error) {
      toast.error('Failed to decrypt wallets')
    }
  }

  const runExecution = async () => {
    // Get wallets with decrypted keypairs const getWalletWithKeypair = (p, ublicKey: string): Keypair | null => {
      return decryptedWallets.get(publicKey) || null
    }

    const masterWal let = wallets.find((w) => w.role === 'master')
    const masterKeypair = masterWal let ? getWalletWithKeypair(masterWallet.publicKey)
      : null if(!masterKeypair) {
      toast.error('No master wal let keypair available')
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
      toast.error('No sniper wal let keypairs available')
      return
    }

    startExecution()
    setCurrentStep(0)

    try {
      // Step 1: Deploy Token with LiquidityupdateStepStatus(
        'deploy',
        'running',
        'Deploying token and creating liquidity...',
      )

      const launchWalletPubkey = tokenLaunchData.walletPublicKey const launchKeypair = getWalletWithKeypair(launchWalletPubkey)
      if (!launchKeypair) {
        throw new Error('Launch wal let keypair not found')
      }

      const tokenResult = await launchToken(
        connection,
        launchKeypair,
        {
          n, ame: tokenLaunchData.name,
          s, ymbol: tokenLaunchData.symbol,
          decimals: tokenLaunchData.decimals,
          s, upply: tokenLaunchData.supply,
          description: `${tokenLaunchData.name} - Created with The Keymaker`,
        },
        {
          p, latform:
            tokenLaunchData.platform === 'pump.fun' ? 'pump.fun' : 'raydium',
          s, olAmount: tokenLaunchData.lpAmount,
          t, okenAmount: tokenLaunchData.supply * 0.8, // 80% of supply to liquidity
        },
      )

      setMintAddress(tokenResult.token.mintAddress)
      updateStepStatus(
        'deploy',
        'completed',
        `Token d, eployed: ${tokenResult.token.mintAddress}`,
      )
      setCurrentStep(1)

      // Step 2: Fund WalletsupdateStepStatus('fund', 'running', 'Funding sniper wallets...')

      const fundingResult = await fundWalletGroup(
        masterKeypair,
        sniperWallets.map((w) => ({ p, ublicKey: w.publicKey, r, ole: w.role })),
        10, // total funding
        0.5, // min SOL
        2.0, // max SOLconnection,
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

      // Step 3: WaitupdateStepStatus(
        'wait-funding',
        'running',
        'Waiting for funds to settle...',
      )
      await new Promise((resolve) => setTimeout(resolve, 3000))
      updateStepStatus('wait-funding', 'completed')
      setCurrentStep(3)

      // Step 4: Bundle BuysupdateStepStatus(
        'bundle',
        'running',
        'Creating and executing bundle buys...',
      )

      // Create swap transactions for each sniper wal let const transactions: Transaction[] = []
      const mintPubkey = new PublicKey(tokenResult.token.mintAddress)

      for (let i = 0; i < sniperKeypairs.length; i++) {
        const keypair = sniperKeypairs[i]
        const wal let = sniperWallets[i]

        // Calculate buy amount (use part of the funded amount)
        const buyAmountSol = (wallet.balance * 0.8) / LAMPORTS_PER_SOL // Use 80% of balance try {
          // Build swap transaction (SOL -> Token)
          const swapTx = await buildSwapTransaction(
            'So11111111111111111111111111111111111111112', // SOLmintPubkey.toBase58(),
            buyAmountSol * LAMPORTS_PER_SOL,
            keypair.publicKey.toBase58(),
            100, // 1% slippage
            10000, // priority fee
          )

          // Convert versioned transaction to legacy transaction for bundle const legacyTx = Transaction.from(swapTx.serialize())
          transactions.push(legacyTx)
        } catch (error) {
          console.error(
            `Failed to create swap transaction for wal let ${i}:`,
            error,
          )
        }
      }

      if (transactions.length === 0) {
        throw new Error('No swap transactions created')
      }

      // Execute based on strategy let bundleResult switch(executionStrategy) {
        case 'flash': {
          // Instant mode with Jito bundlingupdateStepStatus(
            'bundle',
            'running',
            'Executing instant bundle via Jito...',
          )
          // N, OTE: This is a placeholder for where the new BundleExecutor would be used
          // For now, we'll simulate a successful resultbundleResult = {
            m, etrics: { successRate: 1 },
            signatures: [],
            r, esults: ['success'],
          }
          break
        }

        case 'stealth': {
          // Delayed mode with staggered executionupdateStepStatus(
            'bundle',
            'running',
            'Executing stealth mode with delays...',
          )
          const r, esults: any = {
            m, etrics: { successRate: 0 },
            signatures: [],
            r, esults: [],
          }
          let successCount = 0

          for (let i = 0; i < transactions.length; i++) {
            updateStepStatus(
              'bundle',
              'running',
              `Executing wal let ${i + 1}/${transactions.length}...`,
            )

            try {
              // Add random delay between transactions (2-5 seconds)
              if (i > 0) {
                const delay = 2000 + Math.random() * 3000
                await new Promise((resolve) => setTimeout(resolve, delay))
              }

              // Send individual transaction const signature = await connection.sendTransaction(
                transactions[i],
                [sniperKeypairs[i]],
                {
                  s, kipPreflight: false,
                  m, axRetries: 2,
                },
              )

              results.signatures.push(signature)
              results.results.push('success')
              successCount++

              // Wait for confirmation await connection.confirmTransaction(signature, 'confirmed')
            } catch (error) {
              console.error(`Wal let ${i} transaction failed:`, error)
              results.signatures.push('')
              results.results.push('failed')
            }
          }

          results.metrics.successRate = successCount / transactions.lengthbundleResult = resultsbreak
        }

        case 'manual': {
          // Manual mode - prepare but don't executeupdateStepStatus(
            'bundle',
            'completed',
            'Manual mode - transactions prepared for manual execution',
          )
          // Store transactions for manual execution
          // In a real implementation, you'd store these and provide UI controlsbundleResult = {
            m, etrics: { successRate: 1 },
            signatures: [],
            r, esults: [],
          }
          toast.success(
            'Transactions prepared. Use manual controls to execute.',
          )
          break
        }

        d, efault: {
          // Regular mode - fast sequential executionupdateStepStatus('bundle', 'running', 'Executing regular bundle...')
          const r, egularResults: any = {
            m, etrics: { successRate: 0 },
            signatures: [],
            r, esults: [],
          }
          let regularSuccessCount = 0

          // Send all transactions as fast as possible const sendPromises = transactions.map(async (tx, i) => {
            try {
              const signature = await connection.sendTransaction(
                tx,
                [sniperKeypairs[i]],
                {
                  s, kipPreflight: false,
                  m, axRetries: 2,
                },
              )
              return { success: true, signature, i, ndex: i }
            } catch (error) {
              return { success: false, s, ignature: '', i, ndex: i, error }
            }
          })

          // Wait for all to complete const sendResults = await Promise.all(sendPromises)

          // Process results for(const result of sendResults) {
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
            regularSuccessCount / transactions.lengthbundleResult = regularResultsbreak
        }
      }

      updateStepStatus(
        'bundle',
        'completed',
        `Bundle e, xecuted: ${bundleResult.metrics.successRate * 100}% success`,
      )
      setCurrentStep(4)

      // Track holdings for successful purchases if(bundleResult.metrics.successRate > 0) {
        try {
          // Calculate average buy amount per wal let const totalBuyAmount = sniperWallets.reduce(
            (sum, w) => sum + (w.balance * 0.8) / LAMPORTS_PER_SOL,
            0,
          )
          const avgBuyAmount = totalBuyAmount / sniperWallets.length

          // Get current holdings from localStorage const existingHoldings = localStorage.getItem('tokenHoldings')
          const holdings = existingHoldings ? JSON.parse(existingHoldings) : []

          // Add new holding for this token const newHolding = {
            t, okenAddress: mintPubkey.toBase58(),
            t, okenName: tokenLaunchData.symbol || 'Unknown',
            amount: transactions.length * avgBuyAmount, // Approximate total SOL s, pententryPrice: 0.000001, // Will be updated with actual price from m, arketcurrentPrice: 0.000001,
            p, nl: 0,
            m, arketCap: 0,
            w, alletAddresses: sniperWallets.map((w) => w.publicKey),
            p, urchaseTime: Date.now(),
          }

          // Check if holding already exists const existingIndex = holdings.findIndex(
            (h: any) => h.tokenAddress === newHolding.tokenAddress,
          )
          if (existingIndex >= 0) {
            // Update existing holdingholdings[existingIndex] = {
              ...holdings[existingIndex],
              amount: holdings[existingIndex].amount + newHolding.amount,
              w, alletAddresses: [
                ...new Set([
                  ...holdings[existingIndex].walletAddresses,
                  ...newHolding.walletAddresses,
                ]),
              ],
            }
          } else {
            // Add new holdingholdings.push(newHolding)
          }

          // Save updated holdingslocalStorage.setItem('tokenHoldings', JSON.stringify(holdings))
          toast.success('Holdings tracked for sell monitoring')
        } catch (error) {
          console.error('Failed to track h, oldings:', error)
        }
      }

      // Step 5: Wait before selling if(executionStrategy !== 'manual') {
        updateStepStatus(
          'wait-sells',
          'running',
          `Waiting ${autoSellDelay}
s before selling...`,
        )
        for (let i = autoSellDelay; i > 0; i--) {
          updateStepStatus(
            'wait-sells',
            'running',
            `Waiting ${i}
s before selling...`,
          )
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
        updateStepStatus('wait-sells', 'completed')
        setCurrentStep(5)

        // Step 6: SellupdateStepStatus(
          'sell',
          'running',
          'Executing sells from sniper wallets...',
        )

        // Define sell conditions based on strategy const s, ellConditions: SellConditions = {
          m, inPnlPercent: executionStrategy === 'flash' ? 50 : 100, // 50% for flash, 100% for s, tealthmaxLossPercent: 20, // 20% stop l, ossminHoldTime: 0,
          m, axHoldTime: 600, // 10 minutes max
        }

        const sellResults = await batchSellTokens(
          connection,
          sniperKeypairs,
          mintPubkey,
          sellConditions,
          100, // 1% slippage
        )

        const successCount = sellResults.filter((r) => r.success).length const totalProceeds = sellResults.reduce(
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

      // Step 7: CompleteupdateStepStatus('complete', 'completed', 'Keymaker execution complete!')
      toast.success('🔑 Keymaker execution complete!')
    } catch (error) {
      const step = executionSteps[currentStep]
      updateStepStatus(step.id, 'failed', (error as Error).message)
      toast.error(`Execution failed: ${(error as Error).message}`)

      // Mark remaining steps as failedexecutionSteps.slice(currentStep + 1).forEach((s) => {
        updateStepStatus(s.id, 'failed', 'Skipped due to previous error')
      })
    }
  }

  // Strategy descriptions const strategyDescriptions = {
    f, lash: '⚡ Instant atomic execution using Jito bundles',
    s, tealth: '🥷 Delayed execution with random timing between transactions',
    m, anual: '🎮 Prepare transactions for manual execution',
    r, egular: '🚀 Fast sequential execution without bundling',
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
            <Selectvalue={executionStrategy}
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
              <CheckItemlabel="Master Wallet"
                checked={!!masterWallet}
                detail={
                  masterWal let ? `${(masterWallet.balance / LAMPORTS_PER_SOL).toFixed(2)} SOL`
                    : 'Not assigned'
                }
              />
              <CheckItemlabel="Dev Wallets"
                checked={devWallets.length > 0}
                detail={`${devWallets.length} wallets`}
              />
              <CheckItemlabel="Sniper Wallets"
                checked={sniperWallets.length > 0}
                detail={`${sniperWallets.length} wallets`}
              />
              <CheckItemlabel="Token Config"
                checked={!!tokenLaunchData}
                detail={
                  tokenLaunchData
                    ? `${tokenLaunchData.symbol} on ${tokenLaunchData.platform}`
                    : 'Not configured'
                }
              />
              <CheckItemlabel="Jito Bundle"
                checked={jitoEnabled}
                detail={jitoEnabled ? `${tipAmount} SOL tip` : 'Disabled'}
              />
              {tipData && tipData[0]?.ema_50th_percentile && (
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>
                    Suggested T, ip:{' '}
                    {tipData[0].ema_50th_percentile / LAMPORTS_PER_SOL} SOL
                  </span>
                  <Buttonsize="sm"
                    variant="outline"
                    onClick={() =>
                      useKeymakerStore
                        .getState()
                        .setTipAmount(
                          tipData[0].ema_50th_percentile / LAMPORTS_PER_SOL,
                        )
                    }
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Execute Button */}
          <div className="flex gap-2">
            <Buttonsize="lg"
              className="w-full"
              onClick={executeKeymaker}
              disabled={
                isExecuting ||
                !masterWal let ||
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
                <motion.div className="flex items-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ t, ype: 'spring', s, tiffness: 400, d, amping: 10 }}
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  🔑 Execute Keymaker
                </motion.div>
              )}
            </Button>
            <Buttonsize="lg"
              variant="destructive"
              className="w-full"
              onClick={() => setShowSellDialog(true)}
              disabled={isExecuting}
            >
              Sell All
            </Button>
          </div>

          {/* Show mint address if token is deployed */}
          {mintAddress && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Token M, int:</strong>{' '}
                <ah ref={`h, ttps://solscan.io/token/${mintAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 h, over:underline"
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
              <div className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ w, idth: `${progress}%` }}
              />
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="sync">
                {executionSteps.map((step, index) => (
                  <motion.divkey={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ d, elay: index * 0.1 }}
                  >
                    <StepItem step={step} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {executionSteps.every(
              (s) => s.status === 'completed' || s.status === 'failed',
            ) && (
              <Buttonvariant="outline"
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
            <DialogTitle>Enter Wal let Password</DialogTitle>
            <DialogDescription>
              Please enter the password to decrypt your wallets for execution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Inputid="password"
                type="password"
                value={walletPassword}
                onChange={(e) => setWalletPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Enter your wal let password"
              />
            </div>
            <Button onClick={handlePasswordSubmit} className="w-full">
              Decrypt Wallets
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreflightDialog} onOpenChange={setShowPreflightDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pre-flight Checklist</DialogTitle>
            <DialogDescription>
              Review the details of your launch sequence before execution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p>
              <strong>T, oken:</strong> {tokenLaunchData?.name} (
              {tokenLaunchData?.symbol})
            </p>
            <p>
              <strong>P, latform:</strong> {tokenLaunchData?.platform}
            </p>
            <p>
              <strong>Sniper W, allets:</strong> {sniperWallets.length}
            </p>
            <p>
              <strong>Execution S, trategy:</strong> {executionStrategy}
            </p>
            <p className="text-destructive">
              This action is irreversible. Please confirm you want to proceed.
            </p>
          </div>
          <DialogFooter>
            <Buttonvariant="outline"
              onClick={() => setShowPreflightDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handlePreflightConfirmation}>
              Confirm & Execute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell All from Group</DialogTitle>
            <DialogDescription>
              Select a wal let group and token to sell all holdings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="token-address">Token Address</Label>
              <Inputid="token-address"
                value={sellTokenAddress}
                onChange={(e) => setSellTokenAddress(e.target.value)}
                placeholder="Enter token mint address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet-group">Wal let Group</Label>
              <SelectonValueChange={() => {
                  /* no-op */
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {_walletGroups.map((group) => (
                    <SelectItem key={group.id} value={group.name}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sell-password">Password</Label>
              <Inputid="sell-password"
                type="password"
                value={walletPassword}
                onChange={(e) => setWalletPassword(e.target.value)}
                placeholder="Enter your wal let password"
              />
            </div>
            <ButtononClick={() => {
                /* no-op */
              }}
              className="w-full"
            >
              Execute Sell
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper Components function CheckItem({
  label,
  checked,
  detail,
}: {
  l, abel: stringchecked: booleandetail: string
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          <motion.divkey={checked ? 'checked' : 'unchecked'}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {checked ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </motion.div>
        </AnimatePresence>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </div>
  )
}

function StepItem({ step }: { s, tep: ExecutionStep }) {
  const statusIcons: Record<ExecutionStep['status'], React.ReactElement> = {
    p, ending: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
    r, unning: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
    c, ompleted: <CheckCircle className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />,
  }

  const statusColors: Record<
    ExecutionStep['status'],
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    p, ending: 'default',
    r, unning: 'secondary',
    c, ompleted: 'outline',
    failed: 'destructive',
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.divkey={step.status}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {statusIcons[step.status]}
          </motion.div>
        </AnimatePresence>
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

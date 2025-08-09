'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { Badge } from '@/components/UI/badge'
import { Switch } from '@/components/UI/switch'
import {
  Rocket,
  Wallet,
  Package,
  TrendingUp,
  PlayCircle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useKeymakerStore, type WalletData } from '@/lib/store'
import {
  Connection,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'
import { fundWalletGroup } from '@/services/fundingService'
import { batchSellTokens } from '@/services/sellService'
import { logEvent } from '@/lib/clientLogger'
import { getKeypairs } from '@/services/walletService'
import { logger } from '@/lib/logger'
import { PasswordDialog } from '@/components/UI/PasswordDialog'
import { executeBundle } from '@/services/bundleService'
import { buildSwapTransaction } from '@/services/jupiterService'
import { useSettingsStore } from '@/stores/useSettingsStore'

type Phase =
  | 'idle'
  | 'launching'
  | 'funding'
  | 'bundling'
  | 'selling'
  | 'complete'
  | 'error'

interface ExecutionState {
  phase: Phase
  tokenMint?: string
  txSignatures: string[]
  errors: string[]
  startTime?: number
  endTime?: number
}

// Helper to convert store wallets to wallet service format
function prepareWalletsForKeypairs(wallets: WalletData[]): Array<{
  publicKey: string
  encryptedPrivateKey: string
  role: 'master' | 'dev' | 'sniper' | 'normal'
}> {
  return wallets
    .filter((w) => w.encryptedPrivateKey)
    .map((w) => ({
      publicKey: w.publicKey,
      encryptedPrivateKey: w.encryptedPrivateKey!,
      role: w.role,
    }))
}

export function ControlPanel() {
  const { jitoTipLamports, jupiterFeeBps } = useSettingsStore.getState()
  const {
    wallets,
    walletGroups,
    tokenLaunchData,
    tipAmount,
    autoSellDelay,
    isExecuting,
    startExecution,
    stopExecution,
    setTokenLaunchData,
  } = useKeymakerStore()

  const [state, setState] = useState<ExecutionState>({
    phase: 'idle',
    txSignatures: [],
    errors: [],
  })

  const [dryRun, setDryRun] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<'launch' | 'full' | null>(
    null,
  )

  // Configuration states
  const [tokenConfig, setTokenConfig] = useState({
    name: tokenLaunchData?.name || '',
    symbol: tokenLaunchData?.symbol || '',
    decimals: tokenLaunchData?.decimals || 9,
    supply: tokenLaunchData?.supply || 1000000000,
    platform: tokenLaunchData?.platform || 'pumpfun',
    solAmount: tokenLaunchData?.lpAmount || 10,
    tokenAmount: 500000000,
  })

  const [bundleConfig, setBundleConfig] = useState({
    bundleSize: 5,
    jitoTip: tipAmount || 0.01,
    priorityFee: 0.0001,
    slippage: 1, // 1% default slippage
  })

  const [sellConfig, setSellConfig] = useState({
    minPnlPercent: 100,
    maxLossPercent: -50,
    minHoldTime: 180,
    slippage: 300,
  })

  const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')

  // Get wallet counts
  const walletCounts = {
    master: wallets.filter((w) => w.role === 'master').length,
    sniper: wallets.filter((w) => w.role === 'sniper').length,
    dev: wallets.filter((w) => w.role === 'dev').length,
    total: wallets.length,
  }

  const canExecute = walletCounts.master > 0 && walletCounts.sniper > 0

  const updatePhase = (phase: Phase, error?: string) => {
    setState((prev) => ({
      ...prev,
      phase,
      errors: error ? [...prev.errors, error] : prev.errors,
      endTime:
        phase === 'complete' || phase === 'error' ? Date.now() : undefined,
    }))
  }

  const handlePasswordSubmit = async (password: string) => {
    setShowPasswordDialog(false)

    if (pendingAction === 'launch') {
      await executeLaunchToken(password)
    } else if (pendingAction === 'full') {
      await executeFullSequence(password)
    }

    setPendingAction(null)
  }

  const executeLaunchToken = async (password: string) => {
    try {
      updatePhase('launching')
      startExecution()

      // Get master wallet
      const masterWallet = wallets.find((w) => w.role === 'master')
      if (!masterWallet) {
        throw new Error('No master wallet found')
      }

      const walletsWithKeys = prepareWalletsForKeypairs([masterWallet])
      const keypairs = await getKeypairs(walletsWithKeys, password)
      if (keypairs.length === 0) {
        throw new Error('Failed to decrypt master wallet')
      }

      // const payer = keypairs[0] // not used here; decryption verifies access

      // Launch token
      logger.info('Launching token', { config: tokenConfig })
      let mintAddress = ''
      if (
        tokenConfig.platform === 'pumpfun' ||
        tokenConfig.platform === 'pump.fun'
      ) {
        const r = await fetch('/api/pumpfun/launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: tokenConfig.name,
            symbol: tokenConfig.symbol,
            supply: tokenConfig.supply,
            metadata: {
              description: `${tokenConfig.name} - Launched by The Keymaker`,
            },
          }),
        })
        const j = await r.json()
        if (!r.ok || !j?.mint) throw new Error(j?.error || 'Launch failed')
        mintAddress = j.mint
      } else {
        throw new Error('Use Pump.fun for launch in this build')
      }

      setState((prev) => ({
        ...prev,
        tokenMint: mintAddress,
        txSignatures: [],
      }))

      setTokenLaunchData({
        name: tokenLaunchData?.name || 'Token',
        symbol: tokenLaunchData?.symbol || 'TKN',
        decimals: tokenLaunchData?.decimals || 9,
        supply: tokenLaunchData?.supply || 0,
        platform: tokenLaunchData?.platform || 'pump.fun',
        lpAmount: tokenLaunchData?.lpAmount || 0,
        walletPublicKey:
          tokenLaunchData?.walletPublicKey || masterWallet.publicKey,
        mintAddress,
        txSignature: '',
      })

      await logEvent({
        phase: 'token_launch',
        action: 'create_token',
        token_address: mintAddress,
        wallet_address: masterWallet.publicKey,
        status: 'success',
      })

      toast.success(`Token launched! Mint: ${mintAddress.slice(0, 8)}...`)
      updatePhase('idle')
    } catch (error) {
      logger.error('Token launch failed', { error })
      updatePhase(
        'error',
        error instanceof Error ? error.message : 'Token launch failed',
      )
      toast.error(
        error instanceof Error ? error.message : 'Token launch failed',
      )
    } finally {
      stopExecution()
    }
  }

  const executeFundWallets = async (password: string) => {
    try {
      updatePhase('funding')

      const masterWallet = wallets.find((w) => w.role === 'master')
      if (!masterWallet) {
        throw new Error('No master wallet found')
      }

      const walletsWithKeys = prepareWalletsForKeypairs([masterWallet])
      const keypairs = await getKeypairs(walletsWithKeys, password)
      if (keypairs.length === 0) {
        throw new Error('Failed to decrypt master wallet')
      }

      const currentGroup = walletGroups[0] || {
        id: 'default',
        name: 'Default Group',
        walletIds: wallets.map((w) => w.id),
      }

      // Get wallets for funding
      const walletsToFund = wallets
        .filter(
          (w) => w.role !== 'master' && currentGroup.walletIds.includes(w.id),
        )
        .map((w) => ({ publicKey: w.publicKey, role: w.role }))

      const result = await fundWalletGroup(
        keypairs[0],
        walletsToFund,
        1.0, // total amount
        0.1, // min SOL
        0.5, // max SOL
        connection,
      )

      setState((prev) => ({
        ...prev,
        txSignatures: [...prev.txSignatures, ...result],
      }))

      await logEvent({
        phase: 'funding',
        action: 'fund_wallets',
        wallet_address: currentGroup.id,
        status: 'success',
      })

      toast.success(`Funded ${result.length} wallets!`)
    } catch (error) {
      logger.error('Wallet funding failed', { error })
      throw error
    }
  }

  const executeBundleBuys = async (password: string) => {
    try {
      updatePhase('bundling')

      if (!state.tokenMint) {
        throw new Error('No token mint address')
      }

      const sniperWallets = wallets.filter((w) => w.role === 'sniper')
      const bundleWallets = sniperWallets.slice(0, bundleConfig.bundleSize)
      const walletsWithKeys = prepareWalletsForKeypairs(bundleWallets)
      const keypairs = await getKeypairs(walletsWithKeys, password)

      logger.info('Building swap transactions for bundle', {
        tokenMint: state.tokenMint,
        walletCount: keypairs.length,
      })

      // Build swap transactions for each wallet
      const transactions: Transaction[] = []
      const walletRoles: { publicKey: string; role: string }[] = []

      for (let i = 0; i < keypairs.length; i++) {
        const keypair = keypairs[i]
        const wallet = bundleWallets[i]

        // Calculate buy amount (use most of the funded balance, keeping some for fees)
        const balance = wallet.balance || 0
        const buyAmountLamports = Math.floor(balance * 0.9 * LAMPORTS_PER_SOL) // Use 90% of balance

        if (buyAmountLamports < 0.01 * LAMPORTS_PER_SOL) {
          logger.warn(`Wallet ${i} has insufficient balance for swap`, {
            balance,
          })
          continue
        }

        try {
          // Build swap transaction (SOL -> Token)
          const swapTx = await buildSwapTransaction(
            'So11111111111111111111111111111111111111112', // SOL
            state.tokenMint,
            buyAmountLamports,
            keypair.publicKey.toBase58(),
            bundleConfig.slippage * 100, // Convert to basis points
            bundleConfig.priorityFee * LAMPORTS_PER_SOL,
            jupiterFeeBps,
          )

          // Convert VersionedTransaction to Transaction for bundle execution
          // Note: executeBundle will convert back to VersionedTransaction internally
          const legacyTx = Transaction.from(swapTx.serialize())
          transactions.push(legacyTx)
          walletRoles.push({
            publicKey: keypair.publicKey.toBase58(),
            role: wallet.role,
          })
        } catch (error) {
          logger.error(`Failed to build swap for wallet ${i}`, { error })
        }
      }

      if (transactions.length === 0) {
        throw new Error('No valid swap transactions created')
      }

      logger.info('Executing bundle with Jito', {
        transactionCount: transactions.length,
        tipAmount: tipAmount * LAMPORTS_PER_SOL,
      })

      // Execute bundle with Jito
      const bundleResult = await executeBundle(
        transactions,
        walletRoles,
        keypairs,
        {
          connection,
          tipAmount: jitoTipLamports,
          retries: 3,
          logger: (msg) => logger.info(`[Bundle] ${msg}`),
        },
      )

      setState((prev) => ({
        ...prev,
        txSignatures: [
          ...prev.txSignatures,
          ...(bundleResult.signatures || []),
        ],
      }))

      await logEvent({
        phase: 'bundle_execution',
        action: 'execute_bundle',
        status:
          bundleResult.results.filter((r) => r === 'success').length > 0
            ? 'success'
            : 'failed',
        slot: bundleResult.slotTargeted,
      })

      const successCount = bundleResult.results.filter(
        (r) => r === 'success',
      ).length
      if (successCount > 0) {
        toast.success(
          `Bundle executed! ${successCount}/${transactions.length} succeeded`,
        )
      } else {
        throw new Error('All transactions in bundle failed')
      }
    } catch (error) {
      logger.error('Bundle execution failed', { error })
      throw error
    }
  }

  const executeSells = async (password: string) => {
    try {
      updatePhase('selling')

      if (!state.tokenMint) {
        throw new Error('No token mint address')
      }

      const sniperWallets = wallets.filter((w) => w.role === 'sniper')
      const walletsWithKeys = prepareWalletsForKeypairs(sniperWallets)
      const keypairs = await getKeypairs(walletsWithKeys, password)

      const results = await batchSellTokens(
        connection,
        keypairs,
        new PublicKey(state.tokenMint),
        sellConfig,
      )

      const successCount = results.filter((r) => r.success).length
      const signatures = results
        .filter((r) => r.success && r.txSignature)
        .map((r) => r.txSignature!)

      setState((prev) => ({
        ...prev,
        txSignatures: [...prev.txSignatures, ...signatures],
      }))

      await logEvent({
        phase: 'batch_sell',
        action: 'sell_tokens',
        token_address: state.tokenMint,
        status: successCount > 0 ? 'success' : 'failed',
      })

      toast.success(`Sold from ${successCount}/${results.length} wallets!`)
    } catch (error) {
      logger.error('Batch sell failed', { error })
      throw error
    }
  }

  const executeFullSequence = async (password: string) => {
    try {
      setState({
        phase: 'launching',
        txSignatures: [],
        errors: [],
        startTime: Date.now(),
      })
      startExecution()

      // 1. Launch Token
      await executeLaunchToken(password)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // 2. Fund Wallets
      await executeFundWallets(password)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // 3. Bundle Buys
      await executeBundleBuys(password)
      await new Promise((resolve) => setTimeout(resolve, autoSellDelay * 1000))

      // 4. Execute Sells
      await executeSells(password)

      updatePhase('complete')
      toast.success('Full sequence completed successfully!')
    } catch (error) {
      updatePhase(
        'error',
        error instanceof Error ? error.message : 'Execution failed',
      )
      toast.error(error instanceof Error ? error.message : 'Execution failed')
    } finally {
      stopExecution()
    }
  }

  const getPhaseIcon = (phase: Phase) => {
    switch (phase) {
      case 'launching':
        return <Rocket className="h-5 w-5 animate-pulse" />
      case 'funding':
        return <Wallet className="h-5 w-5 animate-pulse" />
      case 'bundling':
        return <Package className="h-5 w-5 animate-pulse" />
      case 'selling':
        return <TrendingUp className="h-5 w-5 animate-pulse" />
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <PlayCircle className="h-5 w-5" />
    }
  }

  const getPhaseText = (phase: Phase) => {
    switch (phase) {
      case 'launching':
        return 'Launching Token...'
      case 'funding':
        return 'Funding Wallets...'
      case 'bundling':
        return 'Bundling Buys...'
      case 'selling':
        return 'Executing Sells...'
      case 'complete':
        return 'Complete!'
      case 'error':
        return 'Error'
      default:
        return 'Ready'
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl mx-auto space-y-6"
      >
        {/* Status Header */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getPhaseIcon(state.phase)}
                Control Panel
              </CardTitle>
              <div className="flex items-center gap-4">
                <Badge
                  variant={state.phase === 'idle' ? 'secondary' : 'default'}
                >
                  {getPhaseText(state.phase)}
                </Badge>
                <div className="flex items-center gap-2">
                  <Label htmlFor="dry-run" className="text-sm">
                    Dry Run
                  </Label>
                  <Switch
                    id="dry-run"
                    checked={dryRun}
                    onCheckedChange={setDryRun}
                    disabled={isExecuting}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Wallet Status */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Wallet Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{walletCounts.total}</p>
                <p className="text-sm text-white/60">Total Wallets</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {walletCounts.master}
                </p>
                <p className="text-sm text-white/60">Master</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {walletCounts.sniper}
                </p>
                <p className="text-sm text-white/60">Sniper</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {walletCounts.dev}
                </p>
                <p className="text-sm text-white/60">Dev</p>
              </div>
            </div>
            {!canExecute && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  You need at least 1 master and 1 sniper wallet to execute
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Token Config */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Rocket className="h-4 w-4" />
                Token Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={tokenConfig.name}
                  onChange={(e) =>
                    setTokenConfig({ ...tokenConfig, name: e.target.value })
                  }
                  placeholder="My Token"
                  disabled={isExecuting}
                />
              </div>
              <div>
                <Label>Symbol</Label>
                <Input
                  value={tokenConfig.symbol}
                  onChange={(e) =>
                    setTokenConfig({ ...tokenConfig, symbol: e.target.value })
                  }
                  placeholder="TKN"
                  disabled={isExecuting}
                />
              </div>
              <div>
                <Label>Supply</Label>
                <Input
                  type="number"
                  value={tokenConfig.supply}
                  onChange={(e) =>
                    setTokenConfig({
                      ...tokenConfig,
                      supply: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={isExecuting}
                />
              </div>
              <div>
                <Label>Platform</Label>
                <select
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-md"
                  value={tokenConfig.platform}
                  onChange={(e) =>
                    setTokenConfig({ ...tokenConfig, platform: e.target.value })
                  }
                  disabled={isExecuting}
                >
                  <option value="pumpfun">Pump.fun</option>
                  <option value="raydium">Raydium</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Bundle Config */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-4 w-4" />
                Bundle Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Bundle Size</Label>
                <Input
                  type="number"
                  value={bundleConfig.bundleSize}
                  onChange={(e) =>
                    setBundleConfig({
                      ...bundleConfig,
                      bundleSize: parseInt(e.target.value) || 1,
                    })
                  }
                  min={1}
                  max={walletCounts.sniper}
                  disabled={isExecuting}
                />
              </div>
              <div>
                <Label>Jito Tip (SOL)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={bundleConfig.jitoTip}
                  onChange={(e) =>
                    setBundleConfig({
                      ...bundleConfig,
                      jitoTip: parseFloat(e.target.value) || 0,
                    })
                  }
                  disabled={isExecuting}
                />
              </div>
              <div>
                <Label>Priority Fee (SOL)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={bundleConfig.priorityFee}
                  onChange={(e) =>
                    setBundleConfig({
                      ...bundleConfig,
                      priorityFee: parseFloat(e.target.value) || 0,
                    })
                  }
                  disabled={isExecuting}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sell Config */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Sell Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Min PnL %</Label>
                <Input
                  type="number"
                  value={sellConfig.minPnlPercent}
                  onChange={(e) =>
                    setSellConfig({
                      ...sellConfig,
                      minPnlPercent: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={isExecuting}
                />
              </div>
              <div>
                <Label>Max Loss %</Label>
                <Input
                  type="number"
                  value={Math.abs(sellConfig.maxLossPercent)}
                  onChange={(e) =>
                    setSellConfig({
                      ...sellConfig,
                      maxLossPercent: -Math.abs(parseInt(e.target.value) || 0),
                    })
                  }
                  disabled={isExecuting}
                />
              </div>
              <div>
                <Label>Hold Time (seconds)</Label>
                <Input
                  type="number"
                  value={sellConfig.minHoldTime}
                  onChange={(e) =>
                    setSellConfig({
                      ...sellConfig,
                      minHoldTime: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={isExecuting}
                />
              </div>
              <div>
                <Label>Slippage (bps)</Label>
                <Input
                  type="number"
                  value={sellConfig.slippage}
                  onChange={(e) =>
                    setSellConfig({
                      ...sellConfig,
                      slippage: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={isExecuting}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button
                onClick={() => {
                  setPendingAction('launch')
                  setShowPasswordDialog(true)
                }}
                disabled={
                  !canExecute ||
                  isExecuting ||
                  !tokenConfig.name ||
                  !tokenConfig.symbol
                }
                className="flex items-center gap-2"
              >
                {state.phase === 'launching' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                Launch Token
              </Button>

              <Button
                onClick={() => {
                  setShowPasswordDialog(true)
                  executeFundWallets('')
                }}
                disabled={!canExecute || isExecuting || !state.tokenMint}
                variant="secondary"
                className="flex items-center gap-2"
              >
                {state.phase === 'funding' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                Fund Wallets
              </Button>

              <Button
                onClick={() => {
                  setShowPasswordDialog(true)
                  executeBundleBuys('')
                }}
                disabled={!canExecute || isExecuting || !state.tokenMint}
                variant="secondary"
                className="flex items-center gap-2"
              >
                {state.phase === 'bundling' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Package className="h-4 w-4" />
                )}
                Bundle Buys
              </Button>

              <Button
                onClick={() => {
                  setShowPasswordDialog(true)
                  executeSells('')
                }}
                disabled={!canExecute || isExecuting || !state.tokenMint}
                variant="secondary"
                className="flex items-center gap-2"
              >
                {state.phase === 'selling' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                Execute Sells
              </Button>

              <Button
                onClick={() => {
                  setPendingAction('full')
                  setShowPasswordDialog(true)
                }}
                disabled={
                  !canExecute ||
                  isExecuting ||
                  !tokenConfig.name ||
                  !tokenConfig.symbol
                }
                variant="default"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {isExecuting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
                Start Full Run
              </Button>
            </div>

            {/* Transaction History */}
            {state.txSignatures.length > 0 && (
              <div className="mt-6 p-4 bg-white/5 rounded-lg">
                <h4 className="text-sm font-medium mb-2">
                  Transaction History
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {state.txSignatures.map((sig, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-white/60">
                        {sig.slice(0, 20)}...
                      </span>
                      <a
                        href={`https://solscan.io/tx/${sig}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {state.errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <h4 className="text-sm font-medium text-red-400 mb-2">
                  Errors
                </h4>
                <div className="space-y-1">
                  {state.errors.map((error, i) => (
                    <p key={i} className="text-xs text-red-400">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Password Dialog */}
      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false)
          setPendingAction(null)
        }}
        onSubmit={handlePasswordSubmit}
        title="Enter Wallet Password"
        description="Your password is required to decrypt wallet keys for this operation"
        mode="unlock"
        minStrength={0}
      />
    </>
  )
}

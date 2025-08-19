'use client'
import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/UI/table'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { useKeymakerStore } from '@/lib/store'
import { buildSwapTransaction } from '@/services/jupiterService'
import { Connection, Keypair } from '@solana/web3.js'
// Use browser-safe crypto for client-side key decryption
import { decryptAES256ToKeypair } from '@/utils/browserCrypto'
import { logEvent } from '@/lib/clientLogger'
import toast from 'react-hot-toast'
import { Loader2, ShoppingCart, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'
import { PasswordDialog } from '@/components/UI/PasswordDialog'

interface WalletBuyState {
  [pubkey: string]: {
    amount: string
    loading: boolean
  }
}

const SOL_MINT = 'So11111111111111111111111111111111111111112'

export function ManualBuyTable() {
  const { wallets, addNotification, tokenLaunchData } = useKeymakerStore()
  const [buyStates, setBuyStates] = useState<WalletBuyState>({})
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [pendingBuy, setPendingBuy] = useState<{
    wallet: any
    lamports: number
  } | null>(null)

  // Manual Sell dialog state
  const [sellDialogOpen, setSellDialogOpen] = useState(false)
  const [pendingSell, setPendingSell] = useState<{ wallet: any } | null>(null)
  const [sellMint, setSellMint] = useState('')
  const [sellAll, setSellAll] = useState(true)
  const [sellPassword, setSellPassword] = useState('')

  const handleAmountChange = (pubkey: string, amount: string) => {
    setBuyStates((prev) => ({
      ...prev,
      [pubkey]: { ...prev[pubkey], amount, loading: false },
    }))
  }

  const handleBuy = async (wallet: any) => {
    if (!tokenLaunchData?.mintAddress) {
      toast.error('No token selected for trading')
      return
    }

    const state = buyStates[wallet.publicKey] || { amount: '', loading: false }
    const solAmount = parseFloat(state.amount)

    if (!solAmount || solAmount <= 0) {
      toast.error('Please enter a valid SOL amount')
      return
    }

    const lamports = Math.floor(solAmount * 1e9)
    setPendingBuy({ wallet, lamports })
    setPasswordDialogOpen(true)
  }

  const executeBuy = async (password: string) => {
    if (!pendingBuy || !tokenLaunchData?.mintAddress) return

    const { wallet, lamports } = pendingBuy

    setBuyStates((prev) => ({
      ...prev,
      [wallet.publicKey]: { ...prev[wallet.publicKey], loading: true },
    }))

    try {
      const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC)

      // Decrypt wallet (browser crypto)
      const keypair = await decryptAES256ToKeypair(
        wallet.encryptedPrivateKey,
        password,
      )

      // Build swap transaction
      const versionedTransaction = await buildSwapTransaction(
        SOL_MINT,
        tokenLaunchData.mintAddress,
        lamports,
        wallet.publicKey,
        100, // 1% slippage
        0.0005 * 1e9, // Priority fee
      )

      // Sign the versioned transaction
      versionedTransaction.sign([keypair])

      // Send versioned transaction
      const signature = await connection.sendTransaction(versionedTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      await connection.confirmTransaction(signature, 'confirmed')

      // Log the successful buy
      await logEvent({
        wallet_address: wallet.publicKey,
        phase: 'manual_buy',
        action: 'buy_token',
        token_address: tokenLaunchData.mintAddress,
        amount: lamports,
        status: 'success',
        txId: signature,
      })

      addNotification({
        type: 'success',
        title: 'Manual Buy Executed',
        message: `Bought ${lamports / 1e9} SOL worth of tokens with ${wallet.publicKey.slice(0, 8)}...`,
      })

      // Clear the input
      setBuyStates((prev) => ({
        ...prev,
        [wallet.publicKey]: { amount: '', loading: false },
      }))

      toast.success(`Transaction: ${signature.slice(0, 8)}...`)
    } catch (error: any) {
      toast.error(`Buy failed: ${error.message}`)
      addNotification({
        type: 'error',
        title: 'Manual Buy Failed',
        message: error.message,
      })
    } finally {
      setBuyStates((prev) => ({
        ...prev,
        [wallet.publicKey]: { ...prev[wallet.publicKey], loading: false },
      }))
      setPendingBuy(null)
      setPasswordDialogOpen(false)
    }
  }

  const openSell = (wallet: any) => {
    setPendingSell({ wallet })
    setSellDialogOpen(true)
  }

  const executeSell = async () => {
    if (!pendingSell) return
    if (!sellMint) {
      toast.error('Enter token mint to sell')
      return
    }
    try {
      const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
      const keypair = await decryptAES256ToKeypair(
        pendingSell.wallet.encryptedPrivateKey,
        sellPassword,
      )
      // Use sellService with manualSell condition, sell all by passing a very large amount to clamp to balance
      const { sellToken } = await import('@/services/sellService')
      const { PublicKey } = await import('@solana/web3.js')
      const result = await sellToken(connection, {
        wallet: keypair,
        tokenMint: new PublicKey(sellMint),
        amount: sellAll ? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER,
        slippage: 1,
        conditions: { manualSell: true },
        priority: 'high',
      })
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Manual Sell Executed',
          message: `${pendingSell.wallet.publicKey.slice(0, 8)}... sold; tx ${
            (result.txSignature || '').slice(0, 8)
          }...`,
        })
        // Track PnL
        try {
          await fetch('/api/pnl/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet: pendingSell.wallet.publicKey,
              tokenAddress: sellMint,
              action: 'sell',
              solAmount: result.outputAmount,
              tokenAmount: 0,
              fees: { gas: 0.00001, jito: 0 },
            }),
          })
        } catch {}
        toast.success('Sell submitted')
      } else {
        toast.error(result.error || 'Sell failed')
      }
    } catch (e: any) {
      toast.error(`Sell failed: ${e.message || e}`)
    } finally {
      setSellDialogOpen(false)
      setPendingSell(null)
      setSellPassword('')
      setSellMint('')
      setSellAll(true)
    }
  }

  const sniperWallets = wallets.filter((w) => w.role === 'sniper')

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Manual Buy Control
          </h3>

          {!tokenLaunchData?.mintAddress && (
            <div className="text-yellow-500 mb-4 p-3 bg-yellow-500/10 rounded-lg">
              No token launched yet. Launch a token first to enable manual buys.
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white/70">Wallet</TableHead>
                  <TableHead className="text-white/70">Balance</TableHead>
                  <TableHead className="text-white/70">SOL Amount</TableHead>
                  <TableHead className="text-white/70">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sniperWallets.map((wallet) => {
                  const state = buyStates[wallet.publicKey] || {
                    amount: '',
                    loading: false,
                  }
                  return (
                    <TableRow key={wallet.publicKey}>
                      <TableCell className="font-mono text-sm">
                        {wallet.publicKey.slice(0, 4)}...
                        {wallet.publicKey.slice(-4)}
                      </TableCell>
                      <TableCell>
                        {(wallet.balance / 1e9).toFixed(4)} SOL
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          placeholder="0.1"
                          value={state.amount}
                          onChange={(e) =>
                            handleAmountChange(wallet.publicKey, e.target.value)
                          }
                          className="w-24 bg-white/5 border-white/20"
                          step="0.01"
                          min="0.01"
                          disabled={
                            state.loading || !tokenLaunchData?.mintAddress
                          }
                        />
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          onClick={() => handleBuy(wallet)}
                          disabled={
                            state.loading ||
                            !state.amount ||
                            !tokenLaunchData?.mintAddress
                          }
                          className="bg-gradient-to-r from-green-600 to-emerald-500 hover:to-cyan-500 transition-all duration-300"
                          size="sm"
                        >
                          {state.loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'BUY'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSell(wallet)}
                          aria-label="Sell token from this wallet"
                        >
                          <DollarSign className="h-4 w-4" />
                          <span className="ml-1 hidden md:inline">SELL</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {sniperWallets.length === 0 && (
            <div className="text-center py-8 text-white/50">
              No sniper wallets available. Create wallets first.
            </div>
          )}
        </div>
      </motion.div>

      <PasswordDialog
        isOpen={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        onSubmit={executeBuy}
        title="Enter Password"
        description="Enter your password to decrypt the wallet and execute the buy."
        mode="unlock"
      />

      {/* Manual Sell Dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Sell</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Token Mint</Label>
              <Input value={sellMint} onChange={(e) => setSellMint(e.target.value)} placeholder="Token mint address" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={sellAll} onChange={(e) => setSellAll(e.target.checked)} />
              <Label>Sell all balance</Label>
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={sellPassword} onChange={(e) => setSellPassword(e.target.value)} placeholder="Wallet password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSellDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={executeSell} disabled={!sellPassword || !sellMint}>
              Sell Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

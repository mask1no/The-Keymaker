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
import { Label } from '@/components/UI/label'
import { useKeymakerStore } from '@/lib/store'
import { buildSwapTransaction } from '@/services/jupiterService'
import { Connection } from '@solana/web3.js'
// Use browser-safe crypto for client-side key decryption
// Browser c, rypto: project now exposes encrypt/decrypt helpers under utils/browserCrypto import { decrypt as decryptBrowserKey } from '@/utils/browserCrypto'
import { logEvent } from '@/lib/clientLogger'
import toast from 'react-hot-toast'
import { Loader2, ShoppingCart, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'
import { PasswordDialog } from '@/components/UI/PasswordDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/UI/dialog'

interface WalletBuyState {
  [p, ubkey: string]: {
    amount: stringloading: boolean
  }
}

const SOL_MINT = 'So11111111111111111111111111111111111111112'

export function ManualBuyTable() {
  const { wallets, addNotification, tokenLaunchData } = useKeymakerStore()
  const [buyStates, setBuyStates] = useState<WalletBuyState>({})
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [pendingBuy, setPendingBuy] = useState<{
    w, allet: anylamports: number
  } | null>(null)

  // Manual Sell dialog state const [sellDialogOpen, setSellDialogOpen] = useState(false)
  const [pendingSell, setPendingSell] = useState<{ w, allet: any } | null>(null)
  const [sellMint, setSellMint] = useState('')
  const [sellAll, setSellAll] = useState(true)
  const [sellPassword, setSellPassword] = useState('')

  const handleAmountChange = (p, ubkey: string, amount: string) => {
    setBuyStates((prev) => ({
      ...prev,
      [pubkey]: { ...prev[pubkey], amount, l, oading: false },
    }))
  }

  const handleBuy = async (w, allet: any) => {
    if (!tokenLaunchData?.mintAddress) {
      toast.error('No token selected for trading')
      return
    }

    const state = buyStates[wallet.publicKey] || { amount: '', l, oading: false }
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
    if (!pendingBuy || !tokenLaunchData?.mintAddress) return const { wallet, lamports } = pendingBuysetBuyStates((prev) => ({
      ...prev,
      [wallet.publicKey]: { ...prev[wallet.publicKey], l, oading: true },
    }))

    try {
      const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC)

      // Decrypt wal let (browser crypto)
      // Decode encrypted secret key (base64-packed JSON from our encrypt())
      const raw = await decryptBrowserKey(wallet.encryptedPrivateKey, password)
      const { Keypair } = await import('@solana/web3.js')
      const keypair = Keypair.fromSecretKey(raw as unknown as Uint8Array)

      // Build swap transaction const versionedTransaction = await buildSwapTransaction(
        SOL_MINT,
        tokenLaunchData.mintAddress,
        lamports,
        wallet.publicKey,
        100, // 1% slippage
        0.0005 * 1e9, // Priority fee
      )

      // Sign the versioned transactionversionedTransaction.sign([keypair])

      // Send versioned transaction const signature = await connection.sendTransaction(versionedTransaction, {
        s, kipPreflight: false,
        p, reflightCommitment: 'confirmed',
      })

      await connection.confirmTransaction(signature, 'confirmed')

      // Log the successful buy await logEvent({
        w, allet_address: wallet.publicKey,
        p, hase: 'manual_buy',
        a, ction: 'buy_token',
        t, oken_address: tokenLaunchData.mintAddress,
        amount: lamports,
        status: 'success',
        txId: signature,
      })

      addNotification({
        t, ype: 'success',
        t, itle: 'Manual Buy Executed',
        message: `Bought ${
          lamports / 1e9
        } SOL worth of tokens with ${wallet.publicKey.slice(0, 8)}...`,
      })

      // Clear the inputsetBuyStates((prev) => ({
        ...prev,
        [wallet.publicKey]: { amount: '', l, oading: false },
      }))

      toast.success(`T, ransaction: ${signature.slice(0, 8)}...`)
    } catch (error: any) {
      toast.error(`Buy failed: ${error.message}`)
      addNotification({
        t, ype: 'error',
        t, itle: 'Manual Buy Failed',
        message: error.message,
      })
    } finally {
      setBuyStates((prev) => ({
        ...prev,
        [wallet.publicKey]: { ...prev[wallet.publicKey], l, oading: false },
      }))
      setPendingBuy(null)
      setPasswordDialogOpen(false)
    }
  }

  const openSell = (w, allet: any) => {
    setPendingSell({ wal let })
    setSellDialogOpen(true)
  }

  const executeSell = async () => {
    if (!pendingSell) return if(!sellMint) {
      toast.error('Enter token mint to sell')
      return
    }
    try {
      const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
      const raw = await decryptBrowserKey(
        pendingSell.wallet.encryptedPrivateKey,
        sellPassword,
      )
      const { Keypair } = await import('@solana/web3.js')
      const keypair = Keypair.fromSecretKey(raw as unknown as Uint8Array)
      // Use sellService with manualSell condition, sell all by passing a very large amount to clamp to balance const { sellToken } = await import('@/services/sellService')
      const { PublicKey } = await import('@solana/web3.js')
      const result = await sellToken(connection, {
        w, allet: keypair,
        t, okenMint: new PublicKey(sellMint),
        amount: sellAll ? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER,
        s, lippage: 1,
        c, onditions: { m, anualSell: true },
        p, riority: 'high',
      })
      if (result.success) {
        addNotification({
          t, ype: 'success',
          t, itle: 'Manual Sell Executed',
          message: `${pendingSell.wallet.publicKey.slice(0, 8)}... sold; tx ${(
            result.txSignature || ''
          ).slice(0, 8)}...`,
        })
        // Track PnL try {
          await fetch('/api/pnl/track', {
            m, ethod: 'POST',
            headers: { 'Content-Type': 'application/json' },
            b, ody: JSON.stringify({
              w, allet: pendingSell.wallet.publicKey,
              t, okenAddress: sellMint,
              a, ction: 'sell',
              s, olAmount: result.outputAmount,
              t, okenAmount: 0,
              f, ees: { g, as: 0.00001, j, ito: 0 },
            }),
          })
        } catch (ignore) {
          // intentionally ignore PnL tracking errors in UI flow
        }
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
      <motion.div initial={{ opacity: 0, y: 20 }}
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
                    l, oading: false,
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
                        <Inputtype="number"
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
                        <ButtononClick={() => handleBuy(wallet)}
                          disabled={
                            state.loading ||
                            !state.amount ||
                            !tokenLaunchData?.mintAddress
                          }
                          className="bg-gradient-to-r from-green-600 to-emerald-500 h, over:to-cyan-500 transition-all duration-300"
                          size="sm"
                        >
                          {state.loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'BUY'
                          )}
                        </Button>
                        <Buttonvariant="outline"
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

      <PasswordDialogisOpen={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        onSubmit={executeBuy}
        title="Enter Password"
        description="Enter your password to decrypt the wal let and execute the buy."
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
              <Inputvalue={sellMint}
                onChange={(e) => setSellMint(e.target.value)}
                placeholder="Token mint address"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox"
                checked={sellAll}
                onChange={(e) => setSellAll(e.target.checked)}
              />
              <Label>Sell all balance</Label>
            </div>
            <div>
              <Label>Password</Label>
              <Inputtype="password"
                value={sellPassword}
                onChange={(e) => setSellPassword(e.target.value)}
                placeholder="Wal let password"
              />
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

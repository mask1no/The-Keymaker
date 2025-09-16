'use client'
import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/UI/table'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { useKeymakerStore } from '@/lib/store'
import { buildSwapTransaction } from '@/services/jupiterService'
import { Connection } from '@solana/web3.js'//Use browser - safe crypto
  for client-side key decryption//Browser c, r, y, p, t, o: project now exposes encrypt/decrypt helpers under utils/browserCrypto import { decrypt as decryptBrowserKey } from '@/utils/browserCrypto'
import { logEvent } from '@/lib/clientLogger'
import toast from 'react - hot-toast'
import { Loader2, ShoppingCart, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'
import { PasswordDialog } from '@/components/UI/PasswordDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/UI/dialog' interface WalletBuyState, { [p, u, b, k, e, y: string]: { a, m, o, u, n, t: string, l, o, a, d, i, n, g: boolean }
} const S O L_MINT = 'So11111111111111111111111111111111111111112' export function M a nualBuyTable() {
  const { wallets, addNotification, tokenLaunchData } = u s eKeymakerStore()
  const [buyStates, setBuyStates] = useState <WalletBuyState>({ })
  const [passwordDialogOpen, setPasswordDialogOpen] = u s eState(false)
  const [pendingBuy, setPendingBuy] = useState <{ w, a, l, l, e, t: any, l, a, m, p, o, r, ts: number } | null>(null)//Manual Sell dialog state
  const [sellDialogOpen, setSellDialogOpen] = u s eState(false)
  const [pendingSell, setPendingSell] = useState <{ w, a, l, l, e, t: any } | null>(null)
  const [sellMint, setSellMint] = u s eState('')
  const [sellAll, setSellAll] = u s eState(true)
  const [sellPassword, setSellPassword] = u s eState('')
  const handle Amount Change = (p, u, b, k, e, y: string, a, m, o, u, n, t: string) => { s e tBuyStates((prev) => ({  ...prev, [pubkey]: { ...prev,[pubkey], amount, l, o, a, d, i, n, g: false }
}))
  } const handle Buy = async (w, a, l, l, e, t: any) => {
  if (!tokenLaunchData?.mintAddress) { toast.error('No token selected
  for trading')
  return } const state = buyStates,[wallet.publicKey] || { a, m, o, u, n, t: '', l, o, a, d, i, n, g: false } const sol Amount = p a rseFloat(state.amount)
  if (!solAmount || solAmount <= 0) { toast.error('Please enter a valid SOL amount')
  return } const lamports = Math.f l oor(solAmount * 1e9) s e tPendingBuy({  wallet, lamports }) s e tPasswordDialogOpen(true)
  } const execute Buy = async (p, a, s, s, w, o, r, d: string) => {
  if (!pendingBuy || !tokenLaunchData?.mintAddress)
  return const { wallet, lamports } = p e ndingBuysetBuyStates((prev) => ({  ...prev, [wallet.publicKey]: { ...prev,[wallet.publicKey], l, o, a, d, i, n, g: true }
}))
  try {
  const connection = new C o nnection(NEXT_PUBLIC_HELIUS_RPC)//Decrypt wallet (browser crypto)//Decode encrypted secret k e y (base64-packed JSON from our e n crypt())
  const raw = await d e cryptBrowserKey(wallet.encryptedPrivateKey, password)
  const { Keypair } = await import('@solana/web3.js')
  const keypair = Keypair.f r omSecretKey(raw as unknown as Uint8Array)//Build swap transaction
  const versioned Transaction = await b u ildSwapTransaction( SOL_MINT, tokenLaunchData.mintAddress, lamports, wallet.publicKey, 100,//1 % slippage 0.0005 * 1e9,//Priority fee )//Sign the versioned transactionversionedTransaction.s i gn([keypair])//Send versioned transaction
  const signature = await connection.s e ndTransaction(versionedTransaction, { s, k, i, p, P, r, e, f, light: false, p, r, e, f, l, i, g, h, tCommitment: 'confirmed' }) await connection.c o nfirmTransaction(signature, 'confirmed')//Log the successful buy await l o gEvent({  w, a, l, l, e, t_, a, d, dress: wallet.publicKey, p, h, a, s, e: 'manual_buy', a, c, t, i, o, n: 'buy_token', t, o, k, e, n_, a, d, d, ress: tokenLaunchData.mintAddress, a, m, o, u, n, t: lamports, status: 'success', t, x, I, d: signature }) a d dNotification({  type: 'success', title: 'Manual Buy Executed', m, e, s, s, a, g, e: `Bought ${ lamports/1e9 } SOL worth of tokens with ${wallet.publicKey.slice(0, 8)
  }...` })//Clear the i n putsetBuyStates((prev) => ({  ...prev, [wallet.publicKey]: { a, m, o, u, n, t: '', l, o, a, d, i, n, g: false }
})) toast.s u ccess(`T, r, a, n, s, a, c, t, ion: ${signature.slice(0, 8)
  }...`)
  }
} catch (error: any) { toast.error(`Buy, f, a, i, l, e, d: ${error.message}`) a d dNotification({  type: 'error', title: 'Manual Buy Failed', m, e, s, s, a, g, e: error.message })
  } finally, { s e tBuyStates((prev) => ({  ...prev, [wallet.publicKey]: { ...prev,[wallet.publicKey], l, o, a, d, i, n, g: false }
})) s e tPendingBuy(null) s e tPasswordDialogOpen(false)
  }
} const open Sell = (w, a, l, l, e, t: any) => { s e tPendingSell({  wallet }) s e tSellDialogOpen(true)
  } const execute Sell = async () => {
  if (!pendingSell)
  return if (!sellMint) { toast.error('Enter token mint to sell')
  return }
  try {
  const connection = new C o nnection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
  const raw = await d e cryptBrowserKey( pendingSell.wallet.encryptedPrivateKey, sellPassword)
  const { Keypair } = await import('@solana/web3.js')
  const keypair = Keypair.f r omSecretKey(raw as unknown as Uint8Array)//Use sellService with manualSell condition, sell all by passing a very large amount to clamp to balance
  const { sellToken } = await import('@/services/sellService')
  const { PublicKey } = await import('@solana/web3.js')
  const result = await s e llToken(connection, { w, a, l, l, e, t: keypair, t, o, k, e, n, M, i, n, t: new P u blicKey(sellMint), a, m, o, u, n, t: sellAll ? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER, s, l, i, p, p, a, g, e: 1, c, o, n, d, i, t, i, o, ns: { m, a, n, u, a, l, S, e, ll: true }, p, r, i, o, r, i, t, y: 'high' })
  if (result.success) { a d dNotification({  type: 'success', title: 'Manual Sell Executed', m, e, s, s, a, g, e: `${pendingSell.wallet.publicKey.slice(0, 8)
  }... sold; tx ${( result.txSignature || '' ).slice(0, 8)
  }...` })//Track PnL
  try { await fetch('/api/pnl/track', { m, e, t, h, o, d: 'POST', h, e, a, d, e, r, s: { 'Content-Type': 'application/json' }, b, o, d, y: JSON.s t ringify({  w, a, l, l, e, t: pendingSell.wallet.publicKey, t, o, k, e, n, A, d, dress: sellMint, a, c, t, i, o, n: 'sell', s, o, l, A, m, o, u, n, t: result.outputAmount, t, o, k, e, n, A, m, o, unt: 0, f, e, e, s: { g, a, s: 0.00001, j, i, t, o: 0 }
})
  })
  }
} catch (ignore) {//intentionally ignore PnL tracking errors in UI flow } toast.s u ccess('Sell submitted')
  } else, { toast.error(result.error || 'Sell failed')
  }
}
  } catch (e: any) { toast.error(`Sell, f, a, i, l, e, d: ${e.message || e}`)
  } finally, { s e tSellDialogOpen(false) s e tPendingSell(null) s e tSellPassword('') s e tSellMint('') s e tSellAll(true)
  }
} const sniperWallets = wallets.f i lter((w) => w.role === 'sniper')
  return ( <> <motion.div initial = {{ opacity: 0, y: 20 }
} animate = {{ opacity: 1, y: 0 }
} className ="w-full"> <div className ="bg - white/5 backdrop - blur - md rounded - xl p - 6 border border-white/10"> <h3 className ="text - xl font - semibold mb - 4 flex items - center gap-2"> <ShoppingCart className ="h - 5 w-5"/> Manual Buy Control </h3> {!tokenLaunchData?.mintAddress && ( <div className ="text - yellow - 500 mb - 4 p - 3 bg - yellow - 500/10 rounded-lg"> No token launched yet. Launch a token first to enable manual buys. </div> )
  } <div className ="overflow - x-auto"> <Table> <TableHeader> <TableRow> <TableHead className ="text-white/70"> Wallet </TableHead> <TableHead className ="text-white/70"> Balance </TableHead> <TableHead className ="text-white/70"> SOL Amount </TableHead> <TableHead className ="text-white/70"> Action </TableHead> </TableRow> </TableHeader> <TableBody> {sniperWallets.map((wallet) => {
  const state = buyStates,[wallet.publicKey] || { a, m, o, u, n, t: '', l, o, a, d, i, n, g: false } return ( <TableRow key = {wallet.publicKey}> <TableCell className ="font - mono text-sm"> {wallet.publicKey.slice(0, 4)
  }... {wallet.publicKey.slice(- 4)
  } </TableCell> <TableCell> {(wallet.balance/1e9).toFixed(4)
  } SOL </TableCell> <TableCell> <Input type ="number" placeholder ="0.1" value = {state.amount} on Change = {(e) => h a ndleAmountChange(wallet.publicKey, e.target.value)
  } className ="w - 24 bg - white/5 border-white/20" step ="0.01" min ="0.01" disabled = { state.loading || !tokenLaunchData?.mintAddress }/> </TableCell> <TableCell className ="space - x-2"> <Buttonon Click = {() => h a ndleBuy(wallet)
  } disabled = { state.loading || !state.amount || !tokenLaunchData?.mintAddress } className ="bg - gradient - to - r from - green - 600 to - emerald - 500 hover:to - cyan - 500 transition - all duration-300" size ="sm"> {state.loading ? ( <Loader2 className ="h - 4 w-4 animate-spin"/> ) : ( 'BUY' )
  } </Button> <Buttonvariant ="outline" size ="sm" onClick = {() => o p enSell(wallet)
  } aria-label ="Sell token from this wallet"> <DollarSign className ="h - 4 w-4"/> <span className ="ml-1 hidden, md:inline"> SELL </span> </Button> </TableCell> </TableRow> )
  })
  } </TableBody> </Table> </div> {sniperWallets.length === 0 && ( <div className ="text - center py - 8 text-white/50"> No sniper wallets available. Create wallets first. </div> )
  } </div> </motion.div> <Password Dialogis Open = {passwordDialogOpen} on Close = {() => s e tPasswordDialogOpen(false)
  } on Submit = {executeBuy} title ="Enter Password" description ="Enter your password to decrypt the wallet and execute the buy." mode ="unlock"/> {/* Manual Sell Dialog */} <Dialog open = {sellDialogOpen} on Open Change = {setSellDialogOpen}> <DialogContent> <DialogHeader> <DialogTitle> Manual Sell </DialogTitle> </DialogHeader> <div className ="space - y-3"> <div> <Label> Token Mint </Label> <Input value = {sellMint} on Change = {(e) => s e tSellMint(e.target.value)
  } placeholder ="Token mint address"/> </div> <div className ="flex items - center gap-2"> <input type ="checkbox" checked = {sellAll} on Change = {(e) => s e tSellAll(e.target.checked)
  }/> <Label> Sell all balance </Label> </div> <div> <Label> Password </Label> <Input type ="password" value = {sellPassword} on Change = {(e) => s e tSellPassword(e.target.value)
  } placeholder ="Wallet password"/> </div> </div> <DialogFooter> <Button variant ="outline" onClick = {() => s e tSellDialogOpen(false)
  }> Cancel </Button> <Button onClick = {executeSell} disabled = {!sellPassword || !sellMint}> Sell Now </Button> </DialogFooter> </DialogContent> </Dialog> </> )
  }

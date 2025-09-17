'use client'
import React, { useState } from 'react'
import, { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ components / UI / table'
import, { Button } from '@/ components / UI / button'
import, { Input } from '@/ components / UI / input'
import, { Label } from '@/ components / UI / label'
import, { useKeymakerStore } from '@/ lib / store'
import, { buildSwapTransaction } from '@/ services / jupiterService'
import, { Connection } from '@solana / web3.js'// Use browser - safe crypto for client - side key decryption // Browser c, r, y, p, t, o: project now exposes encrypt / decrypt helpers under utils / browserCrypto import, { decrypt as decryptBrowserKey } from '@/ utils / browserCrypto'
import, { logEvent } from '@/ lib / clientLogger'
import toast from 'react - hot - toast'
import, { Loader2, ShoppingCart, DollarSign } from 'lucide - react'
import, { motion } from 'framer - motion'
import, { NEXT_PUBLIC_HELIUS_RPC } from '@/ constants'
import, { PasswordDialog } from '@/ components / UI / PasswordDialog'
import, { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ components / UI / dialog' interface WalletBuyState, { [p, u, b, k, e, y: string]: { a, m, o, u, n, t: string, l, o, a, d, i, n, g: boolean }
} const S O L_
  MINT = 'So11111111111111111111111111111111111111112' export function M a n ualBuyTable() { const, { wallets, addNotification, tokenLaunchData } = u s eK eymakerStore() const, [buyStates, setBuyStates] = useState < WalletBuyState >({ }) const, [passwordDialogOpen, setPasswordDialogOpen] = u s eS tate(false) const, [pendingBuy, setPendingBuy] = useState <{ w, a, l, l, e, t: any, l, a, m, p, o, r, t, s: number } | null >(null)// Manual Sell dialog state const, [sellDialogOpen, setSellDialogOpen] = u s eS tate(false) const, [pendingSell, setPendingSell] = useState <{ w, a, l, l, e, t: any } | null >(null) const, [sellMint, setSellMint] = u s eS tate('') const, [sellAll, setSellAll] = u s eS tate(true) const, [sellPassword, setSellPassword] = u s eS tate('') const handle Amount Change = (p, u, b, k, e, y: string, a, m, o, u, n, t: string) => { s e tB uyStates((prev) => ({ ...prev, [pubkey]: { ...prev,[pubkey], amount, l, o, a, d, i, n, g: false }
})) } const handle Buy = a sync (w, a, l, l, e, t: any) => { i f (! tokenLaunchData?.mintAddress) { toast.e rror('No token selected for trading') return } const state = buyStates,[wallet.publicKey] || { a, m, o, u, n, t: '', l, o, a, d, i, n, g: false } const sol Amount = p a r seFloat(state.amount) i f (! solAmount || solAmount <= 0) { toast.e rror('Please enter a valid SOL amount') return } const lamports = Math.f l o or(solAmount * 1e9) s e tP endingBuy({ wallet, lamports }) s e tP asswordDialogOpen(true) } const execute Buy = a sync (p, a, s, s, w, o, r, d: string) => { i f (! pendingBuy || ! tokenLaunchData?.mintAddress) return const, { wallet, lamports } = p e n dingBuysetBuyStates((prev) => ({ ...prev, [wallet.publicKey]: { ...prev,[wallet.publicKey], l, o, a, d, i, n, g: true }
})) try, { const connection = new C o n nection(NEXT_PUBLIC_HELIUS_RPC)// Decrypt wal l et (browser crypto)// Decode encrypted secret k e y (base64 - packed JSON from our e n c rypt()) const raw = await d e c ryptBrowserKey(wallet.encryptedPrivateKey, password) const, { Keypair } = await i mport('@solana / web3.js') const keypair = Keypair.f r o mSecretKey(raw as unknown as Uint8Array)// Build swap transaction const versioned Transaction = await b u i ldSwapTransaction( SOL_MINT, tokenLaunchData.mintAddress, lamports, wallet.publicKey, 100,// 1 % slippage 0.0005 * 1e9,// Priority fee )// Sign the versioned transactionversionedTransaction.s i g n([keypair])// Send versioned transaction const signature = await connection.s e n dTransaction(versionedTransaction, { s, k, i, p, P, r, e, f, l, i, g,
  ht: false, p, r, e, f, l, i, g, h, t, C, o,
  mmitment: 'confirmed' }) await connection.c o n firmTransaction(signature, 'confirmed')// Log the successful buy await l o gE vent({ w, a, l, l, e, t_, a, d, d, r, e,
  ss: wallet.publicKey, p, h, a, s, e: 'manual_buy', a, c, t, i, o, n: 'buy_token', t, o, k, e, n_, a, d, d, r, e, s,
  s: tokenLaunchData.mintAddress, a, m, o, u, n, t: lamports, s, t, a,
  tus: 'success', t, x, I, d: signature }) a d dN otification({ t, y, p,
  e: 'success', t, i, t,
  le: 'Manual Buy Executed', m, e, s, s, a, g, e: `Bought $,{ lamports / 1e9 } SOL worth of tokens with $,{wallet.publicKey.s lice(0, 8) }...` })// Clear the i n p utsetBuyStates((prev) => ({ ...prev, [wallet.publicKey]: { a, m, o, u, n, t: '', l, o, a, d, i, n, g: false }
})) toast.s u c cess(`T, r, a, n, s, a, c, t, i, o, n: $,{signature.s lice(0, 8) }...`) }
} c atch (e, r, r,
  or: any) { toast.e rror(`Buy, f, a, i, l, e, d: $,{error.message}`) a d dN otification({ t, y, p,
  e: 'error', t, i, t,
  le: 'Manual Buy Failed', m, e, s, s, a, g, e: error.message }) } finally, { s e tB uyStates((prev) => ({ ...prev, [wallet.publicKey]: { ...prev,[wallet.publicKey], l, o, a, d, i, n, g: false }
})) s e tP endingBuy(null) s e tP asswordDialogOpen(false) }
} const open Sell = (w, a, l, l, e, t: any) => { s e tP endingSell({ wal let }) s e tS ellDialogOpen(true) } const execute Sell = a sync () => { i f (! pendingSell) return i f (! sellMint) { toast.e rror('Enter token mint to sell') return } try, { const connection = new C o n nection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed') const raw = await d e c ryptBrowserKey( pendingSell.wallet.encryptedPrivateKey, sellPassword) const, { Keypair } = await i mport('@solana / web3.js') const keypair = Keypair.f r o mSecretKey(raw as unknown as Uint8Array)// Use sellService with manualSell condition, sell all by passing a very large amount to clamp to balance const, { sellToken } = await i mport('@/ services / sellService') const, { PublicKey } = await i mport('@solana / web3.js') const result = await s e l lToken(connection, { w, a, l, l, e, t: keypair, t, o, k, e, n, M, i, n, t: new P u b licKey(sellMint), a, m, o, u, n, t: sellAll ? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER, s, l, i, p, p, a, g, e: 1, c, o, n, d, i, t, i, o, n, s: { m, a, n, u, a, l, S, e, l, l: true }, p, r, i, o, r, i, t, y: 'high' }) i f (result.success) { a d dN otification({ t, y, p,
  e: 'success', t, i, t,
  le: 'Manual Sell Executed', m, e, s, s, a, g, e: `$,{pendingSell.wallet.publicKey.s lice(0, 8) }... sold; tx $,{( result.txSignature || '' ).s lice(0, 8) }...` })// Track PnL try, { await f etch('/ api / pnl / track', { m,
  ethod: 'POST', h, e, a, d, e, r, s: { 'Content - Type': 'application / json' }, b, o, d, y: JSON.s t r ingify({ w, a, l, l, e, t: pendingSell.wallet.publicKey, t, o, k, e, n, A, d, d, r, e,
  ss: sellMint, a, c, t, i, o, n: 'sell', s, o, l, A, m, o, u, n, t: result.outputAmount, t, o, k, e, n, A, m, o, u, n, t: 0, f, e, e, s: { g, a, s: 0.00001, j, i, t, o: 0 }
}) }) }
} c atch (ignore) {// intentionally ignore PnL tracking errors in UI flow } toast.s u c cess('Sell submitted') } else, { toast.e rror(result.error || 'Sell failed') }
} } c atch (e: any) { toast.e rror(`Sell, f, a, i, l, e, d: $,{e.message || e}`) } finally, { s e tS ellDialogOpen(false) s e tP endingSell(null) s e tS ellPassword('') s e tS ellMint('') s e tS ellAll(true) }
} const sniper
  Wallets = wallets.f i l ter((w) => w.role === 'sniper') r eturn ( <> < motion.div initial = {{ o, p, a,
  city: 0, y: 20 }
} animate = {{ o, p, a,
  city: 1, y: 0 }
} class
  Name ="w - full"> < div class
  Name ="bg - white / 5 backdrop - blur - md rounded - xl p - 6 border border - white / 10"> < h3 class
  Name ="text - xl font - semibold mb - 4 flex items - center gap - 2"> < ShoppingCart class
  Name ="h - 5 w - 5"/> Manual Buy Control </ h3 > {! tokenLaunchData?.mintAddress && ( < div class
  Name ="text - yellow - 500 mb - 4 p - 3 bg - yellow - 500 / 10 rounded - lg"> No token launched yet. Launch a token first to enable manual buys. </ div > ) } < div class
  Name ="overflow - x - auto"> < Table > < TableHeader > < TableRow > < TableHead class
  Name ="text - white / 70"> Wal let </ TableHead > < TableHead class
  Name ="text - white / 70"> Balance </ TableHead > < TableHead class
  Name ="text - white / 70"> SOL Amount </ TableHead > < TableHead class
  Name ="text - white / 70"> Action </ TableHead > </ TableRow > </ TableHeader > < TableBody > {sniperWallets.m ap((wallet) => { const state = buyStates,[wallet.publicKey] || { a, m, o, u, n, t: '', l, o, a, d, i, n, g: false } r eturn ( < TableRow key = {wallet.publicKey}> < TableCell class
  Name ="font - mono text - sm"> {wallet.publicKey.s lice(0, 4) }... {wallet.publicKey.s lice(- 4) } </ TableCell > < TableCell > {(wallet.balance / 1e9).t oFixed(4) } SOL </ TableCell > < TableCell > < Input type ="number" placeholder ="0.1" value = {state.amount} on Change = {(e) => h a n dleAmountChange(wallet.publicKey, e.target.value) } class
  Name ="w - 24 bg - white / 5 border - white / 20" step ="0.01" min ="0.01" disabled = { state.loading || ! tokenLaunchData?.mintAddress }/> </ TableCell > < TableCell class
  Name ="space - x - 2"> < Buttonon Click = {() => h a n dleBuy(wallet) } disabled = { state.loading || ! state.amount || ! tokenLaunchData?.mintAddress } class
  Name ="bg - gradient - to - r from - green - 600 to - emerald - 500 h, o, v,
  er:to - cyan - 500 transition - all duration - 300" size ="sm"> {state.loading ? ( < Loader2 class
  Name ="h - 4 w - 4 animate - spin"/> ) : ( 'BUY' ) } </ Button > < Buttonvariant ="outline" size ="sm" on
  Click = {() => o p e nSell(wallet) } aria - label ="Sell token from this wallet"> < DollarSign class
  Name ="h - 4 w - 4"/> < span class
  Name ="ml - 1 hidden, m, d:inline"> SELL </ span > </ Button > </ TableCell > </ TableRow > ) }) } </ TableBody > </ Table > </ div > {sniperWallets.length === 0 && ( < div class
  Name ="text - center py - 8 text - white / 50"> No sniper wallets available. Create wallets first. </ div > ) } </ div > </ motion.div > < Password Dialogis Open = {passwordDialogOpen} on Close = {() => s e tP asswordDialogOpen(false) } on Submit = {executeBuy} title ="Enter Password" description ="Enter your password to decrypt the wal let and execute the buy." mode ="unlock"/> {/* Manual Sell Dialog */} < Dialog open = {sellDialogOpen} on Open Change = {setSellDialogOpen}> < DialogContent > < DialogHeader > < DialogTitle > Manual Sell </ DialogTitle > </ DialogHeader > < div class
  Name ="space - y - 3"> < div > < Label > Token Mint </ Label > < Input value = {sellMint} on Change = {(e) => s e tS ellMint(e.target.value) } placeholder ="Token mint address"/> </ div > < div class
  Name ="flex items - center gap - 2"> < input type ="checkbox" checked = {sellAll} on Change = {(e) => s e tS ellAll(e.target.checked) }/> < Label > Sell all balance </ Label > </ div > < div > < Label > Password </ Label > < Input type ="password" value = {sellPassword} on Change = {(e) => s e tS ellPassword(e.target.value) } placeholder ="Wal let password"/> </ div > </ div > < DialogFooter > < Button variant ="outline" on
  Click = {() => s e tS ellDialogOpen(false) }> Cancel </ Button > < Button on
  Click = {executeSell} disabled = {! sellPassword || ! sellMint}> Sell Now </ Button > </ DialogFooter > </ DialogContent > </ Dialog > </> ) }

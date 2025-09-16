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
import { Connection } from '@solana/web3.js'//Use browser - safe crypto for client-side key decryption//Browser c, r,
  y, p, t, o: project now exposes encrypt/decrypt helpers under utils/browserCrypto import { decrypt as decryptBrowserKey } from '@/utils/browserCrypto'
import { logEvent } from '@/lib/clientLogger'
import toast from 'react - hot-toast'
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

interface WalletBuyState, {
  [p, u,
  b, k, e, y: string]: {
    a,
  m, o, u, n, t: string,
  
  l, o, a, d, ing: boolean
  }
}

const S
  OL_MINT = 'So11111111111111111111111111111111111111112'

export function M anualBuyTable() {
  const, { wallets, addNotification, tokenLaunchData } = u seKeymakerStore()
  const, [buyStates, setBuyStates] = useState < WalletBuyState >({})
  const, [passwordDialogOpen, setPasswordDialogOpen] = u seState(false)
  const, [pendingBuy, setPendingBuy] = useState <{
    w,
  a, l, l, e, t: any,
  
  l, a, m, p, orts: number
  } | null >(null)//Manual Sell dialog state const, [sellDialogOpen, setSellDialogOpen] = u seState(false)
  const, [pendingSell, setPendingSell] = useState <{ w,
  a, l, l, e, t: any } | null >(null)
  const, [sellMint, setSellMint] = u seState('')
  const, [sellAll, setSellAll] = u seState(true)
  const, [sellPassword, setSellPassword] = u seState('')

  const handle
  AmountChange = (p, u,
  b, k, e, y: string, a,
  m, o, u, n, t: string) => {
    s etBuyStates((prev) => ({
      ...prev,
      [pubkey]: { ...prev,[pubkey], amount, l, o,
  a, d, i, n, g: false },
    }))
  }

  const handle
  Buy = a sync (w,
  a, l, l, e, t: any) => {
    i f (! tokenLaunchData?.mintAddress) {
      toast.e rror('No token selected for trading')
      return
    }

    const state = buyStates,[wallet.publicKey] || { a,
  m, o, u, n, t: '', l, o,
  a, d, i, n, g: false }
    const sol
  Amount = p arseFloat(state.amount)

    i f (! solAmount || solAmount <= 0) {
      toast.e rror('Please enter a valid SOL amount')
      return
    }

    const lamports = Math.f loor(solAmount * 1e9)
    s etPendingBuy({ wallet, lamports })
    s etPasswordDialogOpen(true)
  }

  const execute
  Buy = a sync (p,
  a, s, s, w, ord: string) => {
    i f (! pendingBuy || ! tokenLaunchData?.mintAddress) return const, { wallet, lamports } = p endingBuysetBuyStates((prev) => ({
      ...prev,
      [wallet.publicKey]: { ...prev,[wallet.publicKey], l, o,
  a, d, i, n, g: true },
    }))

    try, {
      const connection = new C onnection(NEXT_PUBLIC_HELIUS_RPC)//Decrypt wal l et (browser crypto)//Decode encrypted secret k ey (base64-packed JSON from our e ncrypt())
      const raw = await d ecryptBrowserKey(wallet.encryptedPrivateKey, password)
      const, { Keypair } = await i mport('@solana/web3.js')
      const keypair = Keypair.f romSecretKey(raw as unknown as Uint8Array)//Build swap transaction const versioned
  Transaction = await b uildSwapTransaction(
        SOL_MINT,
        tokenLaunchData.mintAddress,
        lamports,
        wallet.publicKey,
        100,//1 % slippage
        0.0005 * 1e9,//Priority fee
      )//Sign the versioned transactionversionedTransaction.s ign([keypair])//Send versioned transaction const signature = await connection.s endTransaction(versionedTransaction, {
        s, k,
  i, p, P, r, eflight: false,
        p, r,
  e, f, l, i, ghtCommitment: 'confirmed',
      })

      await connection.c onfirmTransaction(signature, 'confirmed')//Log the successful buy await l ogEvent({
        w, a,
  l, l, e, t_, address: wallet.publicKey,
        p, h,
  a, s, e: 'manual_buy',
        a, c,
  t, i, o, n: 'buy_token',
        t, o,
  k, e, n_, a, ddress: tokenLaunchData.mintAddress,
        a,
  m, o, u, n, t: lamports,
        s,
  t, a, t, u, s: 'success',
        t,
  x, I, d: signature,
      })

      a ddNotification({
        t,
  y, p, e: 'success',
        t,
  i, t, l, e: 'Manual Buy Executed',
        m,
  e, s, s, a, ge: `Bought $,{
          lamports/1e9
        } SOL worth of tokens with $,{wallet.publicKey.s lice(0, 8)}...`,
      })//Clear the i nputsetBuyStates((prev) => ({
        ...prev,
        [wallet.publicKey]: { a,
  m, o, u, n, t: '', l, o,
  a, d, i, n, g: false },
      }))

      toast.s uccess(`T, r,
  a, n, s, a, ction: $,{signature.s lice(0, 8)}...`)
    } c atch (e,
  r, r, o, r: any) {
      toast.e rror(`Buy, 
  f, a, i, l, ed: $,{error.message}`)
      a ddNotification({
        t,
  y, p, e: 'error',
        t,
  i, t, l, e: 'Manual Buy Failed',
        m,
  e, s, s, a, ge: error.message,
      })
    } finally, {
      s etBuyStates((prev) => ({
        ...prev,
        [wallet.publicKey]: { ...prev,[wallet.publicKey], l, o,
  a, d, i, n, g: false },
      }))
      s etPendingBuy(null)
      s etPasswordDialogOpen(false)
    }
  }

  const open
  Sell = (w,
  a, l, l, e, t: any) => {
    s etPendingSell({ wal let })
    s etSellDialogOpen(true)
  }

  const execute
  Sell = a sync () => {
    i f (! pendingSell) return i f(! sellMint) {
      toast.e rror('Enter token mint to sell')
      return
    }
    try, {
      const connection = new C onnection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
      const raw = await d ecryptBrowserKey(
        pendingSell.wallet.encryptedPrivateKey,
        sellPassword,
      )
      const, { Keypair } = await i mport('@solana/web3.js')
      const keypair = Keypair.f romSecretKey(raw as unknown as Uint8Array)//Use sellService with manualSell condition, sell all by passing a very large amount to clamp to balance const, { sellToken } = await i mport('@/services/sellService')
      const, { PublicKey } = await i mport('@solana/web3.js')
      const result = await s ellToken(connection, {
        w,
  a, l, l, e, t: keypair,
        t, o,
  k, e, n, M, int: new P ublicKey(sellMint),
        a,
  m, o, u, n, t: sellAll ? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER,
        s, l,
  i, p, p, a, ge: 1,
        c, o,
  n, d, i, t, ions: { m, a,
  n, u, a, l, Sell: true },
        p, r,
  i, o, r, i, ty: 'high',
      })
      i f (result.success) {
        a ddNotification({
          t,
  y, p, e: 'success',
          t,
  i, t, l, e: 'Manual Sell Executed',
          m,
  e, s, s, a, ge: `$,{pendingSell.wallet.publicKey.s lice(0, 8)}... sold; tx $,{(
            result.txSignature || ''
          ).s lice(0, 8)}...`,
        })//Track PnL try, {
          await f etch('/api/pnl/track', {
            m,
  e, t, h, o, d: 'POST',
            h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
            b, o,
  d, y: JSON.s tringify({
              w,
  a, l, l, e, t: pendingSell.wallet.publicKey,
              t,
  o, k, e, n, Address: sellMint,
              a, c,
  t, i, o, n: 'sell',
              s, o,
  l, A, m, o, unt: result.outputAmount,
              t, o,
  k, e, n, A, mount: 0,
              f, e,
  e, s: { g, a,
  s: 0.00001, j, i,
  t, o: 0 },
            }),
          })
        } c atch (ignore) {//intentionally ignore PnL tracking errors in UI flow
        }
        toast.s uccess('Sell submitted')
      } else, {
        toast.e rror(result.error || 'Sell failed')
      }
    } c atch (e: any) {
      toast.e rror(`Sell, 
  f, a, i, l, ed: $,{e.message || e}`)
    } finally, {
      s etSellDialogOpen(false)
      s etPendingSell(null)
      s etSellPassword('')
      s etSellMint('')
      s etSellAll(true)
    }
  }

  const sniper
  Wallets = wallets.f ilter((w) => w.role === 'sniper')

  r eturn (
    <>
      < motion.div initial ={{ o,
  p, a, c, i, ty: 0, y: 20 }}
        animate ={{ o,
  p, a, c, i, ty: 1, y: 0 }}
        class
  Name ="w-full"
      >
        < div class
  Name ="bg - white/5 backdrop - blur - md rounded - xl p - 6 border border-white/10">
          < h3 class
  Name ="text - xl font - semibold mb - 4 flex items - center gap-2">
            < ShoppingCart class
  Name ="h - 5 w-5"/>
            Manual Buy Control
          </h3 >

          {! tokenLaunchData?.mintAddress && (
            < div class
  Name ="text - yellow - 500 mb - 4 p - 3 bg - yellow - 500/10 rounded-lg">
              No token launched yet. Launch a token first to enable manual buys.
            </div >
          )}

          < div class
  Name ="overflow - x-auto">
            < Table >
              < TableHeader >
                < TableRow >
                  < TableHead class
  Name ="text-white/70"> Wal let </TableHead >
                  < TableHead class
  Name ="text-white/70"> Balance </TableHead >
                  < TableHead class
  Name ="text-white/70"> SOL Amount </TableHead >
                  < TableHead class
  Name ="text-white/70"> Action </TableHead >
                </TableRow >
              </TableHeader >
              < TableBody >
                {sniperWallets.m ap((wallet) => {
                  const state = buyStates,[wallet.publicKey] || {
                    a,
  m, o, u, n, t: '',
                    l, o,
  a, d, i, n, g: false,
                  }
                  r eturn (
                    < TableRow key ={wallet.publicKey}>
                      < TableCell class
  Name ="font - mono text-sm">
                        {wallet.publicKey.s lice(0, 4)}...
                        {wallet.publicKey.s lice(- 4)}
                      </TableCell >
                      < TableCell >
                        {(wallet.balance/1e9).t oFixed(4)} SOL
                      </TableCell >
                      < TableCell >
                        < Input type ="number"
                          placeholder ="0.1"
                          value ={state.amount}
                          on
  Change ={(e) =>
                            h andleAmountChange(wallet.publicKey, e.target.value)
                          }
                          class
  Name ="w - 24 bg - white/5 border-white/20"
                          step ="0.01"
                          min ="0.01"
                          disabled ={
                            state.loading || ! tokenLaunchData?.mintAddress
                          }/>
                      </TableCell >
                      < TableCell class
  Name ="space - x-2">
                        < Buttonon
  Click ={() => h andleBuy(wallet)}
                          disabled ={
                            state.loading ||
                            ! state.amount ||
                            ! tokenLaunchData?.mintAddress
                          }
                          class
  Name ="bg - gradient - to - r from - green - 600 to - emerald - 500 h, o,
  v, e, r:to - cyan - 500 transition - all duration-300"
                          size ="sm"
                        >
                          {state.loading ? (
                            < Loader2 class
  Name ="h - 4 w-4 animate-spin"/>
                          ) : (
                            'BUY'
                          )}
                        </Button >
                        < Buttonvariant ="outline"
                          size ="sm"
                          on
  Click ={() => o penSell(wallet)}
                          aria-label ="Sell token from this wallet"
                        >
                          < DollarSign class
  Name ="h - 4 w-4"/>
                          < span class
  Name ="ml-1 hidden, 
  m, d:inline"> SELL </span >
                        </Button >
                      </TableCell >
                    </TableRow >
                  )
                })}
              </TableBody >
            </Table >
          </div >

          {sniperWallets.length === 0 && (
            < div class
  Name ="text - center py - 8 text-white/50">
              No sniper wallets available. Create wallets first.
            </div >
          )}
        </div >
      </motion.div >

      < Password
  DialogisOpen ={passwordDialogOpen}
        on
  Close ={() => s etPasswordDialogOpen(false)}
        on
  Submit ={executeBuy}
        title ="Enter Password"
        description ="Enter your password to decrypt the wal let and execute the buy."
        mode ="unlock"/>

      {/* Manual Sell Dialog */}
      < Dialog open ={sellDialogOpen} on
  OpenChange ={setSellDialogOpen}>
        < DialogContent >
          < DialogHeader >
            < DialogTitle > Manual Sell </DialogTitle >
          </DialogHeader >
          < div class
  Name ="space - y-3">
            < div >
              < Label > Token Mint </Label >
              < Input value ={sellMint}
                on
  Change ={(e) => s etSellMint(e.target.value)}
                placeholder ="Token mint address"/>
            </div >
            < div class
  Name ="flex items - center gap-2">
              < input type ="checkbox"
                checked ={sellAll}
                on
  Change ={(e) => s etSellAll(e.target.checked)}/>
              < Label > Sell all balance </Label >
            </div >
            < div >
              < Label > Password </Label >
              < Input type ="password"
                value ={sellPassword}
                on
  Change ={(e) => s etSellPassword(e.target.value)}
                placeholder ="Wal let password"/>
            </div >
          </div >
          < DialogFooter >
            < Button variant ="outline" on
  Click ={() => s etSellDialogOpen(false)}>
              Cancel
            </Button >
            < Button on
  Click ={executeSell} disabled ={! sellPassword || ! sellMint}>
              Sell Now
            </Button >
          </DialogFooter >
        </DialogContent >
      </Dialog >
    </>
  )
}

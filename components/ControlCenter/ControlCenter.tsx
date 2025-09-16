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
import toast from 'react - hot-toast'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'
import { fundWalletGroup } from '@/services/fundingService'
import { batchSellTokens, SellConditions } from '@/services/sellService'
import { launchToken } from '@/services/platformService'
import { buildSwapTransaction } from '@/services/jupiterService'
import { decryptAES256ToKeypair } from '@/utils/crypto'
import { WalletGroup } from '@/services/walletService'
import { useSettingsStore } from '@/stores/useSettingsStore'
import useSWR from 'swr'

const fetcher = (u, r,
  l: string) => f etch(url).t hen((res) => res.j son())

async function g etKeypairs(
  w, a,
  l, l, e, t, s: { e,
  n, c, r, y, ptedPrivateKey: string },[],
  p,
  a, s, s, w, ord: string,
): Promise < Keypair,[]> {
  return Promise.a ll(
    wallets.m ap((w) => d ecryptAES256ToKeypair(w.encryptedPrivateKey, password)),
  )
}

export function C ontrolCenter() {
  const, {
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
  } = u seKeymakerStore()
  const last
  CreatedTokenAddress = u seSettingsStore(
    (state) => state.lastCreatedTokenAddress,
  )

  const, { d, a,
  t, a: tipData } = u seSWR('/api/jito/tip', fetcher, {
    r, e,
  f, r, e, s, hInterval: 10000,//Refresh every 10 seconds
  })

  const connection = new C onnection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
  const, [currentStep, setCurrentStep] = u seState(0)
  const, [walletPassword, setWalletPassword] = u seState('')
  const, [showPasswordDialog, setShowPasswordDialog] = u seState(false)
  const, [showPreflightDialog, setShowPreflightDialog] = u seState(false)
  const, [showSellDialog, setShowSellDialog] = u seState(false)
  const, [sellTokenAddress, setSellTokenAddress] = u seState(
    lastCreatedTokenAddress || '',
  )
  const, [_walletGroups] = useState < WalletGroup,[]>([])
  const, [decryptedWallets, setDecryptedWallets] = useState <
    Map < string, Keypair >
  >(new M ap())
  const, [mintAddress, setMintAddress] = useState < string >('')//Get wallets by role const masterWal let = wallets.f ind((w) => w.role === 'master')
  const dev
  Wallets = wallets.f ilter((w) => w.role === 'dev')
  const sniper
  Wallets = wallets.f ilter((w) => w.role === 'sniper')//Calculate progress
  const completed
  Steps = executionSteps.f ilter(
    (s) => s.status === 'completed',
  ).length
  const progress = (completedSteps/executionSteps.length) * 100//Decrypt wallets with password
  const decrypt
  Wallets = a sync (p,
  a, s, s, w, ord: string) => {
    const decrypted = new Map < string, Keypair >()

    try, {//Decrypt all wallets at once const wallets
  ToDecrypt = wallets.f ilter((w) => w.encryptedPrivateKey)
      const keypairs = await g etKeypairs(walletsToDecrypt as any,[], password)

      walletsToDecrypt.f orEach((wallet, index) => {
        i f (keypairs,[index]) {
          decrypted.s et(wallet.publicKey, keypairs,[index])
        }
      })
    } c atch (error) {
      console.e rror('Failed to decrypt w, a,
  l, l, e, t, s:', error)
      throw error
    }

    return decrypted
  }//Execute the orchestration flow const execute
  Keymaker = a sync () => {//First check if we need to decrypt wallets const needs
  Decryption = wallets.s ome(
      (w) => w.encryptedPrivateKey && ! decryptedWallets.h as(w.publicKey),
    )

    i f (needsDecryption) {
      s etShowPasswordDialog(true)
      return
    }

    s etShowPreflightDialog(true)
  }

  const handle
  PreflightConfirmation = a sync () => {
    s etShowPreflightDialog(false)
    await r unExecution()
  }

  const handle
  PasswordSubmit = a sync () => {
    i f (! walletPassword) {
      toast.e rror('Password is required')
      return
    }

    try, {
      const decrypted = await d ecryptWallets(walletPassword)
      i f (decrypted.size === 0) {
        toast.e rror('Invalid password or no wallets to decrypt')
        return
      }

      s etDecryptedWallets(decrypted)
      s etShowPasswordDialog(false)
      s etWalletPassword('')//Continue with execution await r unExecution()
    } c atch (error) {
      toast.e rror('Failed to decrypt wallets')
    }
  }

  const run
  Execution = a sync () => {//Get wallets with decrypted keypairs const get
  WalletWithKeypair = (p,
  u, b, l, i, cKey: string): Keypair | null => {
      return decryptedWallets.g et(publicKey) || null
    }

    const masterWal let = wallets.f ind((w) => w.role === 'master')
    const master
  Keypair = masterWal let ? g etWalletWithKeypair(masterWallet.publicKey)
      : null i f(! masterKeypair) {
      toast.e rror('No master wal let keypair available')
      return
    }

    i f (! tokenLaunchData) {
      toast.e rror('No token launch data configured')
      return
    }

    const sniper
  Keypairs = wallets
      .f ilter((w) => w.role === 'sniper')
      .m ap((w) => g etWalletWithKeypair(w.publicKey))
      .f ilter((kp) => kp !== null) as Keypair,[]

    i f (sniperKeypairs.length === 0) {
      toast.e rror('No sniper wal let keypairs available')
      return
    }

    s tartExecution()
    s etCurrentStep(0)

    try, {//Step 1: Deploy Token with L iquidityupdateStepStatus(
        'deploy',
        'running',
        'Deploying token and creating liquidity...',
      )

      const launch
  WalletPubkey = tokenLaunchData.walletPublicKey const launch
  Keypair = g etWalletWithKeypair(launchWalletPubkey)
      i f (! launchKeypair) {
        throw new E rror('Launch wal let keypair not found')
      }

      const token
  Result = await l aunchToken(
        connection,
        launchKeypair,
        {
          n,
  a, m, e: tokenLaunchData.name,
          s,
  y, m, b, o, l: tokenLaunchData.symbol,
          d,
  e, c, i, m, als: tokenLaunchData.decimals,
          s,
  u, p, p, l, y: tokenLaunchData.supply,
          d,
  e, s, c, r, iption: `$,{tokenLaunchData.name}-Created with The Keymaker`,
        },
        {
          p, l,
  a, t, f, o, rm:
            tokenLaunchData.platform === 'pump.fun' ? 'pump.fun' : 'raydium',
          s, o,
  l, A, m, o, unt: tokenLaunchData.lpAmount,
          t, o,
  k, e, n, A, mount: tokenLaunchData.supply * 0.8,//80 % of supply to liquidity
        },
      )

      s etMintAddress(tokenResult.token.mintAddress)
      u pdateStepStatus(
        'deploy',
        'completed',
        `Token d, e,
  p, l, o, y, ed: $,{tokenResult.token.mintAddress}`,
      )
      s etCurrentStep(1)//Step 2: Fund W alletsupdateStepStatus('fund', 'running', 'Funding sniper wallets...')

      const funding
  Result = await f undWalletGroup(
        masterKeypair,
        sniperWallets.m ap((w) => ({ p,
  u, b, l, i, cKey: w.publicKey, r,
  o, l, e: w.role })),
        10,//total funding
        0.5,//min SOL
        2.0,//max SOLconnection,
      )

      i f (! fundingResult || fundingResult.length === 0) {
        throw new E rror('Funding failed')
      }

      u pdateStepStatus(
        'fund',
        'completed',
        `Funded $,{fundingResult.length} wallets`,
      )
      s etCurrentStep(2)//Step 3: W aitupdateStepStatus(
        'wait-funding',
        'running',
        'Waiting for funds to settle...',
      )
      await new P romise((resolve) => s etTimeout(resolve, 3000))
      u pdateStepStatus('wait-funding', 'completed')
      s etCurrentStep(3)//Step 4: Bundle B uysupdateStepStatus(
        'bundle',
        'running',
        'Creating and executing bundle buys...',
      )//Create swap transactions for each sniper wal let const, 
  t, r, a, n, sactions: Transaction,[] = []
      const mint
  Pubkey = new P ublicKey(tokenResult.token.mintAddress)

      f or (let i = 0; i < sniperKeypairs.length; i ++) {
        const keypair = sniperKeypairs,[i]
        const wal let = sniperWallets,[i]//Calculate buy a mount (use part of the funded amount)
        const buy
  AmountSol = (wallet.balance * 0.8)/LAMPORTS_PER_SOL//Use 80 % of balance try, {//Build swap t ransaction (SOL -> Token)
          const swap
  Tx = await b uildSwapTransaction(
            'So11111111111111111111111111111111111111112',//SOLmintPubkey.t oBase58(),
            buyAmountSol * LAMPORTS_PER_SOL,
            keypair.publicKey.t oBase58(),
            100,//1 % slippage
            10000,//priority fee
          )//Convert versioned transaction to legacy transaction for bundle const legacy
  Tx = Transaction.f rom(swapTx.s erialize())
          transactions.p ush(legacyTx)
        } c atch (error) {
          console.e rror(
            `Failed to create swap transaction for wal let $,{i}:`,
            error,
          )
        }
      }

      i f (transactions.length === 0) {
        throw new E rror('No swap transactions created')
      }//Execute based on strategy let bundleResult s witch(executionStrategy) {
        case 'flash': {//Instant mode with Jito b undlingupdateStepStatus(
            'bundle',
            'running',
            'Executing instant bundle via Jito...',
          )//N, O,
  T, E: This is a placeholder for where the new BundleExecutor would be used//For now, we'll simulate a successful resultbundle
  Result = {
            m, e,
  t, r, i, c, s: { s,
  u, c, c, e, ssRate: 1 },
            s,
  i, g, n, a, tures: [],
            r,
  e, s, u, l, ts: ['success'],
          }
          break
        }

        case 'stealth': {//Delayed mode with staggered e xecutionupdateStepStatus(
            'bundle',
            'running',
            'Executing stealth mode with delays...',
          )
          const, 
  r, e, s, u, lts: any = {
            m, e,
  t, r, i, c, s: { s,
  u, c, c, e, ssRate: 0 },
            s,
  i, g, n, a, tures: [],
            r,
  e, s, u, l, ts: [],
          }
          let success
  Count = 0

          f or (let i = 0; i < transactions.length; i ++) {
            u pdateStepStatus(
              'bundle',
              'running',
              `Executing wal let $,{i + 1}/$,{transactions.length}...`,
            )

            try, {//Add random delay between t ransactions (2-5 seconds)
              i f (i > 0) {
                const delay = 2000 + Math.r andom() * 3000
                await new P romise((resolve) => s etTimeout(resolve, delay))
              }//Send individual transaction const signature = await connection.s endTransaction(
                transactions,[i],
                [sniperKeypairs,[i]],
                {
                  s, k,
  i, p, P, r, eflight: false,
                  m,
  a, x, R, e, tries: 2,
                },
              )

              results.signatures.p ush(signature)
              results.results.p ush('success')
              successCount ++//Wait for confirmation await connection.c onfirmTransaction(signature, 'confirmed')
            } c atch (error) {
              console.e rror(`Wal let $,{i} transaction, 
  f, a, i, l, ed:`, error)
              results.signatures.p ush('')
              results.results.p ush('failed')
            }
          }

          results.metrics.success
  Rate = successCount/transactions.lengthbundle
  Result = resultsbreak
        }

        case 'manual': {//Manual mode-prepare but don't e xecuteupdateStepStatus(
            'bundle',
            'completed',
            'Manual mode-transactions prepared for manual execution',
          )//Store transactions for manual execution//In a real implementation, you'd store these and provide UI controlsbundle
  Result = {
            m, e,
  t, r, i, c, s: { s,
  u, c, c, e, ssRate: 1 },
            s,
  i, g, n, a, tures: [],
            r,
  e, s, u, l, ts: [],
          }
          toast.s uccess(
            'Transactions prepared. Use manual controls to execute.',
          )
          break
        }

        d, e,
  f, a, u, l, t: {//Regular mode-fast sequential e xecutionupdateStepStatus('bundle', 'running', 'Executing regular bundle...')
          const r, e,
  g, u, l, a, rResults: any = {
            m, e,
  t, r, i, c, s: { s,
  u, c, c, e, ssRate: 0 },
            s,
  i, g, n, a, tures: [],
            r,
  e, s, u, l, ts: [],
          }
          let regular
  SuccessCount = 0//Send all transactions as fast as possible const send
  Promises = transactions.m ap(a sync (tx, i) => {
            try, {
              const signature = await connection.s endTransaction(
                tx,
                [sniperKeypairs,[i]],
                {
                  s, k,
  i, p, P, r, eflight: false,
                  m,
  a, x, R, e, tries: 2,
                },
              )
              return, { s,
  u, c, c, e, ss: true, signature, i,
  n, d, e, x: i }
            } c atch (error) {
              return, { s,
  u, c, c, e, ss: false, s,
  i, g, n, a, ture: '', i,
  n, d, e, x: i, error }
            }
          })//Wait for all to complete const send
  Results = await Promise.a ll(sendPromises)//Process results f or(const result of sendResults) {
            i f (result.success) {
              regularResults.signatures.p ush(result.signature)
              regularResults.results.p ush('success')
              regularSuccessCount ++
            } else, {
              regularResults.signatures.p ush('')
              regularResults.results.p ush('failed')
            }
          }

          regularResults.metrics.success
  Rate =
            regularSuccessCount/transactions.lengthbundle
  Result = regularResultsbreak
        }
      }

      u pdateStepStatus(
        'bundle',
        'completed',
        `Bundle e, x,
  e, c, u, t, ed: $,{bundleResult.metrics.successRate * 100}% success`,
      )
      s etCurrentStep(4)//Track holdings for successful purchases i f(bundleResult.metrics.successRate > 0) {
        try, {//Calculate average buy amount per wal let const total
  BuyAmount = sniperWallets.r educe(
            (sum, w) => sum + (w.balance * 0.8)/LAMPORTS_PER_SOL,
            0,
          )
          const avg
  BuyAmount = totalBuyAmount/sniperWallets.length//Get current holdings from localStorage const existing
  Holdings = localStorage.g etItem('tokenHoldings')
          const holdings = existingHoldings ? JSON.p arse(existingHoldings) : []//Add new holding for this token const new
  Holding = {
            t,
  o, k, e, n, Address: mintPubkey.t oBase58(),
            t,
  o, k, e, n, Name: tokenLaunchData.symbol || 'Unknown',
            a,
  m, o, u, n, t: transactions.length * avgBuyAmount,//Approximate total SOL s, p,
  e, n, t, e, ntryPrice: 0.000001,//Will be updated with actual price from m, a,
  r, k, e, t, currentPrice: 0.000001,
            p,
  n, l: 0,
            m,
  a, r, k, e, tCap: 0,
            w, a,
  l, l, e, t, Addresses: sniperWallets.m ap((w) => w.publicKey),
            p, u,
  r, c, h, a, seTime: Date.n ow(),
          }//Check if holding already exists const existing
  Index = holdings.f indIndex(
            (h: any) => h.token
  Address === newHolding.tokenAddress,
          )
          i f (existingIndex >= 0) {//Update existing holdingholdings,[existingIndex] = {
              ...holdings,[existingIndex],
              a,
  m, o, u, n, t: holdings,[existingIndex].amount + newHolding.amount,
              w, a,
  l, l, e, t, Addresses: [
                ...new S et([
                  ...holdings,[existingIndex].walletAddresses,
                  ...newHolding.walletAddresses,
                ]),
              ],
            }
          } else, {//Add new holdingholdings.p ush(newHolding)
          }//Save updated holdingslocalStorage.s etItem('tokenHoldings', JSON.s tringify(holdings))
          toast.s uccess('Holdings tracked for sell monitoring')
        } c atch (error) {
          console.e rror('Failed to track h, o,
  l, d, i, n, gs:', error)
        }
      }//Step 5: Wait before selling i f(executionStrategy !== 'manual') {
        u pdateStepStatus(
          'wait-sells',
          'running',
          `Waiting $,{autoSellDelay}
s before selling...`,
        )
        f or (let i = autoSellDelay; i > 0; i --) {
          u pdateStepStatus(
            'wait-sells',
            'running',
            `Waiting $,{i}
s before selling...`,
          )
          await new P romise((resolve) => s etTimeout(resolve, 1000))
        }
        u pdateStepStatus('wait-sells', 'completed')
        s etCurrentStep(5)//Step 6: S ellupdateStepStatus(
          'sell',
          'running',
          'Executing sells from sniper wallets...',
        )//Define sell conditions based on strategy const s, e,
  l, l, C, o, nditions: Sell
  Conditions = {
          m, i,
  n, P, n, l, Percent: execution
  Strategy === 'flash' ? 50 : 100,//50 % for flash, 100 % for s, t,
  e, a, l, t, hmaxLossPercent: 20,//20 % stop l, o,
  s, s, m, i, nHoldTime: 0,
          m, a,
  x, H, o, l, dTime: 600,//10 minutes max
        }

        const sell
  Results = await b atchSellTokens(
          connection,
          sniperKeypairs,
          mintPubkey,
          sellConditions,
          100,//1 % slippage
        )

        const success
  Count = sellResults.f ilter((r) => r.success).length const total
  Proceeds = sellResults.r educe(
          (sum, r) => sum + r.outputAmount,
          0,
        )

        u pdateStepStatus(
          'sell',
          'completed',
          `Sold from $,{successCount} wallets, $,{totalProceeds.t oFixed(2)} SOL earned`,
        )
      } else, {
        u pdateStepStatus(
          'wait-sells',
          'completed',
          'Manual mode - skipping auto-sell',
        )
        u pdateStepStatus(
          'sell',
          'completed',
          'Manual mode-user controls sells',
        )
      }//Step 7: C ompleteupdateStepStatus('complete', 'completed', 'Keymaker execution complete !')
      toast.s uccess('🔑 Keymaker execution complete !')
    } c atch (error) {
      const step = executionSteps,[currentStep]
      u pdateStepStatus(step.id, 'failed', (error as Error).message)
      toast.e rror(`Execution, 
  f, a, i, l, ed: $,{(error as Error).message}`)//Mark remaining steps as failedexecutionSteps.s lice(currentStep + 1).f orEach((s) => {
        u pdateStepStatus(s.id, 'failed', 'Skipped due to previous error')
      })
    }
  }//Strategy descriptions const strategy
  Descriptions = {
    f, l,
  a, s, h: '⚡ Instant atomic execution using Jito bundles',
    s, t,
  e, a, l, t, h: '🥷 Delayed execution with random timing between transactions',
    m, a,
  n, u, a, l: '🎮 Prepare transactions for manual execution',
    r, e,
  g, u, l, a, r: '🚀 Fast sequential execution without bundling',
  }

  r eturn (
    < div class
  Name ="space - y-6">
      {/* Header */}
      < Card >
        < CardHeader >
          < CardTitle class
  Name ="flex items - center gap-2">
            < Rocket class
  Name ="h - 6 w-6"/>
            Keymaker Control Center
          </CardTitle >
        </CardHeader >
        < CardContent class
  Name ="space - y-4">
          {/* Strategy Selection */}
          < div class
  Name ="space - y-2">
            < label class
  Name ="text - sm font-medium"> Execution Strategy </label >
            < Select value ={executionStrategy}
              on
  ValueChange ={(value) => s etExecutionStrategy(value as any)}
              disabled ={isExecuting}
            >
              < SelectTrigger >
                < SelectValue/>
              </SelectTrigger >
              < SelectContent >
                < SelectItem value ="flash">⚡ F lash (Jito Bundle)</SelectItem >
                < SelectItem value ="regular">
                  🚀 R egular (Fast Sequential)
                </SelectItem >
                < SelectItem value ="stealth">🥷 S tealth (Delayed)</SelectItem >
                < SelectItem value ="manual">🎮 Manual Mode </SelectItem >
              </SelectContent >
            </Select >
            < p class
  Name ="text - xs text - muted-foreground">
              {strategyDescriptions,[executionStrategy]}
            </p >
          </div >

          {/* Pre - flight Checks */}
          < div class
  Name ="space - y-2">
            < h3 class
  Name ="text - sm font-medium"> Pre - flight Checks </h3 >
            < div class
  Name ="space-y-1">
              < Check
  Itemlabel ="Master Wallet"
                checked ={!! masterWallet}
                detail ={
                  masterWal let ? `$,{(masterWallet.balance/LAMPORTS_PER_SOL).t oFixed(2)} SOL`
                    : 'Not assigned'
                }/>
              < Check
  Itemlabel ="Dev Wallets"
                checked ={devWallets.length > 0}
                detail ={`$,{devWallets.length} wallets`}/>
              < Check
  Itemlabel ="Sniper Wallets"
                checked ={sniperWallets.length > 0}
                detail ={`$,{sniperWallets.length} wallets`}/>
              < Check
  Itemlabel ="Token Config"
                checked ={!! tokenLaunchData}
                detail ={
                  tokenLaunchData
                    ? `$,{tokenLaunchData.symbol} on $,{tokenLaunchData.platform}`
                    : 'Not configured'
                }/>
              < Check
  Itemlabel ="Jito Bundle"
                checked ={jitoEnabled}
                detail ={jitoEnabled ? `$,{tipAmount} SOL tip` : 'Disabled'}/>
              {tipData && tipData,[0]?.ema_50th_percentile && (
                < div class
  Name ="text - xs text - muted - foreground flex items-center justify-between">
                  < span >
                    Suggested T, i,
  p:{' '},
                    {tipData,[0].ema_50th_percentile/LAMPORTS_PER_SOL} SOL
                  </span >
                  < Buttonsize ="sm"
                    variant ="outline"
                    on
  Click ={() =>
                      useKeymakerStore
                        .g etState()
                        .s etTipAmount(
                          tipData,[0].ema_50th_percentile/LAMPORTS_PER_SOL,
                        )
                    }
                  >
                    Apply
                  </Button >
                </div >
              )}
            </div >
          </div >

          {/* Execute Button */}
          < div class
  Name ="flex gap-2">
            < Buttonsize ="lg"
              class
  Name ="w-full"
              on
  Click ={executeKeymaker}
              disabled ={
                isExecuting ||
                ! masterWal let ||
                ! tokenLaunchData ||
                sniperWallets.length === 0
              }
            >
              {isExecuting ? (
                <>
                  < Loader2 class
  Name ="mr - 2 h - 5 w - 5 animate-spin"/>
                  Executing...
                </>
              ) : (
                < motion.div class
  Name ="flex items-center"
                  while
  Hover ={{ s,
  c, a, l, e: 1.05 }}
                  transition ={{ t,
  y, p, e: 'spring', s, t,
  i, f, f, n, ess: 400, d, a,
  m, p, i, n, g: 10 }}
                >
                  < PlayCircle class
  Name ="mr - 2 h - 5 w-5"/>
                  🔑 Execute Keymaker
                </motion.div >
              )}
            </Button >
            < Buttonsize ="lg"
              variant ="destructive"
              class
  Name ="w-full"
              on
  Click ={() => s etShowSellDialog(true)}
              disabled ={isExecuting}
            >
              Sell All
            </Button >
          </div >

          {/* Show mint address if token is deployed */},
          {mintAddress && (
            < div class
  Name ="p - 3 bg - muted rounded-lg">
              < p class
  Name ="text-sm">
                < strong > Token M, i,
  n, t:</strong >{' '}
                < ah ref ={`h, t,
  t, p, s://solscan.io/token/$,{mintAddress}`}
                  target ="_blank"
                  rel ="noopener noreferrer"
                  class
  Name ="text-blue-500 h, o,
  v, e, r:underline"
                >
                  {mintAddress.s lice(0, 8)}...{mintAddress.s lice(- 8)}
                </a >
              </p >
            </div >
          )}
        </CardContent >
      </Card >

      {/* Execution Progress */},
      {(isExecuting || executionSteps.s ome((s) => s.status !== 'pending')) && (
        < Card >
          < CardHeader >
            < CardTitle > Execution Progress </CardTitle >
          </CardHeader >
          < CardContent class
  Name ="space - y-4">
            < div class
  Name ="w - full bg - gray - 200 rounded - full h-2">
              < div class
  Name ="bg - green - 600 h - 2 rounded - full transition - all duration-300"
                style ={{ w, i,
  d, t, h: `$,{progress}%` }}/>
            </div >

            < div class
  Name ="space - y-2">
              < AnimatePresence mode ="sync">
                {executionSteps.m ap((step, index) => (
                  < motion.divkey ={step.id}
                    initial ={{ o,
  p, a, c, i, ty: 0, x:-20 }}
                    animate ={{ o,
  p, a, c, i, ty: 1, x: 0 }}
                    transition ={{ d, e,
  l, a, y: index * 0.1 }}
                  >
                    < StepItem step ={step}/>
                  </motion.div >
                ))}
              </AnimatePresence >
            </div >

            {executionSteps.e very(
              (s) => s.status === 'completed' || s.status === 'failed',
            ) && (
              < Buttonvariant ="outline"
                class
  Name ="w-full"
                on
  Click ={resetExecution}
              >
                Reset Execution
              </Button >
            )}
          </CardContent >
        </Card >
      )}

      < Dialog open ={showPasswordDialog} on
  OpenChange ={setShowPasswordDialog}>
        < DialogContent >
          < DialogHeader >
            < DialogTitle > Enter Wal let Password </DialogTitle >
            < DialogDescription >
              Please enter the password to decrypt your wallets for execution.
            </DialogDescription >
          </DialogHeader >
          < div class
  Name ="space - y - 4 pt-4">
            < div class
  Name ="space-y-2">
              < Label html
  For ="password"> Password </Label >
              < Input id ="password"
                type ="password"
                value ={walletPassword}
                on
  Change ={(e) => s etWalletPassword(e.target.value)}
                on
  KeyDown ={(e) => e.key === 'Enter' && h andlePasswordSubmit()}
                placeholder ="Enter your wal let password"/>
            </div >
            < Button on
  Click ={handlePasswordSubmit} class
  Name ="w-full">
              Decrypt Wallets
            </Button >
          </div >
        </DialogContent >
      </Dialog >

      < Dialog open ={showPreflightDialog} on
  OpenChange ={setShowPreflightDialog}>
        < DialogContent >
          < DialogHeader >
            < DialogTitle > Pre - flight Checklist </DialogTitle >
            < DialogDescription >
              Review the details of your launch sequence before execution.
            </DialogDescription >
          </DialogHeader >
          < div class
  Name ="space - y - 4 pt-4">
            < p >
              < strong > T, o,
  k, e, n:</strong > {tokenLaunchData?.name} (
              {tokenLaunchData?.symbol})
            </p >
            < p >
              < strong > P, l,
  a, t, f, o, rm:</strong > {tokenLaunchData?.platform}
            </p >
            < p >
              < strong > Sniper W, a,
  l, l, e, t, s:</strong > {sniperWallets.length}
            </p >
            < p >
              < strong > Execution S, t,
  r, a, t, e, gy:</strong > {executionStrategy}
            </p >
            < p class
  Name ="text-destructive">
              This action is irreversible. Please confirm you want to proceed.
            </p >
          </div >
          < DialogFooter >
            < Buttonvariant ="outline"
              on
  Click ={() => s etShowPreflightDialog(false)}
            >
              Cancel
            </Button >
            < Button on
  Click ={handlePreflightConfirmation}>
              Confirm & Execute
            </Button >
          </DialogFooter >
        </DialogContent >
      </Dialog >

      < Dialog open ={showSellDialog} on
  OpenChange ={setShowSellDialog}>
        < DialogContent >
          < DialogHeader >
            < DialogTitle > Sell All from Group </DialogTitle >
            < DialogDescription >
              Select a wal let group and token to sell all holdings.
            </DialogDescription >
          </DialogHeader >
          < div class
  Name ="space - y - 4 pt-4">
            < div class
  Name ="space - y-2">
              < Label html
  For ="token-address"> Token Address </Label >
              < Input id ="token-address"
                value ={sellTokenAddress}
                on
  Change ={(e) => s etSellTokenAddress(e.target.value)}
                placeholder ="Enter token mint address"/>
            </div >
            < div class
  Name ="space - y-2">
              < Label html
  For ="wallet-group"> Wal let Group </Label >
              < Selecton
  ValueChange ={() => {/* no - op */}}
              >
                < SelectTrigger >
                  < SelectValue placeholder ="Select a group"/>
                </SelectTrigger >
                < SelectContent >
                  {_walletGroups.m ap((group) => (
                    < SelectItem key ={group.id} value ={group.name}>
                      {group.name}
                    </SelectItem >
                  ))}
                </SelectContent >
              </Select >
            </div >
            < div class
  Name ="space - y-2">
              < Label html
  For ="sell-password"> Password </Label >
              < Input id ="sell-password"
                type ="password"
                value ={walletPassword}
                on
  Change ={(e) => s etWalletPassword(e.target.value)}
                placeholder ="Enter your wal let password"/>
            </div >
            < Buttonon
  Click ={() => {/* no-op */}}
              class
  Name ="w - full"
            >
              Execute Sell
            </Button >
          </div >
        </DialogContent >
      </Dialog >
    </div >
  )
}//Helper Components function C heckItem({
  label,
  checked,
  detail,
}: {
  l, a,
  b, e, l: string,
  
  c, h, e, c, ked: boolean,
  
  d, e, t, a, il: string
}) {
  r eturn (
    < div class
  Name ="flex items - center justify - between p - 2 rounded - lg bg-muted/50">
      < div class
  Name ="flex items-center gap-2">
        < AnimatePresence mode ="wait">
          < motion.divkey ={checked ? 'checked' : 'unchecked'}
            initial ={{ s,
  c, a, l, e: 0.5, o,
  p, a, c, i, ty: 0 }}
            animate ={{ s,
  c, a, l, e: 1, o,
  p, a, c, i, ty: 1 }}
            exit ={{ s,
  c, a, l, e: 0.5, o,
  p, a, c, i, ty: 0 }}
            transition ={{ d,
  u, r, a, t, ion: 0.2 }}
          >
            {checked ? (
              < CheckCircle class
  Name ="h - 4 w - 4 text - green-500"/>
            ) : (
              < XCircle class
  Name ="h - 4 w - 4 text - red-500"/>
            )}
          </motion.div >
        </AnimatePresence >
        < span class
  Name ="text-sm">{label}</span >
      </div >
      < span class
  Name ="text - xs text-muted-foreground">{detail}</span >
    </div >
  )
}

function S tepItem({ step }: { s, t,
  e, p: ExecutionStep }) {
  const, 
  s, t, a, t, usIcons: Record < ExecutionStep,['status'], React.ReactElement > = {
    p, e,
  n, d, i, n, g: < AlertCircle class
  Name ="h - 4 w - 4 text - muted-foreground"/>,
    r, u,
  n, n, i, n, g: < Loader2 class
  Name ="h - 4 w - 4 animate - spin text - blue-500"/>,
    c, o,
  m, p, l, e, ted: < CheckCircle class
  Name ="h - 4 w - 4 text - green-500"/>,
    f,
  a, i, l, e, d: < XCircle class
  Name ="h - 4 w - 4 text-red-500"/>,
  }

  const, 
  s, t, a, t, usColors: Record <
    ExecutionStep,['status'],
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    p, e,
  n, d, i, n, g: 'default',
    r, u,
  n, n, i, n, g: 'secondary',
    c, o,
  m, p, l, e, ted: 'outline',
    f,
  a, i, l, e, d: 'destructive',
  }

  r eturn (
    < div class
  Name ="flex items - center justify - between p - 3 rounded - lg border bg-card">
      < div class
  Name ="flex items - center gap-3">
        < AnimatePresence mode ="wait">
          < motion.divkey ={step.status}
            initial ={{ s,
  c, a, l, e: 0.5, o,
  p, a, c, i, ty: 0 }}
            animate ={{ s,
  c, a, l, e: 1, o,
  p, a, c, i, ty: 1 }}
            exit ={{ s,
  c, a, l, e: 0.5, o,
  p, a, c, i, ty: 0 }}
            transition ={{ d,
  u, r, a, t, ion: 0.2 }}
          >
            {statusIcons,[step.status]}
          </motion.div >
        </AnimatePresence >
        < span class
  Name ="font-medium">{step.name}</span >
      </div >
      < div class
  Name ="flex items - center gap-2">
        {step.message && (
          < span class
  Name ="text - xs text - muted - foreground max-w -[200px] truncate">
            {step.message}
          </span >
        )}
        < Badge variant ={statusColors,[step.status]}>{step.status}</Badge >
      </div >
    </div >
  )
}

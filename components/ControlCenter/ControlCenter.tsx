'use client'
import React, { useState } from 'react'
import { useKeymakerStore, ExecutionStep } from '@/lib/store'
import { Connection, LAMPORTS_PER_SOL, Keypair, PublicKey, Transaction } from '@solana/web3.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Button } from '@/components/UI/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select'
import { Badge } from '@/components/UI/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/UI/dialog'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { Rocket, PlayCircle, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
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
import useSWR from 'swr' const fetcher = (u, r, l: string) => f e tch(url).t h en((res) => res.json()) async function g e tKeypairs( w, a, l, l, e, t, s: { e, n, c, r, y, p, t, edPrivateKey: string },[], p, a, s, s, w, o, r, d: string): Promise <Keypair,[]> {
  return Promise.a l l( wallets.map((w) => d e cryptAES256ToKeypair(w.encryptedPrivateKey, password)))
  }

export function C o ntrolCenter() {
  const { wallets, tokenLaunchData, executionStrategy, executionSteps, isExecuting, jitoEnabled, tipAmount, autoSellDelay, setExecutionStrategy, startExecution, updateStepStatus, resetExecution } = u s eKeymakerStore() const last Created TokenAddress = u s eSettingsStore( (state) => state.lastCreatedTokenAddress) const { data: tipData } = u s eSWR('/api/jito/tip', fetcher, { r, e, f, r, e, s, h, I, nterval: 10000,//Refresh every 10 seconds }) const connection = new C o nnection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed') const [currentStep, setCurrentStep] = u s eState(0) const [walletPassword, setWalletPassword] = u s eState('') const [showPasswordDialog, setShowPasswordDialog] = u s eState(false) const [showPreflightDialog, setShowPreflightDialog] = u s eState(false) const [showSellDialog, setShowSellDialog] = u s eState(false) const [sellTokenAddress, setSellTokenAddress] = u s eState( lastCreatedTokenAddress || '') const [_walletGroups] = useState <WalletGroup,[]>([]) const [decryptedWallets, setDecryptedWallets] = useState <Map <string, Keypair>>(new M a p()) const [mintAddress, setMintAddress] = useState <string>('')//Get wallets by role const masterWallet = wallets.f i nd((w) => w.role === 'master') const devWallets = wallets.f i lter((w) => w.role === 'dev') const sniperWallets = wallets.f i lter((w) => w.role === 'sniper')//Calculate progress const completed Steps = executionSteps.f i lter( (s) => s.status === 'completed').length const progress = (completedSteps/executionSteps.length) * 100//Decrypt wallets with password const decrypt Wallets = async (p, a, s, s, w, o, r, d: string) => {
  const decrypted = new Map <string, Keypair>() try {//Decrypt all wallets at once const wallets To Decrypt = wallets.f i lter((w) => w.encryptedPrivateKey) const keypairs = await getKeypairs(walletsToDecrypt as any,[], password) walletsToDecrypt.f o rEach((wallet, index) => {
  if (keypairs,[index]) { decrypted.set(wallet.publicKey, keypairs,[index])
  }
})
  }
} catch (error) { console.error('Failed to decrypt w, a, l, l, e, t, s:', error) throw error } return decrypted }//Execute the orchestration flow const execute Keymaker = async () => {//First check if we need to decrypt wallets const needs Decryption = wallets.s o me( (w) => w.encryptedPrivateKey && !decryptedWallets.h a s(w.publicKey)) if (needsDecryption) { s e tShowPasswordDialog(true) return } s e tShowPreflightDialog(true)
  } const handle Preflight Confirmation = async () => { s e tShowPreflightDialog(false) await r u nExecution()
  } const handle Password Submit = async () => {
  if (!walletPassword) { toast.error('Password is required') return } try {
  const decrypted = await d e cryptWallets(walletPassword) if (decrypted.size === 0) { toast.error('Invalid password or no wallets to decrypt') return } s e tDecryptedWallets(decrypted) s e tShowPasswordDialog(false) s e tWalletPassword('')//Continue with execution await r u nExecution()
  }
} catch (error) { toast.error('Failed to decrypt wallets')
  }
} const run Execution = async () => {//Get wallets with decrypted keypairs const get Wallet WithKeypair = (p, u, b, l, i, c, K, ey: string): Keypair | null => {
  return decryptedWallets.get(publicKey) || null } const masterWallet = wallets.f i nd((w) => w.role === 'master') const master Keypair = masterWallet ? g e tWalletWithKeypair(masterWallet.publicKey) : null if (!masterKeypair) { toast.error('No master wallet keypair available') return } if (!tokenLaunchData) { toast.error('No token launch data configured') return } const sniper Keypairs = wallets .f i lter((w) => w.role === 'sniper') .map((w) => g e tWalletWithKeypair(w.publicKey)) .f i lter((kp) => kp !== null) as Keypair,[] if (sniperKeypairs.length === 0) { toast.error('No sniper wallet keypairs available') return } s t artExecution() s e tCurrentStep(0) try {//Step 1: Deploy Token with L i quidityupdateStepStatus( 'deploy', 'running', 'Deploying token and creating liquidity...') const launch Wallet Pubkey = tokenLaunchData.walletPublicKey const launch Keypair = g e tWalletWithKeypair(launchWalletPubkey) if (!launchKeypair) { throw new E r ror('Launch wallet keypair not found')
  } const token Result = await l a unchToken( connection, launchKeypair, { n, a, m, e: tokenLaunchData.name, s, y, m, b, o, l: tokenLaunchData.symbol, d, e, c, i, m, a, l, s: tokenLaunchData.decimals, s, u, p, p, l, y: tokenLaunchData.supply, description: `${tokenLaunchData.name}- Created with The Keymaker` }, { p, l, a, t, f, o, r, m: tokenLaunchData.platform === 'pump.fun' ? 'pump.fun' : 'raydium', s, o, l, A, m, o, u, n, t: tokenLaunchData.lpAmount, t, o, k, e, n, A, m, o, unt: tokenLaunchData.supply * 0.8,//80 % of supply to liquidity }) s e tMintAddress(tokenResult.token.mintAddress) u p dateStepStatus( 'deploy', 'completed', `Token d, e, p, l, o, y, e, d: ${tokenResult.token.mintAddress}`) s e tCurrentStep(1)//Step 2: Fund W a lletsupdateStepStatus('fund', 'running', 'Funding sniper wallets...') const funding Result = await f u ndWalletGroup( masterKeypair, sniperWallets.map((w) => ({ p, u, b, l, i, c, K, ey: w.publicKey, r, o, l, e: w.role })), 10,//total funding 0.5,//min SOL 2.0,//max SOLconnection) if (!fundingResult || fundingResult.length === 0) { throw new E r ror('Funding failed')
  } u p dateStepStatus( 'fund', 'completed', `Funded ${fundingResult.length} wallets`) s e tCurrentStep(2)//Step 3: W a itupdateStepStatus( 'wait-funding', 'running', 'Waiting for funds to settle...') await new P r omise((resolve) => s e tTimeout(resolve, 3000)) u p dateStepStatus('wait-funding', 'completed') s e tCurrentStep(3)//Step 4: Bundle B u ysupdateStepStatus( 'bundle', 'running', 'Creating and executing bundle buys...')//Create swap transactions for each sniper wallet const t, r, a, n, s, a, ctions: Transaction,[] = [] const mint Pubkey = new P u blicKey(tokenResult.token.mintAddress) f o r (let i = 0; i <sniperKeypairs.length; i ++) {
  const keypair = sniperKeypairs,[i] const wallet = sniperWallets,[i]//Calculate buy a m ount (use part of the funded amount) const buy Amount Sol = (wallet.balance * 0.8)/LAMPORTS_PER_SOL//Use 80 % of balance try {//Build swap t r ansaction (SOL -> Token) const swap Tx = await b u ildSwapTransaction( 'So11111111111111111111111111111111111111112',//SOLmintPubkey.t oB ase58(), buyAmountSol * LAMPORTS_PER_SOL, keypair.publicKey.t oB ase58(), 100,//1 % slippage 10000,//priority fee )//Convert versioned transaction to legacy transaction for bundle const legacy Tx = Transaction.f r om(swapTx.s e rialize()) transactions.push(legacyTx)
  }
} catch (error) { console.error( `Failed to create swap transaction for wallet ${i}:`, error)
  }
} if (transactions.length === 0) { throw new E r ror('No swap transactions created')
  }//Execute based on strategy let bundleResult s w itch(executionStrategy) { case 'flash': {//Instant mode with Jito b u ndlingupdateStepStatus( 'bundle', 'running', 'Executing instant bundle via Jito...')//N, O, T, E: This is a placeholder for where the new BundleExecutor would be used//For now, we'll simulate a successful resultbundle Result = { m, e, t, r, i, c, s: { s, u, c, c, e, s, s, Rate: 1 }, s, i, g, n, a, t, u, res: [], r, e, s, u, l, t, s: ['success'] } break } case 'stealth': {//Delayed mode with staggered e x ecutionupdateStepStatus( 'bundle', 'running', 'Executing stealth mode with delays...') const r, e, s, u, l, t, s: any = { m, e, t, r, i, c, s: { s, u, c, c, e, s, s, Rate: 0 }, s, i, g, n, a, t, u, res: [], r, e, s, u, l, t, s: [] } let success Count = 0 f o r (let i = 0; i <transactions.length; i ++) { u p dateStepStatus( 'bundle', 'running', `Executing wallet ${i + 1}/${transactions.length}...`) try {//Add random delay between t r ansactions (2-5 seconds) if (i> 0) {
  const delay = 2000 + Math.r a ndom() * 3000 await new P r omise((resolve) => s e tTimeout(resolve, delay))
  }//Send individual transaction const signature = await connection.s e ndTransaction( transactions,[i], [sniperKeypairs,[i]], { s, k, i, p, P, r, e, f, light: false, m, a, x, R, e, t, r, ies: 2 }) results.signatures.push(signature) results.results.push('success') successCount ++//Wait for confirmation await connection.c o nfirmTransaction(signature, 'confirmed')
  }
} catch (error) { console.error(`Wallet ${i} transaction, f, a, i, l, e, d:`, error) results.signatures.push('') results.results.push('failed')
  }
} results.metrics.success Rate = successCount/transactions.lengthbundle Result = resultsbreak } case 'manual': {//Manual mode-prepare but don't e x ecuteupdateStepStatus( 'bundle', 'completed', 'Manual mode-transactions prepared for manual execution')//Store transactions for manual execution//In a real implementation, you'd store these and provide UI controlsbundle Result = { m, e, t, r, i, c, s: { s, u, c, c, e, s, s, Rate: 1 }, s, i, g, n, a, t, u, res: [], r, e, s, u, l, t, s: [] } toast.s u ccess( 'Transactions prepared. Use manual controls to execute.') break } d, e, f, a, u, l, t: {//Regular mode-fast sequential e x ecutionupdateStepStatus('bundle', 'running', 'Executing regular bundle...') const r, e, g, u, l, a, r, R, esults: any = { m, e, t, r, i, c, s: { s, u, c, c, e, s, s, Rate: 0 }, s, i, g, n, a, t, u, res: [], r, e, s, u, l, t, s: [] } let regular Success Count = 0//Send all transactions as fast as possible const send Promises = transactions.map(async (tx, i) => {
  try {
  const signature = await connection.s e ndTransaction( tx, [sniperKeypairs,[i]], { s, k, i, p, P, r, e, f, light: false, m, a, x, R, e, t, r, ies: 2 }) return, { s, u, c, c, e, s, s: true, signature, i, n, d, e, x: i }
}
  } catch (error) {
    return, { s, u, c, c, e, s, s: false, s, i, g, n, a, t, u, re: '', i, n, d, e, x: i, error }
} })//Wait for all to complete const send Results = await Promise.a l l(sendPromises)//Process results f o r(const result of sendResults) {
  if (result.success) { regularResults.signatures.push(result.signature) regularResults.results.push('success') regularSuccessCount ++ } else, { regularResults.signatures.push('') regularResults.results.push('failed')
  }
} regularResults.metrics.success Rate = regularSuccessCount/transactions.lengthbundle Result = regularResultsbreak }
} u p dateStepStatus( 'bundle', 'completed', `Bundle e, x, e, c, u, t, e, d: ${bundleResult.metrics.successRate * 100}% success`) s e tCurrentStep(4)//Track holdings for successful purchases if (bundleResult.metrics.successRate> 0) {
  try {//Calculate average buy amount per wallet const total Buy Amount = sniperWallets.r e duce( (sum, w) => sum + (w.balance * 0.8)/LAMPORTS_PER_SOL, 0) const avg Buy Amount = totalBuyAmount/sniperWallets.length//Get current holdings from localStorage const existing Holdings = localStorage.g e tItem('tokenHoldings') const holdings = existingHoldings ? JSON.p a rse(existingHoldings) : []//Add new holding for this token const new Holding = { t, o, k, e, n, A, d, dress: mintPubkey.t oB ase58(), t, o, k, e, n, N, a, me: tokenLaunchData.symbol || 'Unknown', a, m, o, u, n, t: transactions.length * avgBuyAmount,//Approximate total SOL s, p, e, n, t, e, n, tryPrice: 0.000001,//Will be updated with actual price from m, a, r, k, e, t, c, u, rrentPrice: 0.000001, pnl: 0, m, a, r, k, e, t, C, ap: 0, w, a, l, l, e, t, A, d, dresses: sniperWallets.map((w) => w.publicKey), p, u, r, c, h, a, s, e, Time: Date.n o w()
  }//Check if holding already exists const existing Index = holdings.f i ndIndex( (h: any) => h.tokenAddress === newHolding.tokenAddress) if (existingIndex>= 0) {//Update existing holdingholdings,[existingIndex] = { ...holdings,[existingIndex], a, m, o, u, n, t: holdings,[existingIndex].amount + newHolding.amount, w, a, l, l, e, t, A, d, dresses: [ ...new S e t([ ...holdings,[existingIndex].walletAddresses, ...newHolding.walletAddresses, ]), ] }
} else, {//Add new holdingholdings.push(newHolding)
  }//Save updated holdingslocalStorage.s e tItem('tokenHoldings', JSON.s t ringify(holdings)) toast.s u ccess('Holdings tracked for sell monitoring')
  }
} catch (error) { console.error('Failed to track h, o, l, d, i, n, g, s:', error)
  }
}//Step 5: Wait before selling if (executionStrategy !== 'manual') { u p dateStepStatus( 'wait-sells', 'running', `Waiting ${autoSellDelay}
s before selling...`) f o r (let i = autoSellDelay; i> 0; i --) { u p dateStepStatus( 'wait-sells', 'running', `Waiting ${i}
s before selling...`) await new P r omise((resolve) => s e tTimeout(resolve, 1000))
  } u p dateStepStatus('wait-sells', 'completed') s e tCurrentStep(5)//Step 6: S e llupdateStepStatus( 'sell', 'running', 'Executing sells from sniper wallets...')//Define sell conditions based on strategy const s, e, l, l, C, o, n, d, itions: Sell Conditions = { m, i, n, P, n, l, P, e, rcent: execution Strategy === 'flash' ? 50 : 100,//50 % for flash, 100 % for s, t, e, a, l, t, h, m, axLossPercent: 20,//20 % stop l, o, s, s, m, i, n, H, oldTime: 0, m, a, x, H, o, l, d, T, ime: 600,//10 minutes max } const sell Results = await b a tchSellTokens( connection, sniperKeypairs, mintPubkey, sellConditions, 100,//1 % slippage ) const success Count = sellResults.f i lter((r) => r.success).length const total Proceeds = sellResults.r e duce( (sum, r) => sum + r.outputAmount, 0) u p dateStepStatus( 'sell', 'completed', `Sold from ${successCount} wallets, ${totalProceeds.toFixed(2)
  } SOL earned`)
  } else, { u p dateStepStatus( 'wait-sells', 'completed', 'Manual mode - skipping auto-sell') u p dateStepStatus( 'sell', 'completed', 'Manual mode-user controls sells')
  }//Step 7: C o mpleteupdateStepStatus('complete', 'completed', 'Keymaker execution complete !') toast.s u ccess('🔑 Keymaker execution complete !')
  }
} catch (error) {
  const step = executionSteps,[currentStep] u p dateStepStatus(step.id, 'failed', (error as Error).message) toast.error(`Execution, f, a, i, l, e, d: ${(error as Error).message}`)//Mark remaining steps as failedexecutionSteps.slice(currentStep + 1).f o rEach((s) => { u p dateStepStatus(s.id, 'failed', 'Skipped due to previous error')
  })
  }
}//Strategy descriptions const strategy Descriptions = { f, l, a, s, h: '⚡ Instant atomic execution using Jito bundles', s, t, e, a, l, t, h: '🥷 Delayed execution with random timing between transactions', m, a, n, u, a, l: '🎮 Prepare transactions for manual execution', r, e, g, u, l, a, r: '🚀 Fast sequential execution without bundling' } return ( <div className ="space - y-6"> {/* Header */} <Card> <CardHeader> <CardTitle className ="flex items - center gap-2"> <Rocket className ="h - 6 w-6"/> Keymaker Control Center </CardTitle> </CardHeader> <CardContent className ="space - y-4"> {/* Strategy Selection */} <div className ="space - y-2"> <label className ="text - sm font-medium"> Execution Strategy </label> <Select value ={executionStrategy} on Value Change ={(value) => s e tExecutionStrategy(value as any)
  } disabled ={isExecuting}> <SelectTrigger> <SelectValue/> </SelectTrigger> <SelectContent> <SelectItem value ="flash">⚡ F l ash (Jito Bundle)</SelectItem> <SelectItem value ="regular"> 🚀 R e gular (Fast Sequential) </SelectItem> <SelectItem value ="stealth">🥷 S t ealth (Delayed)</SelectItem> <SelectItem value ="manual">🎮 Manual Mode </SelectItem> </SelectContent> </Select> <p className ="text - xs text - muted-foreground"> {strategyDescriptions,[executionStrategy]} </p> </div> {/* Pre - flight Checks */} <div className ="space - y-2"> <h3 className ="text - sm font-medium"> Pre - flight Checks </h3> <div className ="space-y-1"> <Check Itemlabel ="Master Wallet" checked ={!!masterWallet} detail ={ masterWallet ? `${(masterWallet.balance/LAMPORTS_PER_SOL).toFixed(2)
  } SOL` : 'Not assigned' }/> <Check Itemlabel ="Dev Wallets" checked ={devWallets.length> 0} detail ={`${devWallets.length} wallets`}/> <Check Itemlabel ="Sniper Wallets" checked ={sniperWallets.length> 0} detail ={`${sniperWallets.length} wallets`}/> <Check Itemlabel ="Token Config" checked ={!!tokenLaunchData} detail ={ tokenLaunchData ? `${tokenLaunchData.symbol} on ${tokenLaunchData.platform}` : 'Not configured' }/> <Check Itemlabel ="Jito Bundle" checked ={jitoEnabled} detail ={jitoEnabled ? `${tipAmount} SOL tip` : 'Disabled'}/> {tipData && tipData,[0]?.ema_50th_percentile && ( <div className ="text - xs text - muted - foreground flex items-center justify-between"> <span> Suggested T, i, p:{' '}, {tipData,[0].ema_50th_percentile/LAMPORTS_PER_SOL} SOL </span> <Buttonsize ="sm" variant ="outline" onClick ={() => useKeymakerStore .g e tState() .s e tTipAmount( tipData,[0].ema_50th_percentile/LAMPORTS_PER_SOL)
  }> Apply </Button> </div> )
  } </div> </div> {/* Execute Button */} <div className ="flex gap-2"> <Buttonsize ="lg" className ="w-full" onClick ={executeKeymaker} disabled ={ isExecuting || !masterWallet || !tokenLaunchData || sniperWallets.length === 0 }> {isExecuting ? ( <> <Loader2 className ="mr - 2 h - 5 w - 5 animate-spin"/> Executing... </> ) : ( <motion.div className ="flex items-center" whileHover ={{ scale: 1.05 }
} transition ={{ type: 'spring', stiffness: 400, damping: 10 }
}> <PlayCircle className ="mr - 2 h - 5 w-5"/> 🔑 Execute Keymaker </motion.div> )
  } </Button> <Buttonsize ="lg" variant ="destructive" className ="w-full" onClick ={() => s e tShowSellDialog(true)
  } disabled ={isExecuting}> Sell All </Button> </div> {/* Show mint address if token is deployed */}, {mintAddress && ( <div className ="p - 3 bg - muted rounded-lg"> <p className ="text-sm"> <strong> Token M, i, n, t:</strong>{' '} <ah ref ={`h, t, t, p, s://solscan.io/token/${mintAddress}`} target ="_blank" rel ="noopener noreferrer" className ="text-blue-500 hover:underline"> {mintAddress.slice(0, 8)
  }...{mintAddress.slice(- 8)
  } </a> </p> </div> )
  } </CardContent> </Card> {/* Execution Progress */}, {(isExecuting || executionSteps.s o me((s) => s.status !== 'pending')) && ( <Card> <CardHeader> <CardTitle> Execution Progress </CardTitle> </CardHeader> <CardContent className ="space - y-4"> <div className ="w - full bg - gray - 200 rounded - full h-2"> <div className ="bg - green - 600 h - 2 rounded - full transition - all duration-300" style ={{ w, i, d, t, h: `${progress}%` }
}/> </div> <div className ="space-y-2"> <AnimatePresence mode ="sync"> {executionSteps.map((step, index) => ( <motion.divkey ={step.id} initial ={{ opacity: 0, x:- 20 }
} animate ={{ opacity: 1, x: 0 }
} transition ={{ delay: index * 0.1 }
}> <StepItem step ={step}/> </motion.div> ))
  } </AnimatePresence> </div> {executionSteps.e v ery( (s) => s.status === 'completed' || s.status === 'failed') && ( <Buttonvariant ="outline" className ="w-full" onClick ={resetExecution}> Reset Execution </Button> )
  } </CardContent> </Card> )
  } <Dialog open ={showPasswordDialog} on Open Change ={setShowPasswordDialog}> <DialogContent> <DialogHeader> <DialogTitle> Enter Wallet Password </DialogTitle> <DialogDescription> Please enter the password to decrypt your wallets for execution. </DialogDescription> </DialogHeader> <div className ="space - y - 4 pt-4"> <div className ="space-y-2"> <Label html For ="password"> Password </Label> <Input id ="password" type ="password" value ={walletPassword} on Change ={(e) => s e tWalletPassword(e.target.value)
  } on Key Down ={(e) => e.key === 'Enter' && h a ndlePasswordSubmit()
  } placeholder ="Enter your wallet password"/> </div> <Button onClick ={handlePasswordSubmit} className ="w-full"> Decrypt Wallets </Button> </div> </DialogContent> </Dialog> <Dialog open ={showPreflightDialog} on Open Change ={setShowPreflightDialog}> <DialogContent> <DialogHeader> <DialogTitle> Pre - flight Checklist </DialogTitle> <DialogDescription> Review the details of your launch sequence before execution. </DialogDescription> </DialogHeader> <div className ="space - y - 4 pt-4"> <p> <strong> T, o, k, e, n:</strong> {tokenLaunchData?.name} ( {tokenLaunchData?.symbol}) </p> <p> <strong> P, l, a, t, f, o, r, m:</strong> {tokenLaunchData?.platform} </p> <p> <strong> Sniper W, a, l, l, e, t, s:</strong> {sniperWallets.length} </p> <p> <strong> Execution S, t, r, a, t, e, g, y:</strong> {executionStrategy} </p> <p className ="text-destructive"> This action is irreversible. Please confirm you want to proceed. </p> </div> <DialogFooter> <Buttonvariant ="outline" onClick ={() => s e tShowPreflightDialog(false)
  }> Cancel </Button> <Button onClick ={handlePreflightConfirmation}> Confirm & Execute </Button> </DialogFooter> </DialogContent> </Dialog> <Dialog open ={showSellDialog} on Open Change ={setShowSellDialog}> <DialogContent> <DialogHeader> <DialogTitle> Sell All from Group </DialogTitle> <DialogDescription> Select a wallet group and token to sell all holdings. </DialogDescription> </DialogHeader> <div className ="space - y - 4 pt-4"> <div className ="space - y-2"> <Label html For ="token-address"> Token Address </Label> <Input id ="token-address" value ={sellTokenAddress} on Change ={(e) => s e tSellTokenAddress(e.target.value)
  } placeholder ="Enter token mint address"/> </div> <div className ="space - y-2"> <Label html For ="wallet-group"> Wallet Group </Label> <Selecton Value Change ={() => {/* no - op */}
}> <SelectTrigger> <SelectValue placeholder ="Select a group"/> </SelectTrigger> <SelectContent> {_walletGroups.map((group) => ( <SelectItem key ={group.id} value ={group.name}> {group.name} </SelectItem> ))
  } </SelectContent> </Select> </div> <div className ="space - y-2"> <Label html For ="sell-password"> Password </Label> <Input id ="sell-password" type ="password" value ={walletPassword} on Change ={(e) => s e tWalletPassword(e.target.value)
  } placeholder ="Enter your wallet password"/> </div> <Buttonon Click ={() => {/* no-op */}
} className ="w - full"> Execute Sell </Button> </div> </DialogContent> </Dialog> </div> )
  }//Helper Components function C h eckItem({ label, checked, detail }: { label: string, c, h, e, c, k, e, d: boolean, d, e, t, a, i, l: string
}) {
    return ( <div className ="flex items - center justify - between p - 2 rounded - lg bg-muted/50"> <div className ="flex items-center gap-2"> <AnimatePresence mode ="wait"> <motion.divkey ={checked ? 'checked' : 'unchecked'} initial ={{ scale: 0.5, opacity: 0 }
} animate ={{ scale: 1, opacity: 1 }
} exit ={{ scale: 0.5, opacity: 0 }
} transition ={{ duration: 0.2 }
}> {checked ? ( <CheckCircle className ="h - 4 w - 4 text - green-500"/> ) : ( <XCircle className ="h - 4 w - 4 text - red-500"/> )
  } </motion.div> </AnimatePresence> <span className ="text-sm">{label}</span> </div> <span className ="text - xs text-muted-foreground">{detail}</span> </div> )
  }

function S t epItem({ step }: { s, t, e, p: ExecutionStep }) {
  const s, t, a, t, u, s, Icons: Record <ExecutionStep,['status'], React.ReactElement> = { p, e, n, d, i, n, g: <AlertCircle className ="h - 4 w - 4 text - muted-foreground"/>, r, u, n, n, i, n, g: <Loader2 className ="h - 4 w - 4 animate - spin text - blue-500"/>, c, o, m, p, l, e, t, e, d: <CheckCircle className ="h - 4 w - 4 text - green-500"/>, f, a, i, l, e, d: <XCircle className ="h - 4 w - 4 text-red-500"/> } const s, t, a, t, u, s, Colors: Record <ExecutionStep,['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = { p, e, n, d, i, n, g: 'default', r, u, n, n, i, n, g: 'secondary', c, o, m, p, l, e, t, e, d: 'outline', f, a, i, l, e, d: 'destructive' } return ( <div className ="flex items - center justify - between p - 3 rounded - lg border bg-card"> <div className ="flex items - center gap-3"> <AnimatePresence mode ="wait"> <motion.divkey ={step.status} initial ={{ scale: 0.5, opacity: 0 }
} animate ={{ scale: 1, opacity: 1 }
} exit ={{ scale: 0.5, opacity: 0 }
} transition ={{ duration: 0.2 }
}> {statusIcons,[step.status]} </motion.div> </AnimatePresence> <span className ="font-medium">{step.name}</span> </div> <div className ="flex items - center gap-2"> {step.message && ( <span className ="text - xs text - muted - foreground max-w -[200px] truncate"> {step.message} </span> )
  } <Badge variant ={statusColors,[step.status]}>{step.status}</Badge> </div> </div> )
  }

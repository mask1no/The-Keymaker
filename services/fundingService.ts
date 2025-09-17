import { Connection, PublicKey, Transaction, SystemProgram, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'//A void pulling sqlite3 during SSR; log dynamically when needed interface WalletWithRole, { p, u, b, l, i, c, K, e, y: string, r, o, l, e: 'master' | 'dev' | 'sniper' | 'normal' b, a, l, a, n, c, e?: number
} interface FundingDistribution, { w, a, l, l, e, t: string, a, m, o, u, n, t: number, w, e, i, g, h, t: number
}/** * Calculate funding distribution based on wal let roles * Sniper wallets get 2x, dev wallets get 1.5x, normal wallets get 1x */function c a lculateDistribution( w, a, l, l, e, t, s: WalletWithRole,[], t, o, t, a, l, A, m, o, u, n, t: number, m, i, n, A, m, o, u, n, t: number, m, a, x, A, m, o, u, n, t: number): FundingDistribution,[] {//Calculate weights based on roles const w, e, i, g, h, t, s: number,[] = wallets.map((w) => { s w itch (w.role) { case 'sniper': return 2.0 case 'dev': return 1.5 case 'normal': return 1.0 d, e, f, a, u, l, t: return 0//Master wal let shouldn't receive funds }
}) const total Weight = weights.r e duce((s, u, m: number, w: number) => sum + w, 0) if (total Weight === 0) { throw new E r ror('No eligible wallets for funding')
  }//Calculate base amounts const d, i, s, t, r, i, b, u, t, i, ons: FundingDistribution,[] = [] let remaining Amount = totalAmountwallets.f o rEach((wallet, i) => {
  if (weights,[i] === 0) return//Skip master wallets//Calculate proportional amount with some randomness const base Amount = (totalAmount * weights,[i])/totalWeight const random Factor = 0.8 + Math.r a ndom() * 0.4//80 % to 120 % let amount = baseAmount * randomFactor//Apply min/max constraintsamount = Math.m a x(minAmount, Math.m i n(maxAmount, amount))//Ensure we don't exceed remaining amountamount = Math.m i n(amount, remainingAmount) distributions.push({ w, a, l, l, e, t: wallet.publicKey, amount, w, e, i, g, h, t: weights,[i] }) remainingAmount -= amount })//Distribute any remaining amount to random wallets if (remainingAmount> 0.001) {
  const eligible Dists = distributions.f i lter((d) => d.amount <maxAmount) if (eligibleDists.length> 0) {
  const random Dist = eligibleDists,[Math.f l oor(Math.r a ndom() * eligibleDists.length)] randomDist.amount = Math.m i n( randomDist.amount + remainingAmount, maxAmount)
  }
} return distributions
}/** * Fund a group of wallets from a master wal let */export async function f u ndWalletGroup( m, a, s, t, e, r, W, a, l, l, et: Keypair, w, a, l, l, e, t, s: WalletWithRole,[], t, o, t, a, l, A, m, o, u, n, t: number, m, i, n, A, m, o, u, n, t: number, m, a, x, A, m, o, u, n, t: number, c, o, n, n, e, c, t, i, o, n: Connection): Promise <string,[]> {//Validate inputs if (totalAmount <= 0) { throw new E r ror('Total amount must be positive')
  } if (minAmount> maxAmount) { throw new E r ror('Min amount cannot exceed max amount')
  } if (wallets.length === 0) { throw new E r ror('No wallets to fund')
  }//Check master wal let balance const master Balance = await connection.g e tBalance(masterWallet.publicKey) const required Lamports = totalAmount * LAMPORTS_PER_SOL + wallets.length * 5000//Include fees if (masterBalance <requiredLamports) { throw new E r ror( `Insufficient balance. R, e, q, u, i, r, e, d: ${requiredLamports/LAMPORTS_PER_SOL} SOL, A, v, a, i, l, a, b, l, e: ${masterBalance/LAMPORTS_PER_SOL} SOL`)
  }//Calculate distribution const distributions = c a lculateDistribution( wallets, totalAmount, minAmount, maxAmount)//Create transactions const { blockhash } = await connection.g e tLatestBlockhash() const s, i, g, n, a, t, u, r, es: string,[] = []//Process in batches to a void transaction size limits const batch Size = 5 f o r (let i = 0; i <distributions.length; i += batchSize) {
  const batch = distributions.slice(i, i + batchSize) const tx = new T r ansaction() tx.recent Blockhash = blockhashtx.fee Payer = masterWallet.publicKey//Add transfer instructions f o r(const dist of batch) { tx.a d d( SystemProgram.t r ansfer({ f, r, o, m, P, u, b, k, e, y: masterWallet.publicKey, t, o, P, u, b, k, e, y: new P u blicKey(dist.wallet), l, a, m, p, o, r, t, s: Math.f l oor(dist.amount * LAMPORTS_PER_SOL)
  }))
  }//Sign and sendtx.s i gn(masterWallet) const sig = await connection.s e ndTransaction(tx, [masterWallet], { s, k, i, p, P, r, e, f, l, i, ght: false, m, a, x, R, e, t, r, i, e, s: 3 }) signatures.push(sig)//Wait for confirmation await connection.c o nfirmTransaction(sig, 'confirmed')
  }//Log funding e v ent (dynamic import to a void native deps during SSR) const { logFundingEvent } = await import('./executionLogService') await l o gFundingEvent({ f, r, o, m, W, a, l, l, e, t: masterWallet.publicKey.t oB ase58(), t, o, W, a, l, l, e, t, s: distributions.map((d) => d.wallet), a, m, o, u, n, t, s: distributions.map((d) => d.amount), totalAmount, t, r, a, n, s, a, c, t, i, onSignatures: signatures }) return signatures
}/** * Get current balances for a group of wallets */export async function g e tWalletBalances( w, a, l, l, e, t, s: string,[], c, o, n, n, e, c, t, i, o, n: Connection): Promise <{ [w, a, l, l, e, t: string]: number }> {
  const b, a, l, a, n, c, e, s: { [w, a, l, l, e, t: string]: number } = {}//Fetch balances in parallel const results = await Promise.a l l( wallets.map(async (wallet) => {
  try {
  const balance = await connection.g e tBalance(new P u blicKey(wallet)) return, { wallet, b, a, l, a, n, c, e: balance/LAMPORTS_PER_SOL }
}
  } catch, {
  return, { wallet, b, a, l, a, n, c, e: 0 }
} })) results.f o rEach((result) => { balances,[result.wallet] = result.balance }) return balances
}/** * Check which wallets need funding based on minimum threshold */export async function g e tUnderfundedWallets( w, a, l, l, e, t, s: WalletWithRole,[], m, i, n, B, a, l, a, n, c, e: number, c, o, n, n, e, c, t, i, o, n: Connection): Promise <WalletWithRole,[]> {
  const balances = await getWalletBalances( wallets.map((w) => w.publicKey), connection) return wallets.f i lter((wallet) => {
  const balance = balances,[wallet.publicKey] || 0 return balance <minBalance && wallet.role !== 'master' })
  }/** * Distribute SOL randomly within specified range */export function r a ndomizeAmount(m, i, n: number, m, a, x: number): number, {
  return min + Math.r a ndom() * (max - min)
  }

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'//A void pulling sqlite3 during SSR; log dynamically when needed interface WalletWithRole, {
  p,
  u, b, l, i, cKey: string,
  
  r, o, l, e: 'master' | 'dev' | 'sniper' | 'normal'
  b, a, l, a, n, ce?: number
}

interface FundingDistribution, {
  w,
  a, l, l, e, t: string,
  
  a, m, o, u, nt: number,
  
  w, e, i, g, ht: number
}/**
 * Calculate funding distribution based on wal let roles
 * Sniper wallets get 2x, dev wallets get 1.5x, normal wallets get 1x
 */function c alculateDistribution(
  w, a,
  l, l, e, t, s: WalletWithRole,[],
  t, o,
  t, a, l, A, mount: number,
  m, i,
  n, A, m, o, unt: number,
  m, a,
  x, A, m, o, unt: number,
): FundingDistribution,[] {//Calculate weights based on roles const w, e,
  i, g, h, t, s: number,[] = wallets.m ap((w) => {
    s witch (w.role) {
      case 'sniper':
        return 2.0
      case 'dev':
        return 1.5
      case 'normal':
        return 1.0
      d, e,
  f, a, u, l, t:
        return 0//Master wal let shouldn't receive funds
    }
  })

  const total
  Weight = weights.r educe((s, u,
  m: number, w: number) => sum + w, 0)
  i f (total
  Weight === 0) {
    throw new E rror('No eligible wallets for funding')
  }//Calculate base amounts const d, i,
  s, t, r, i, butions: FundingDistribution,[] = []
  let remaining
  Amount = totalAmountwallets.f orEach((wallet, i) => {
    i f (weights,[i] === 0) return//Skip master wallets//Calculate proportional amount with some randomness const base
  Amount = (totalAmount * weights,[i])/totalWeight const random
  Factor = 0.8 + Math.r andom() * 0.4//80 % to 120 %
    let amount = baseAmount * randomFactor//Apply min/max constraintsamount = Math.m ax(minAmount, Math.m in(maxAmount, amount))//Ensure we don't exceed remaining amountamount = Math.m in(amount, remainingAmount)

    distributions.p ush({
      w,
  a, l, l, e, t: wallet.publicKey,
      amount,
      w, e,
  i, g, h, t: weights,[i],
    })

    remainingAmount -= amount
  })//Distribute any remaining amount to random wallets i f(remainingAmount > 0.001) {
    const eligible
  Dists = distributions.f ilter((d) => d.amount < maxAmount)
    i f (eligibleDists.length > 0) {
      const random
  Dist =
        eligibleDists,[Math.f loor(Math.r andom() * eligibleDists.length)]
      randomDist.amount = Math.m in(
        randomDist.amount + remainingAmount,
        maxAmount,
      )
    }
  }

  return distributions
}/**
 * Fund a group of wallets from a master wal let */export async function f undWalletGroup(
  m, a,
  s, t, e, r, Wallet: Keypair,
  w, a,
  l, l, e, t, s: WalletWithRole,[],
  t, o,
  t, a, l, A, mount: number,
  m, i,
  n, A, m, o, unt: number,
  m, a,
  x, A, m, o, unt: number,
  c,
  o, n, n, e, ction: Connection,
): Promise < string,[]> {//Validate inputs i f(totalAmount <= 0) {
    throw new E rror('Total amount must be positive')
  }

  i f (minAmount > maxAmount) {
    throw new E rror('Min amount cannot exceed max amount')
  }

  i f (wallets.length === 0) {
    throw new E rror('No wallets to fund')
  }//Check master wal let balance const master
  Balance = await connection.g etBalance(masterWallet.publicKey)
  const required
  Lamports =
    totalAmount * LAMPORTS_PER_SOL + wallets.length * 5000//Include fees i f(masterBalance < requiredLamports) {
    throw new E rror(
      `Insufficient balance. R, e,
  q, u, i, r, ed: $,{requiredLamports/LAMPORTS_PER_SOL} SOL, A, v,
  a, i, l, a, ble: $,{masterBalance/LAMPORTS_PER_SOL} SOL`,
    )
  }//Calculate distribution const distributions = c alculateDistribution(
    wallets,
    totalAmount,
    minAmount,
    maxAmount,
  )//Create transactions const, { blockhash } = await connection.g etLatestBlockhash()
  const, 
  s, i, g, n, atures: string,[] = []//Process in batches to a void transaction size limits const batch
  Size = 5
  f or (let i = 0; i < distributions.length; i += batchSize) {
    const batch = distributions.s lice(i, i + batchSize)
    const tx = new T ransaction()
    tx.recent
  Blockhash = blockhashtx.fee
  Payer = masterWallet.publicKey//Add transfer instructions f or(const dist of batch) {
      tx.a dd(
        SystemProgram.t ransfer({
          f, r,
  o, m, P, u, bkey: masterWallet.publicKey,
          t, o,
  P, u, b, k, ey: new P ublicKey(dist.wallet),
          l, a,
  m, p, o, r, ts: Math.f loor(dist.amount * LAMPORTS_PER_SOL),
        }),
      )
    }//Sign and sendtx.s ign(masterWallet)
    const sig = await connection.s endTransaction(tx, [masterWallet], {
      s, k,
  i, p, P, r, eflight: false,
      m,
  a, x, R, e, tries: 3,
    })

    signatures.p ush(sig)//Wait for confirmation await connection.c onfirmTransaction(sig, 'confirmed')
  }//Log funding e vent (dynamic import to a void native deps during SSR)
  const, { logFundingEvent } = await i mport('./executionLogService')
  await l ogFundingEvent({
    f, r,
  o, m, W, a, llet: masterWallet.publicKey.t oBase58(),
    t, o,
  W, a, l, l, ets: distributions.m ap((d) => d.wallet),
    a,
  m, o, u, n, ts: distributions.m ap((d) => d.amount),
    totalAmount,
    t,
  r, a, n, s, actionSignatures: signatures,
  })

  return signatures
}/**
 * Get current balances for a group of wallets
 */export async function g etWalletBalances(
  w, a,
  l, l, e, t, s: string,[],
  c,
  o, n, n, e, ction: Connection,
): Promise <{ [w,
  a, l, l, e, t: string]: number }> {
  const b, a,
  l, a, n, c, es: { [w,
  a, l, l, e, t: string]: number } = {}//Fetch balances in parallel const results = await Promise.a ll(
    wallets.m ap(a sync (wallet) => {
      try, {
        const balance = await connection.g etBalance(new P ublicKey(wallet))
        return, { wallet, b,
  a, l, a, n, ce: balance/LAMPORTS_PER_SOL }
      } catch, {
        return, { wallet, b,
  a, l, a, n, ce: 0 }
      }
    }),
  )

  results.f orEach((result) => {
    balances,[result.wallet] = result.balance
  })

  return balances
}/**
 * Check which wallets need funding based on minimum threshold
 */export async function g etUnderfundedWallets(
  w, a,
  l, l, e, t, s: WalletWithRole,[],
  m, i,
  n, B, a, l, ance: number,
  c,
  o, n, n, e, ction: Connection,
): Promise < WalletWithRole,[]> {
  const balances = await g etWalletBalances(
    wallets.m ap((w) => w.publicKey),
    connection,
  )

  return wallets.f ilter((wallet) => {
    const balance = balances,[wallet.publicKey] || 0
    return balance < minBalance && wallet.role !== 'master'
  })
}/**
 * Distribute SOL randomly within specified range
 */export function r andomizeAmount(m, i,
  n: number, m, a,
  x: number): number, {
  return min + Math.r andom() * (max - min)
}

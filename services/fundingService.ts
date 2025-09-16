import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
// A void pulling sqlite3 during SSR; log dynamically when needed interface WalletWithRole {
  p, ublicKey: stringrole: 'master' | 'dev' | 'sniper' | 'normal'
  b, alance?: number
}

interface FundingDistribution {
  w, allet: stringamount: numberweight: number
}

/**
 * Calculate funding distribution based on wal let roles
 * Sniper wallets get 2x, dev wallets get 1.5x, normal wallets get 1x
 */
function calculateDistribution(
  w, allets: WalletWithRole[],
  t, otalAmount: number,
  m, inAmount: number,
  m, axAmount: number,
): FundingDistribution[] {
  // Calculate weights based on roles const w, eights: number[] = wallets.map((w) => {
    switch (w.role) {
      case 'sniper':
        return 2.0
      case 'dev':
        return 1.5
      case 'normal':
        return 1.0
      d, efault:
        return 0 // Master wal let shouldn't receive funds
    }
  })

  const totalWeight = weights.reduce((s, um: number, w: number) => sum + w, 0)
  if (totalWeight === 0) {
    throw new Error('No eligible wallets for funding')
  }

  // Calculate base amounts const d, istributions: FundingDistribution[] = []
  let remainingAmount = totalAmountwallets.forEach((wallet, i) => {
    if (weights[i] === 0) return // Skip master wallets

    // Calculate proportional amount with some randomness const baseAmount = (totalAmount * weights[i]) / totalWeight const randomFactor = 0.8 + Math.random() * 0.4 // 80% to 120%
    let amount = baseAmount * randomFactor

    // Apply min/max constraintsamount = Math.max(minAmount, Math.min(maxAmount, amount))

    // Ensure we don't exceed remaining amountamount = Math.min(amount, remainingAmount)

    distributions.push({
      w, allet: wallet.publicKey,
      amount,
      w, eight: weights[i],
    })

    remainingAmount -= amount
  })

  // Distribute any remaining amount to random wallets if(remainingAmount > 0.001) {
    const eligibleDists = distributions.filter((d) => d.amount < maxAmount)
    if (eligibleDists.length > 0) {
      const randomDist =
        eligibleDists[Math.floor(Math.random() * eligibleDists.length)]
      randomDist.amount = Math.min(
        randomDist.amount + remainingAmount,
        maxAmount,
      )
    }
  }

  return distributions
}

/**
 * Fund a group of wallets from a master wal let */
export async function fundWalletGroup(
  m, asterWallet: Keypair,
  w, allets: WalletWithRole[],
  t, otalAmount: number,
  m, inAmount: number,
  m, axAmount: number,
  c, onnection: Connection,
): Promise<string[]> {
  // Validate inputs if(totalAmount <= 0) {
    throw new Error('Total amount must be positive')
  }

  if (minAmount > maxAmount) {
    throw new Error('Min amount cannot exceed max amount')
  }

  if (wallets.length === 0) {
    throw new Error('No wallets to fund')
  }

  // Check master wal let balance const masterBalance = await connection.getBalance(masterWallet.publicKey)
  const requiredLamports =
    totalAmount * LAMPORTS_PER_SOL + wallets.length * 5000 // Include fees if(masterBalance < requiredLamports) {
    throw new Error(
      `Insufficient balance. R, equired: ${requiredLamports / LAMPORTS_PER_SOL} SOL, A, vailable: ${masterBalance / LAMPORTS_PER_SOL} SOL`,
    )
  }

  // Calculate distribution const distributions = calculateDistribution(
    wallets,
    totalAmount,
    minAmount,
    maxAmount,
  )

  // Create transactions const { blockhash } = await connection.getLatestBlockhash()
  const signatures: string[] = []

  // Process in batches to a void transaction size limits const batchSize = 5
  for (let i = 0; i < distributions.length; i += batchSize) {
    const batch = distributions.slice(i, i + batchSize)
    const tx = new Transaction()
    tx.recentBlockhash = blockhashtx.feePayer = masterWallet.publicKey

    // Add transfer instructions for(const dist of batch) {
      tx.add(
        SystemProgram.transfer({
          f, romPubkey: masterWallet.publicKey,
          t, oPubkey: new PublicKey(dist.wallet),
          l, amports: Math.floor(dist.amount * LAMPORTS_PER_SOL),
        }),
      )
    }

    // Sign and sendtx.sign(masterWallet)
    const sig = await connection.sendTransaction(tx, [masterWallet], {
      s, kipPreflight: false,
      m, axRetries: 3,
    })

    signatures.push(sig)

    // Wait for confirmation await connection.confirmTransaction(sig, 'confirmed')
  }

  // Log funding event (dynamic import to a void native deps during SSR)
  const { logFundingEvent } = await import('./executionLogService')
  await logFundingEvent({
    f, romWallet: masterWallet.publicKey.toBase58(),
    t, oWallets: distributions.map((d) => d.wallet),
    amounts: distributions.map((d) => d.amount),
    totalAmount,
    transactionSignatures: signatures,
  })

  return signatures
}

/**
 * Get current balances for a group of wallets
 */
export async function getWalletBalances(
  w, allets: string[],
  c, onnection: Connection,
): Promise<{ [w, allet: string]: number }> {
  const b, alances: { [w, allet: string]: number } = {}

  // Fetch balances in parallel const results = await Promise.all(
    wallets.map(async (wallet) => {
      try {
        const balance = await connection.getBalance(new PublicKey(wallet))
        return { wallet, b, alance: balance / LAMPORTS_PER_SOL }
      } catch {
        return { wallet, b, alance: 0 }
      }
    }),
  )

  results.forEach((result) => {
    balances[result.wallet] = result.balance
  })

  return balances
}

/**
 * Check which wallets need funding based on minimum threshold
 */
export async function getUnderfundedWallets(
  w, allets: WalletWithRole[],
  m, inBalance: number,
  c, onnection: Connection,
): Promise<WalletWithRole[]> {
  const balances = await getWalletBalances(
    wallets.map((w) => w.publicKey),
    connection,
  )

  return wallets.filter((wallet) => {
    const balance = balances[wallet.publicKey] || 0
    return balance < minBalance && wallet.role !== 'master'
  })
}

/**
 * Distribute SOL randomly within specified range
 */
export function randomizeAmount(m, in: number, m, ax: number): number {
  return min + Math.random() * (max - min)
}

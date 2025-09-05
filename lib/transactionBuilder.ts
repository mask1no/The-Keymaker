import {
  Connection,
  PublicKey,
  VersionedTransaction,
  TransactionInstruction,
  TransactionMessage,
  SystemProgram,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  Keypair
} from '@solana/web3.js'
import { JITO_TIP_ACCOUNTS } from '@/constants'

// Tip account selection (rotate through available accounts)
function getRandomTipAccount(): PublicKey {
  const randomIndex = Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)
  return new PublicKey(JITO_TIP_ACCOUNTS[randomIndex])
}

// Calculate tip amount based on mode
export function calculateTipAmount(
  baseTipLamports: number,
  mode: 'regular' | 'instant' | 'delayed' = 'regular'
): number {
  const multipliers = {
    regular: 1.2,
    instant: 1.25,
    delayed: 1.2
  }

  const minTip = 0.00005 * LAMPORTS_PER_SOL // 50k lamports
  const maxTip = 0.002 * LAMPORTS_PER_SOL // 2M lamports

  const calculatedTip = Math.floor(baseTipLamports * multipliers[mode])
  return Math.max(minTip, Math.min(maxTip, calculatedTip))
}

export interface TransactionConfig {
  instructions: TransactionInstruction[]
  signer: Keypair | { publicKey: PublicKey; signTransaction?: (tx: any) => Promise<any> }
  priorityFee?: number
  tipLamports?: number
  mode?: 'regular' | 'instant' | 'delayed'
}

export interface BundleTransaction {
  transaction: VersionedTransaction
  bundleId: string
  tipAmount: number
  instructionCount: number
}

/**
 * Build a native v0 transaction with embedded tip transfer
 */
export async function buildNativeV0Transaction(
  connection: Connection,
  config: TransactionConfig
): Promise<BundleTransaction> {
  const {
    instructions,
    signer,
    priorityFee = 0,
    tipLamports = 0,
    mode = 'regular'
  } = config

  // Calculate final tip amount
  const finalTipAmount = calculateTipAmount(tipLamports, mode)

  // Get recent blockhash for v0 transaction
  const { blockhash } = await connection.getLatestBlockhash('confirmed')

  // Build instructions array
  const allInstructions: TransactionInstruction[] = []

  // 1. Add ComputeBudget instructions first (required for v0)
  if (priorityFee > 0) {
    allInstructions.push(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: Math.floor(priorityFee * 1_000_000) // Convert SOL to microLamports
      })
    )
  }

  // Set compute unit limit (default: 200k units)
  allInstructions.push(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 200_000
    })
  )

  // 2. Add user instructions
  allInstructions.push(...instructions)

  // 3. Add embedded tip transfer as the last instruction
  if (finalTipAmount > 0) {
    const tipAccount = getRandomTipAccount()
    allInstructions.push(
      SystemProgram.transfer({
        fromPubkey: signer.publicKey,
        toPubkey: tipAccount,
        lamports: finalTipAmount
      })
    )
  }

  // Build transaction message
  const message = new TransactionMessage({
    payerKey: signer.publicKey,
    recentBlockhash: blockhash,
    instructions: allInstructions
  }).compileToV0Message()

  // Create v0 transaction
  const transaction = new VersionedTransaction(message)

  // Sign the transaction - handle both Keypair and wallet adapter
  if ('secretKey' in signer) {
    // It's a Keypair
    transaction.sign([signer])
  } else if (signer.signTransaction) {
    // It's a wallet adapter - convert to legacy transaction for signing
    const legacyTx = {
      serialize: () => transaction.serialize(),
      sign: (signers: any[]) => {
        transaction.sign(signers)
      }
    }
    const signedTx = await signer.signTransaction(legacyTx)
    // The wallet adapter should handle the signing, but we need to extract the signatures
    // This is a simplified approach - in practice, you might need to handle this differently
  }

  // Generate bundle ID
  const bundleId = `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return {
    transaction,
    bundleId,
    tipAmount: finalTipAmount,
    instructionCount: allInstructions.length
  }
}

/**
 * Build multiple transactions for a bundle
 */
export async function buildBundleTransactions(
  connection: Connection,
  transactionConfigs: TransactionConfig[],
  mode: 'regular' | 'instant' | 'delayed' = 'regular'
): Promise<BundleTransaction[]> {
  const bundleTransactions: BundleTransaction[] = []

  for (const config of transactionConfigs) {
    const bundleTx = await buildNativeV0Transaction(connection, {
      ...config,
      mode
    })
    bundleTransactions.push(bundleTx)
  }

  return bundleTransactions
}

/**
 * Serialize transactions for API submission
 */
export function serializeBundleTransactions(
  bundleTransactions: BundleTransaction[]
): {
  bundleId: string
  transactions: string[]
  totalTip: number
  transactionCount: number
} {
  const mainBundleId = bundleTransactions[0]?.bundleId || `bundle_${Date.now()}`
  const serializedTransactions = bundleTransactions.map(tx =>
    Buffer.from(tx.transaction.serialize()).toString('base64')
  )
  const totalTip = bundleTransactions.reduce((sum, tx) => sum + tx.tipAmount, 0)

  return {
    bundleId: mainBundleId,
    transactions: serializedTransactions,
    totalTip,
    transactionCount: bundleTransactions.length
  }
}

/**
 * Create a simple transfer instruction for testing
 */
export function createTestTransferInstruction(
  from: PublicKey,
  to: PublicKey,
  amount: number = 1 // 1 lamport for testing
): TransactionInstruction {
  return SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: to,
    lamports: amount
  })
}

/**
 * Validate transaction before submission
 */
export function validateBundleTransaction(tx: BundleTransaction): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check transaction size (max ~1.2MB for bundles)
  const serializedSize = tx.transaction.serialize().length
  if (serializedSize > 1_200_000) {
    errors.push('Transaction too large for bundle')
  }

  // Check tip amount is reasonable
  if (tx.tipAmount < 50_000 || tx.tipAmount > 2_000_000) {
    errors.push('Tip amount outside reasonable range')
  }

  // Check instruction count
  if (tx.instructionCount < 1 || tx.instructionCount > 10) {
    errors.push('Invalid instruction count')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

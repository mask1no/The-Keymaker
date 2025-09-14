import {
  Connection,
  Transaction,
  Signer,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
  VersionedTransaction,
  TransactionMessage,
  TransactionInstruction,
} from '@solana/web3.js'
import * as Sentry from '@sentry/nextjs'
import bs58 from 'bs58'
// jito-ts imports - using REST API approach instead
// import {
//   SearcherClient,
//   searcherClient,
//   Bundle,
//   bundleStatusesURL,
//   JitoAuthKeypair
// } from 'jito-ts';
import { JITO_TIP_ACCOUNTS } from '../constants'
import {
  createComputeBudgetInstructions,
  type PriorityLevel,
} from '@/lib/priorityFee'
// import { logBundleExecution } from './executionLogService' // Dynamic import below
import { getConnection } from '@/lib/network'
import { getBundleTxLimit } from '@/lib/constants/bundleConfig'
import { logger } from '@/lib/logger'

// Jito types are now handled server-side

export type ExecutionResult = {
  usedJito: boolean
  slotTargeted: number
  bundleId?: string
  signatures: string[]
  results: ('success' | 'failed')[]
  explorerUrls: string[]
  metrics: {
    estimatedCost: number
    successRate: number
    executionTime: number
  }
}

// Select random Jito tip account
function getRandomTipAccount(): PublicKey {
  return new PublicKey(JITO_TIP_ACCOUNTS[0])
}

export async function buildBundle(
  txs: Transaction[],
  walletRoles: { publicKey: string; role:string }[],
  randomizeOrder = false,
): Promise<Transaction[]> {
  // Sort by role priority: sniper > dev > normal
  let sortedTxs = [...txs].sort((a, b) => {
    const getRolePriority = (tx: Transaction) => {
      const wallet = walletRoles.find(
        (w) => w.publicKey === tx.feePayer?.toBase58(),
      )
      if (!wallet) return 3
      return wallet.role === 'sniper' ? 0 : wallet.role === 'dev' ? 1 : 2
    }
    return getRolePriority(a) - getRolePriority(b)
  })

  if (randomizeOrder) {
    // Randomize within role groups
    const groups: { [key: string]: Transaction[] } = {
      sniper: [],
      dev: [],
      normal: [],
    }
    sortedTxs.forEach((tx) => {
      const wallet = walletRoles.find(
        (w) => w.publicKey === tx.feePayer?.toBase58(),
      )
      const role = wallet?.role || 'normal'
      if (groups[role]) {
        groups[role].push(tx)
      }
    })

    // Shuffle within groups
    Object.keys(groups).forEach((role) => {
      groups[role].sort(() => Math.random() - 0.5)
    })

    sortedTxs = [...groups.sniper, ...groups.dev, ...groups.normal]
  }

  return sortedTxs
}

/**
 * Create a tip instruction
 */
export function createTipInstruction(
  payer: PublicKey,
  tipAmount = 10000, // 0.00001 SOL default
  tipAccount?: PublicKey,
): TransactionInstruction {
  return SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: tipAccount || getRandomTipAccount(),
    lamports: tipAmount,
  })
}

/**
 * Convert legacy transactions to versioned transactions
 */
export async function convertToVersionedTransactions(
  txs: Transaction[],
  connection: Connection,
  tipAmount?: number,
  feePayer?: PublicKey,
  priority: PriorityLevel = 'high',
): Promise<VersionedTransaction[]> {
  const { blockhash } = await connection.getLatestBlockhash('confirmed')
  const versionedTxs: VersionedTransaction[] = []

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i]
    const instructions = [
      ...createComputeBudgetInstructions(priority),
      ...tx.instructions,
    ]

    // Add tip instruction to the last transaction
    if (i === txs.length - 1 && tipAmount) {
      const payer = feePayer || tx.feePayer
      if (payer) {
        instructions.push(
          createTipInstruction(payer, tipAmount),
        )
      }
    }

    const payer = feePayer || tx.feePayer
    if (!payer) {
      throw new Error(
        `Transaction at index ${i} does not have a fee payer and no default fee payer is provided.`,
      )
    }

    const messageV0 = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message()

    versionedTxs.push(new VersionedTransaction(messageV0))
  }

  return versionedTxs
}

/**
 * Submit bundle using the application's API
 */
async function submitBundle(
  transactions: VersionedTransaction[],
  region: string = 'ffm',
): Promise<{ bundleId: string; signatures: string[]; slot: number | null }> {
  const serializedTxs = transactions.map((tx) =>
    Buffer.from(tx.serialize()).toString('base64'),
  )

  const response = await fetch('/api/bundles/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txs_b64: serializedTxs, region }),
  })

  if (!response.ok) {
    const errorBody = await response.json()
    throw new Error(errorBody.error || 'Failed to submit bundle')
  }

  return response.json()
}

export async function executeBundle(
  txs: Transaction[],
  walletRoles: { publicKey: string; role: string }[],
  signers: (Signer | Keypair | null)[],
  options: {
    feePayer?: PublicKey
    tipAmount?: number
    retries?: number
    logger?: (msg: string) => void
    connection?: Connection
    walletAdapter?: {
      publicKey: PublicKey
      signTransaction: (tx: Transaction) => Promise<Transaction>
      signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>
    }
  } = {},
): Promise<ExecutionResult> {
  const conn = options.connection || getConnection('confirmed')
  const retries = options.retries || 3
  const tipAmount = options.tipAmount || 10000 // 0.00001 SOL default
  const logger = options.logger || console.log

  // Validate bundle size
  if (txs.length === 0) {
    throw new Error('No transactions to bundle')
  }

  const maxBundleSize = getBundleTxLimit()
  if (txs.length > maxBundleSize) {
    throw new Error(
      `Bundle size exceeds maximum of ${maxBundleSize} transactions`,
    )
  }

  const startTime = Date.now()
  let usedJito = true
  let signatures: string[] = []
  let results: ('success' | 'failed')[] = []
  let slotTargeted = 0
  let bundleId: string | undefined

  try {
    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } =
      await conn.getLatestBlockhash('confirmed')
    const currentSlot = await conn.getSlot('confirmed')
    slotTargeted = currentSlot + 2 // Target 2 slots ahead

    // Sort transactions by role priority
    const sortedTxs = await buildBundle(txs, walletRoles)

    // Convert to versioned transactions with tip
    let versionedTxs = await convertToVersionedTransactions(
      sortedTxs,
      conn,
      tipAmount,
      options.feePayer,
      'high',
    )

    // Sign all transactions
    if (options.walletAdapter && options.walletAdapter.signAllTransactions) {
        // Use wallet adapter to sign all transactions at once
        const legacyTxs = versionedTxs.map(vTx => Transaction.from(vTx.serialize()));
        const signedLegacyTxs = await options.walletAdapter.signAllTransactions(legacyTxs);
        versionedTxs = signedLegacyTxs.map(tx => VersionedTransaction.deserialize(tx.serialize()));
    } else {
        for (let i = 0; i < versionedTxs.length; i++) {
          const vTx = versionedTxs[i]
          const signer = signers[i]
    
          if (signer === null && options.walletAdapter && options.walletAdapter.signTransaction) {
            // Use wallet adapter for signing (fallback for single transaction signing)
            const legacyTx = Transaction.from(vTx.serialize())
            const signedTx = await options.walletAdapter.signTransaction(legacyTx)
            versionedTxs[i] = VersionedTransaction.deserialize(signedTx.serialize())
          } else if (signer) {
            // Sign with keypair
            vTx.sign([signer as Keypair])
          }
        }
    }

    // Get signatures before submission
    signatures = versionedTxs.map((tx) =>
      bs58.encode(tx.signatures[0] || new Uint8Array()),
    )

    // Simulate transactions before submission
    logger('Simulating bundle transactions...')
    const simulationResults = await Promise.all(
      versionedTxs.map(async (tx, index) => {
        try {
          const result = await conn.simulateTransaction(tx, {
            commitment: 'processed',
            replaceRecentBlockhash: false,
          })

          if (result.value.err) {
            logger(
              `Transaction ${index} simulation failed: ${JSON.stringify(result.value.err)}`,
            )
            return {
              success: false,
              error: result.value.err,
              logs: result.value.logs,
            }
          }

          // Check for warnings in logs
          const logs = result.value.logs || []
          const warnings = logs.filter(
            (log) =>
              log.includes('warning') ||
              log.includes('insufficient') ||
              log.includes('failed'),
          )

          // Check for slippage errors
          const slippageErrors = logs.filter(
            (log) =>
              log.includes('slippage') ||
              log.includes('tolerance exceeded') ||
              log.includes('price impact') ||
              log.includes('minimum output'),
          )

          if (slippageErrors.length > 0) {
            logger(
              `Transaction ${index} slippage detected: ${slippageErrors.join(', ')}`,
            )
            return {
              success: false,
              error: 'slippage',
              logs,
              needsSlippageAdjustment: true,
            }
          }

          if (warnings.length > 0) {
            logger(
              `Transaction ${index} simulation warnings: ${warnings.join(', ')}`,
            )
          }

          return { success: true, logs }
        } catch (error) {
          logger(
            `Transaction ${index} simulation error: ${(error as Error).message}`,
          )
          return { success: false, error: (error as Error).message }
        }
      }),
    )

    // Check if all simulations passed
    const failedSimulations = simulationResults.filter((r) => !r.success)
    const slippageNeeded = simulationResults.filter(
      (r: any) => r.needsSlippageAdjustment,
    )

    // Handle slippage errors by adjusting and retrying
    if (slippageNeeded.length > 0) {
      logger(
        `Detected slippage issues in ${slippageNeeded.length} transactions. Adjusting...`,
      )

      // Adjust slippage tolerance (increase by 50%)
      for (let i = 0; i < sortedTxs.length; i++) {
        const result: any = simulationResults[i]
        if (result.needsSlippageAdjustment) {
          // Look for swap instructions and adjust slippage
          const tx = sortedTxs[i]
          for (const instruction of tx.instructions) {
            // Check if this is a swap instruction by looking at program ID
            const programId = instruction.programId.toBase58()
            if (
              programId.includes('JUP') ||
              programId.includes('9W959') ||
              programId.includes('whirL')
            ) {
              // This is likely a swap instruction, adjust slippage in the data
              logger(`Adjusting slippage for transaction ${i}`)
              // Note: Actual slippage adjustment would depend on the specific DEX protocol
              // This is a placeholder for the concept
            }
          }
        }
      }

      // Re-convert and re-simulate with adjusted parameters
      const adjustedVersionedTxs = await convertToVersionedTransactions(
        sortedTxs,
        conn,
        tipAmount,
        options.feePayer,
      )

      // Re-sign adjusted transactions
      for (let i = 0; i < adjustedVersionedTxs.length; i++) {
        const vTx = adjustedVersionedTxs[i]
        const signer = signers[i]

        if (signer === null && options.walletAdapter) {
          const legacyTx = Transaction.from(vTx.serialize())
          const signedTx = await options.walletAdapter.signTransaction(legacyTx)
          adjustedVersionedTxs[i] = VersionedTransaction.deserialize(
            signedTx.serialize(),
          )
        } else if (signer) {
          vTx.sign([signer as Keypair])
        }
      }

      // Use adjusted transactions
      versionedTxs.splice(0, versionedTxs.length, ...adjustedVersionedTxs)
      signatures = versionedTxs.map((tx) =>
        bs58.encode(tx.signatures[0] || new Uint8Array()),
      )
    } else if (failedSimulations.length > 0) {
      throw new Error(
        `${failedSimulations.length} transactions failed simulation. Bundle not submitted.`,
      )
    }

    logger('All transactions simulated successfully')

    // Try Jito submission with retries and exponential backoff
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger(`Attempt ${attempt}: Submitting bundle via API`)

        // Submit bundle using the app's API
        const result = await submitBundle(versionedTxs)
        bundleId = result.bundleId
        logger(`Bundle submitted with ID: ${bundleId}`)

        if (result.slot) {
          slotTargeted = result.slot
          logger(`Bundle landed in slot ${slotTargeted}`)

          // Check transaction confirmations
          const confirmPromises = signatures.map(async (sig) => {
            try {
              const status = await conn.getSignatureStatus(sig)
              return status.value?.confirmationStatus === 'confirmed' ||
                status.value?.confirmationStatus === 'finalized'
                ? 'success'
                : 'failed'
            } catch {
              return 'failed'
            }
          })

          results = await Promise.all(confirmPromises)

          const successCount = results.filter((r) => r === 'success').length
          if (successCount > 0) {
            logger(
              `Bundle executed successfully: ${successCount}/${results.length} confirmed`,
            )
            break // Exit retry loop on success
          } else {
            throw new Error('Bundle landed but no transactions confirmed.')
          }
        } else {
          // Bundle did not land
          throw new Error(`Bundle ${bundleId} did not land in time.`)
        }
      } catch (error: unknown) {
        Sentry.captureException(error)
        logger(`Bundle submission attempt ${attempt} failed: ${(error as Error).message}`)

        if (attempt < retries) {
          const delayMs = Math.min(8000, 1000 * Math.pow(2, attempt - 1))
          logger(`Retrying in ${Math.round(delayMs / 1000)}s...`)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        } else {
          // Fallback to standard RPC submission
          logger('All bundle attempts failed. Falling back to standard RPC submission.')
          usedJito = false
          signatures = []
          results = []

          // Submit transactions individually
          for (let i = 0; i < sortedTxs.length; i++) {
            try {
              const sig = await conn.sendTransaction(versionedTxs[i], {
                skipPreflight: false,
                maxRetries: 2,
                preflightCommitment: 'confirmed',
              })
              signatures.push(sig)

              // Wait for confirmation
              const confirmation = await conn.confirmTransaction(
                {
                  signature: sig,
                  blockhash,
                  lastValidBlockHeight,
                },
                'confirmed',
              )
              results.push(confirmation.value.err ? 'failed' : 'success')
            } catch (fbError: unknown) {
              logger(`Fallback failed for tx ${i}: ${(fbError as Error).message}`)
              signatures.push('')
              results.push('failed')
            }
          }
        }
      }
    }
  } catch (error) {
    Sentry.captureException(error)
    throw error
  }

  const executionTime = Date.now() - startTime
  const successCount = results.filter((r) => r === 'success').length
  const successRate = results.length > 0 ? successCount / results.length : 0
  const estimatedCost = ((txs.length + 1) * 5000 + tipAmount) / LAMPORTS_PER_SOL
  const explorerUrls = signatures.map((sig) =>
    sig ? `https://solscan.io/tx/${sig}` : '',
  )

  // Log to database
  try {
    const { logBundleExecution } = await import('./executionLogService')
    await logBundleExecution({
      bundleId,
      slot: slotTargeted,
      signatures: signatures.filter((sig) => sig),
      status:
        successRate > 0.8 ? 'success' : successRate > 0 ? 'partial' : 'failed',
      successCount,
      failureCount: results.length - successCount,
      usedJito,
      executionTime,
    })
  } catch (e) {
    // Logging failed, continue without error
    console.warn('Failed to log bundle execution:', e)
  }

  return {
    usedJito,
    slotTargeted,
    bundleId,
    signatures,
    results,
    explorerUrls,
    metrics: {
      estimatedCost,
      successRate,
      executionTime,
    },
  }
}

/**
 * Execute transactions sequentially via standard RPC with small jitter between sends
 */
export async function executeBundleRegular(
  txs: Transaction[],
  signers: (Signer | Keypair | null)[],
  conn: Connection = getConnection('confirmed'),
  jitterMs: [number, number] = [250, 650],
  options: {
    walletAdapter?: {
      publicKey: PublicKey
      signTransaction: (tx: Transaction) => Promise<Transaction>
      signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>
    }
    logger?: (msg: string) => void
  } = {},
): Promise<ExecutionResult> {
  const start = Date.now()
  const signatures: string[] = []
  const results: ('success' | 'failed')[] = []
  for (let i = 0; i < txs.length; i++) {
    try {
      const { blockhash, lastValidBlockHeight } =
        await conn.getLatestBlockhash('confirmed')
      const tx = txs[i]
      tx.recentBlockhash = blockhash
      let toSend = tx
      if (signers[i]) {
        toSend.sign(signers[i] as Keypair)
      } else if (options.walletAdapter) {
        // Sign with connected wallet adapter when no explicit signer provided
        if (
          toSend.feePayer &&
          toSend.feePayer.equals(options.walletAdapter.publicKey)
        ) {
          toSend = await options.walletAdapter.signTransaction(toSend)
        }
      }
      const sig = await conn.sendTransaction(
        toSend,
        signers[i] ? ([signers[i] as Signer] as Signer[]) : [],
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        },
      )
      await conn.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        'confirmed',
      )
      signatures.push(sig)
      results.push('success')
    } catch (e) {
      signatures.push('')
      results.push('failed')
    }
    const delay = Math.floor(
      Math.random() * (jitterMs[1] - jitterMs[0]) + jitterMs[0],
    )
    await new Promise((r) => setTimeout(r, delay))
  }
  const executionTime = Date.now() - start
  return {
    usedJito: false,
    slotTargeted: await conn.getSlot('confirmed'),
    bundleId: undefined,
    signatures,
    results,
    explorerUrls: signatures.map((s) =>
      s ? `https://solscan.io/tx/${s}` : '',
    ),
    metrics: {
      estimatedCost: ((txs.length + 1) * 5000) / 1e9,
      successRate:
        results.filter((r) => r === 'success').length / results.length,
      executionTime,
    },
  }
}

// Create a buy transaction for a new token using Jupiter
export async function createBuyTransaction(
  mintAddress: string,
  solAmount: number,
  walletPublicKey: string,
  mode: 'regular' | 'instant' | 'delayed' = 'regular',
  _delaySeconds: number = 0,
): Promise<VersionedTransaction> {
  try {
    // Import Jupiter service for swap functionality
    const { buildSwapTransaction } = await import('./jupiterService')
    
    // Convert SOL amount to lamports
    const amountLamports = Math.floor(solAmount * LAMPORTS_PER_SOL)
    
    // Calculate slippage based on mode
    let slippageBps = 50 // 0.5% default
    if (mode === 'instant') {
      slippageBps = 100 // 1% for instant mode
    } else if (mode === 'delayed') {
      slippageBps = 75 // 0.75% for delayed mode
    }
    
    // Calculate priority fee based on mode
    let priorityFee = 10000 // Default priority fee
    if (mode === 'instant') {
      priorityFee = 500000 // Higher priority for instant mode
    }
    
    // Build swap transaction using Jupiter (SOL -> Token)
    const transaction = await buildSwapTransaction(
      'So11111111111111111111111111111111111111112', // SOL mint
      mintAddress, // Target token mint
      amountLamports,
      walletPublicKey,
      slippageBps,
      priorityFee,
    )
    
    return transaction
  } catch (error) {
    logger.error('Failed to create buy transaction:', { error })
    throw new Error(`Failed to create buy transaction: ${(error as Error).message}`)
  }
}

// Submit bundle with mode and delay handling
export async function submitBundleWithMode(
  transactions: VersionedTransaction[],
  mode: 'regular' | 'instant' | 'delayed' = 'regular',
  delaySeconds: number = 0,
): Promise<{ bundleId: string; status: string }> {
  // Convert transactions to base64
  const txsB64 = transactions.map((tx) => bs58.encode(tx.serialize()))

  // Calculate tip based on mode
  let tipLamports = 10000 // Default 0.00001 SOL
  if (mode === 'instant') {
    tipLamports = 50000 // 0.00005 SOL for instant
  } else if (mode === 'delayed') {
    tipLamports = 25000 // 0.000025 SOL for delayed
  }

  // Prepare bundle submission data
  const submitData = {
    region: 'ffm', // Default region
    txs_b64: txsB64,
    tip_lamports: tipLamports,
    mode,
    delay_seconds: delaySeconds,
  }

  try {
    const response = await fetch('/api/bundles/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Bundle submission failed')
    }

    return {
      bundleId: result.bundle_id,
      status: 'submitted',
    }
  } catch (error: any) {
    throw new Error(`Bundle submission failed: ${error.message}`)
  }
}

export async function validateToken(tokenAddress: string): Promise<boolean> {
  // Add actual validation logic here. For example, check against a token list or on-chain data.
  if (!tokenAddress) return false
  // For now, assume valid if it's a non-empty string
  return true
}

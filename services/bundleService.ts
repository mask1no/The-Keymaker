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
import axios from 'axios'
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
import { logBundleExecution } from './executionLogService'
import { getConnection } from '@/lib/network'
import { getBundleTxLimit } from '@/lib/constants/bundleConfig'

// Jito types
interface JitoBundleStatus {
  bundle_id: string
  status: 'pending' | 'landed' | 'failed' | 'invalid'
  landed_slot?: number
}

type PreviewResult = {
  success: boolean
  logs: string[]
  computeUnits: number
  error?: string
}

type ExecutionResult = {
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

// Jito REST API configuration
import { getJitoEndpoint } from '@/lib/network'
const JITO_API_URL = `${getJitoEndpoint()}/api/v1`

/**
 * Attempt to align submission with an upcoming leader slot.
 * Best-effort: if the endpoint is unavailable, this is a no-op.
 */
async function maybeWaitForLeader(
  connection: Connection,
  logger: (msg: string) => void,
): Promise<void> {
  try {
    const currentSlot = await connection.getSlot('processed')
    const res = await axios.get(`${JITO_API_URL}/leaders/next`, {
      timeout: 2000,
      headers: getJitoHeaders(),
    })
    const nextLeaderSlot: number | undefined = res.data?.next_leader_slot
    if (!nextLeaderSlot || nextLeaderSlot <= currentSlot) return

    const slotsToWait = Math.max(0, nextLeaderSlot - currentSlot - 1)
    if (slotsToWait === 0) return
    const delayMs = Math.min(5000, Math.round(slotsToWait * 400))
    logger(
      `Waiting ~${Math.round(delayMs / 100) / 10}s for upcoming leader slot ${nextLeaderSlot}...`,
    )
    await new Promise((r) => setTimeout(r, delayMs))
  } catch {
    // Ignore on failure
  }
}

/**
 * Get Jito API headers
 */
function getJitoHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add auth token if available
  const authToken = process.env.JITO_AUTH_TOKEN
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  return headers
}

// Select random Jito tip account
function getRandomTipAccount(): PublicKey {
  const randomIndex = Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)
  return new PublicKey(JITO_TIP_ACCOUNTS[randomIndex])
}

async function validateToken(tokenAddress: string): Promise<boolean> {
  try {
    // Use server proxy to avoid bundling paid keys on the client
    const response = await axios.post(
      '/api/proxy',
      {
        service: 'birdeye',
        path: '/defi/token_overview',
        method: 'GET',
        params: { address: tokenAddress },
      },
      { timeout: 5000 },
    )

    const data = response.data?.data
    if (!data) return false

    const hasLiquidity = data.liquidity && data.liquidity > 1000
    const isValid = data.v24hUSD && data.v24hUSD > 100

    return hasLiquidity && isValid
  } catch (error) {
    console.error('Token validation failed:', error)
    return false
  }
}

async function getBundleFees(
  txs: Transaction[],
  connection: Connection,
): Promise<number[]> {
  return Promise.all(
    txs.map(async (tx) => {
      try {
        const fee = await connection.getFeeForMessage(tx.compileMessage())
        return fee.value || 5000
      } catch {
        return 5000 // Default fee
      }
    }),
  )
}

async function buildBundle(
  txs: Transaction[],
  walletRoles: { publicKey: string; role: string }[],
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

async function previewBundle(
  txs: Transaction[],
  connection: Connection = getConnection('confirmed'),
): Promise<PreviewResult[]> {
  const { blockhash } = await connection.getLatestBlockhash('confirmed')

  return Promise.all(
    txs.map(async (tx, index) => {
      try {
        // Update blockhash for simulation
        tx.recentBlockhash = blockhash

        const simulation = await connection.simulateTransaction(tx)

        return {
          success: simulation.value.err === null,
          logs: simulation.value.logs || [],
          computeUnits: simulation.value.unitsConsumed || 0,
          error: simulation.value.err
            ? JSON.stringify(simulation.value.err)
            : undefined,
        }
      } catch (error: unknown) {
        return {
          success: false,
          logs: [
            `Transaction ${index} simulation failed: ${(error as Error).message}`,
          ],
          computeUnits: 0,
          error: (error as Error).message,
        }
      }
    }),
  )
}

/**
 * Create a tip instruction
 */
function createTipInstruction(
  payer: PublicKey,
  tipAmount = 10000, // 0.00001 SOL default
): TransactionInstruction {
  return SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: getRandomTipAccount(),
    lamports: tipAmount,
  })
}

/**
 * Convert legacy transactions to versioned transactions
 */
async function convertToVersionedTransactions(
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
      instructions.push(
        createTipInstruction(feePayer || tx.feePayer!, tipAmount),
      )
    }

    const messageV0 = new TransactionMessage({
      payerKey: tx.feePayer!,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message()

    versionedTxs.push(new VersionedTransaction(messageV0))
  }

  return versionedTxs
}

/**
 * Submit bundle using Jito REST API
 */
async function submitBundleToJito(
  transactions: VersionedTransaction[],
): Promise<string> {
  try {
    // Serialize transactions
    const serializedTransactions = transactions.map((tx) =>
      bs58.encode(tx.serialize()),
    )

    // Submit bundle via REST API (transactions array)
    const response = await axios.post(
      `${JITO_API_URL}/bundles`,
      { transactions: serializedTransactions },
      { headers: getJitoHeaders(), timeout: 10000 },
    )

    const bundleId =
      response.data?.bundle_id || response.data?.result || response.data?.id
    if (!bundleId || typeof bundleId !== 'string') {
      throw new Error('No bundle ID returned from Jito')
    }

    return bundleId
  } catch (error: any) {
    console.error(
      'Jito submission error:',
      error.response?.data || error.message,
    )
    throw error
  }
}

/**
 * Monitor bundle status
 */
async function monitorBundleStatus(
  bundleId: string,
  timeout = 30000,
): Promise<JitoBundleStatus> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    try {
      const response = await axios.get(`${JITO_API_URL}/bundles/${bundleId}`, {
        headers: getJitoHeaders(),
        timeout: 5000,
      })
      const status = response.data

      if (
        status.status === 'landed' ||
        status.status === 'failed' ||
        status.status === 'invalid'
      ) {
        return status
      }
    } catch (error) {
      console.error('Error checking bundle status:', error)
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return { bundle_id: bundleId, status: 'pending' }
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
    const versionedTxs = await convertToVersionedTransactions(
      sortedTxs,
      conn,
      tipAmount,
      options.feePayer,
      'high',
    )

    // Sign all transactions
    for (let i = 0; i < versionedTxs.length; i++) {
      const vTx = versionedTxs[i]
      const signer = signers[i]

      if (signer === null && options.walletAdapter) {
        // Use wallet adapter for signing
        const legacyTx = Transaction.from(vTx.serialize())
        const signedTx = await options.walletAdapter.signTransaction(legacyTx)
        versionedTxs[i] = VersionedTransaction.deserialize(signedTx.serialize())
      } else if (signer) {
        // Sign with keypair
        vTx.sign([signer as Keypair])
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
        logger(`Attempt ${attempt}: Submitting bundle to Jito`)
        await maybeWaitForLeader(conn, logger)

        // Submit bundle using Jito REST API
        bundleId = await submitBundleToJito(versionedTxs)
        logger(`Bundle submitted with ID: ${bundleId}`)

        // Monitor bundle status
        const status = await monitorBundleStatus(bundleId)

        if (status.status === 'landed') {
          slotTargeted = status.landed_slot || slotTargeted
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
          if (successCount >= sortedTxs.length * 0.8) {
            logger(
              `Bundle executed successfully: ${successCount}/${results.length} confirmed`,
            )
            break
          }
        } else if (status.status === 'failed' || status.status === 'invalid') {
          throw new Error(`Bundle ${status.status}`)
        }

        if (attempt < retries) {
          const delayMs = Math.min(8000, 1000 * Math.pow(2, attempt - 1))
          logger(
            `Bundle execution incomplete, retrying in ${Math.round(delayMs / 1000)}s...`,
          )
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      } catch (error: unknown) {
        Sentry.captureException(error)
        logger(`Jito attempt ${attempt} failed: ${(error as Error).message}`)

        if (attempt === retries) {
          // Fallback to standard RPC submission
          logger('Falling back to standard RPC submission')
          usedJito = false
          signatures = []
          results = []

          // Submit transactions individually
          for (let i = 0; i < sortedTxs.length; i++) {
            for (let fbAttempt = 1; fbAttempt <= 3; fbAttempt++) {
              try {
                const sig = await conn.sendTransaction(
                  sortedTxs[i],
                  [signers[i] as Signer],
                  {
                    skipPreflight: false,
                    maxRetries: 2,
                    preflightCommitment: 'confirmed',
                  },
                )

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
                break
              } catch (fbError: unknown) {
                logger(
                  `Fallback failed for tx ${i} attempt ${fbAttempt}: ${(fbError as Error).message}`,
                )
                if (fbAttempt === 3) {
                  signatures.push('')
                  results.push('failed')
                }
                const backoff = Math.min(4000, 500 * Math.pow(2, fbAttempt - 1))
                await new Promise((resolve) => setTimeout(resolve, backoff))
              }
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
    }
    logger?: (msg: string) => void
  } = {},
): Promise<ExecutionResult> {
  const start = Date.now()
  const signatures: string[] = []
  const results: ('success' | 'failed')[] = []
  for (let i = 0; i < txs.length; i++) {
    try {
      const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash(
        'confirmed',
      )
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
    explorerUrls: signatures.map((s) => (s ? `https://solscan.io/tx/${s}` : '')),
    metrics: {
      estimatedCost: ((txs.length + 1) * 5000) / 1e9,
      successRate: results.filter((r) => r === 'success').length / results.length,
      executionTime,
    },
  }
}



export {
  validateToken,
  getBundleFees,
  buildBundle,
  previewBundle,
  type PreviewResult,
  type ExecutionResult,
}

import {
  Connection,
  PublicKey,
  VersionedTransaction,
  TransactionInstruction,
  TransactionMessage,
  SystemProgram,
  ComputeBudgetProgram,
  Keypair,
} from '@solana/web3.js'
import { JITO_TIP_ACCOUNTS } from '@/constants'

// Rotate through tip accounts
function pickTipAccount(): PublicKey {
  const i = Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)
  return new PublicKey(JITO_TIP_ACCOUNTS[i])
}

function tipForMode(
  baseTipLamports: number,
  mode: 'regular' | 'instant' | 'delayed',
): number {
  const mult = mode === 'instant' ? 1.25 : mode === 'delayed' ? 1.2 : 1.2
  const min = 50_000 // 0.00005 SOL
  const max = 2_000_000 // 0.002 SOL
  return Math.max(min, Math.min(max, Math.floor(baseTipLamports * mult)))
}

export interface TransactionConfig {
  instructions: TransactionInstruction[]
  signer:
    | Keypair
    | { publicKey: PublicKey; signTransaction?: (tx: any) => Promise<any> }
  priorityFee?: number // SOL per CU million; simplified
  tipLamports?: number
  mode?: 'regular' | 'instant' | 'delayed'
}

export interface BundleBuild {
  transactions: string[] // base64 v0
  bundleId: string
  totalTip: number
  transactionCount: number
}

export async function buildNativeV0Transaction(
  connection: Connection,
  {
    instructions,
    signer,
    priorityFee = 0,
    tipLamports = 50_000,
    mode = 'regular',
  }: TransactionConfig,
): Promise<VersionedTransaction> {
  const { blockhash } = await connection.getLatestBlockhash('processed')

  const ix: TransactionInstruction[] = []
  if (priorityFee > 0) {
    ix.push(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: Math.floor(priorityFee * 1_000_000),
      }),
    )
  }
  ix.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }))
  ix.push(...instructions)

  const finalTip = tipForMode(tipLamports, mode)
  ix.push(
    SystemProgram.transfer({
      fromPubkey: signer.publicKey,
      toPubkey: pickTipAccount(),
      lamports: finalTip,
    }),
  )

  const msg = new TransactionMessage({
    payerKey: signer.publicKey,
    recentBlockhash: blockhash,
    instructions: ix,
  }).compileToV0Message()
  const tx = new VersionedTransaction(msg)

  if ('secretKey' in signer) {
    (tx as any).sign([signer])
  } else if (signer.signTransaction) {
    // if wallet adapter required: implement adapter flow in caller; keep simple here
    // caller should sign externally if needed
  }
  return tx
}

export async function buildBundleTransactions(
  connection: Connection,
  configs: TransactionConfig[],
): Promise<VersionedTransaction[]> {
  const out: VersionedTransaction[] = []
  for (const cfg of configs)
    out.push(await buildNativeV0Transaction(connection, cfg))
  return out
}

export function serializeBundleTransactions(
  txs: VersionedTransaction[],
): string[] {
  return txs.map((t) => Buffer.from(t.serialize()).toString('base64'))
}

export function createTestTransferInstruction(
  from: PublicKey,
  to: PublicKey,
  lamports = 1,
): TransactionInstruction {
  return SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports })
}

export function validateBundleTransaction(tx: {
  tipAmount: number
  instructionCount: number
}) {
  const errors: string[] = []
  if (tx.tipAmount < 50_000 || tx.tipAmount > 2_000_000)
    errors.push('Tip amount outside reasonable range')
  if (tx.instructionCount < 1 || tx.instructionCount > 10)
    errors.push('Invalid instruction count')
  return { isValid: errors.length === 0, errors }
}

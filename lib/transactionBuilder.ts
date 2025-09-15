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

function pickTipAccount(): PublicKey {
  const list =
    Array.isArray(JITO_TIP_ACCOUNTS) && JITO_TIP_ACCOUNTS.length
      ? JITO_TIP_ACCOUNTS
      : ['11111111111111111111111111111111']
  return new PublicKey(list[Math.floor(Math.random() * list.length)])
}
function tipForMode(base: number, mode: 'regular' | 'instant' | 'delayed') {
  const mult = mode === 'instant' ? 1.25 : mode === 'delayed' ? 1.2 : 1.2
  return Math.max(50_000, Math.min(2_000_000, Math.floor(base * mult)))
}

export interface TransactionConfig {
  instructions: TransactionInstruction[]
  signer:
    | Keypair
    | {
        publicKey: PublicKey
        signTransaction?: (
          tx: VersionedTransaction,
        ) => Promise<VersionedTransaction>
      }
  priorityFee?: number
  tipLamports?: number
  mode?: 'regular' | 'instant' | 'delayed'
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
  if (priorityFee > 0)
    ix.push(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: Math.floor(priorityFee * 1_000_000),
      }),
    )
  ix.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }))
  ix.push(...instructions)
  ix.push(
    SystemProgram.transfer({
      fromPubkey: signer.publicKey,
      toPubkey: pickTipAccount(),
      lamports: tipForMode(tipLamports, mode),
    }),
  )

  const msg = new TransactionMessage({
    payerKey: signer.publicKey,
    recentBlockhash: blockhash,
    instructions: ix,
  }).compileToV0Message()
  const tx = new VersionedTransaction(msg)
  if ('secretKey' in signer) (tx as any).sign([signer])
  else if (signer.signTransaction) await signer.signTransaction(tx)
  return tx
}

// Aliases for existing imports
export async function buildBundleTransactions(
  conn: Connection,
  items: TransactionConfig[],
) {
  const out: VersionedTransaction[] = []
  for (const it of items) out.push(await buildNativeV0Transaction(conn, it))
  return out
}
export const serializeBundleTransactions = (txs: VersionedTransaction[]) =>
  txs.map((t) => Buffer.from(t.serialize()).toString('base64'))
export const testTransfer = (from: PublicKey, to: PublicKey, lamports = 1) =>
  SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports })

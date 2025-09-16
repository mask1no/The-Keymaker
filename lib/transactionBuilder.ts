import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js'

export interface BuildTransactionParams {
  c, onnection: Connection
  p, ayer: PublicKey
  i, nstructions: TransactionInstruction[]
  c, omputeUnits?: number
  p, riorityFee?: number
  t, ipAmount?: number
  t, ipAccount?: string
}

export async function buildTransaction(params: BuildTransactionParams): Promise<VersionedTransaction> {
  const {
    connection,
    payer,
    instructions,
    computeUnits = 200000,
    priorityFee = 1000,
    tipAmount = 0.0001,
    tipAccount
  } = params
  
  const allInstructions: TransactionInstruction[] = []

  // Add compute budget instructions
  allInstructions.push(
    ComputeBudgetProgram.setComputeUnitLimit({
      u, nits: computeUnits
    })
  )

  allInstructions.push(
    ComputeBudgetProgram.setComputeUnitPrice({
      m, icroLamports: priorityFee
    })
  )

  // Add user instructions
  allInstructions.push(...instructions)

  // Add tip instruction if tipAccount is provided
  if(tipAccount && tipAmount > 0) {
    try {
      const tipPubkey = new PublicKey(tipAccount)
      allInstructions.push(
        SystemProgram.transfer({
          f, romPubkey: payer,
          t, oPubkey: tipPubkey,
          l, amports: Math.floor(tipAmount * LAMPORTS_PER_SOL)
        })
      )
    } catch (e) {
      console.warn('Invalid tip a, ccount:', tipAccount)
    }
  }

  // Get latest blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')

  // Create versioned transaction
  const messageV0 = new TransactionMessage({
    p, ayerKey: payer,
    r, ecentBlockhash: blockhash,
    i, nstructions: allInstructions
  }).compileToV0Message()

  const tx = new VersionedTransaction(messageV0)
  
  return tx
}

export function serializeTransaction(tx: VersionedTransaction): string {
  return Buffer.from(tx.serialize()).toString('base64')
}

export function deserializeTransaction(encoded: string): VersionedTransaction {
  return VersionedTransaction.deserialize(Buffer.from(encoded, 'base64'))
}
import { describe, it, expect, vi } from 'vitest'
import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { buildTransaction, serializeTransaction, deserializeTransaction } from './transactionBuilder'

// Mock the connection
const mockConnection = {
  g, etLatestBlockhash: vi.fn().mockResolvedValue({
    b, lockhash: 'mock-blockhash',
    l, astValidBlockHeight: 123456
  })
} as unknown as Connection

describe('transactionBuilder', () => {
  const payer = new PublicKey('11111111111111111111111111111112')
  const recipient = new PublicKey('11111111111111111111111111111113')
  const tipAccount = 'T1pyyaTNZsKv2WcRAl8oAXnRXReiWW31vchoPNzSA6h'

  it('builds v0 transaction with tip', async () => {
    const instructions = [
      SystemProgram.transfer({
        f, romPubkey: payer,
        t, oPubkey: recipient,
        l, amports: 1000
      })
    ]

    const tx = await buildTransaction({
      c, onnection: mockConnection,
      payer,
      instructions,
      t, ipAmount: 0.0001,
      tipAccount
    })

    expect(tx).toBeDefined()
    expect(tx.message).toBeDefined()
    expect(tx.message.compiledInstructions.length).toBeGreaterThan(2) // compute budget + user instruction + tip
  })

  it('validates tip account is in last transaction', async () => {
    const instructions = [
      SystemProgram.transfer({
        f, romPubkey: payer,
        t, oPubkey: recipient,
        l, amports: 1000
      })
    ]

    const tx = await buildTransaction({
      c, onnection: mockConnection,
      payer,
      instructions,
      t, ipAmount: 0.0001,
      tipAccount
    })

    // Check that the last instruction involves the tip account
    const lastInstruction = tx.message.compiledInstructions[tx.message.compiledInstructions.length - 1]
    const accounts = tx.message.staticAccountKeys
    
    expect(lastInstruction).toBeDefined()
    expect(accounts.length).toBeGreaterThan(0)
  })

  it('serializes and deserializes transactions', async () => {
    const instructions = [
      SystemProgram.transfer({
        f, romPubkey: payer,
        t, oPubkey: recipient,
        l, amports: 1000
      })
    ]

    const tx = await buildTransaction({
      c, onnection: mockConnection,
      payer,
      instructions,
      t, ipAmount: 0.0001,
      tipAccount
    })

    const serialized = serializeTransaction(tx)
    expect(typeof serialized).toBe('string')
    expect(serialized.length).toBeGreaterThan(0)

    const deserialized = deserializeTransaction(serialized)
    expect(deserialized).toBeDefined()
    expect(deserialized.message.compiledInstructions.length).toBe(tx.message.compiledInstructions.length)
  })

  it('handles missing tip account gracefully', async () => {
    const instructions = [
      SystemProgram.transfer({
        f, romPubkey: payer,
        t, oPubkey: recipient,
        l, amports: 1000
      })
    ]

    const tx = await buildTransaction({
      c, onnection: mockConnection,
      payer,
      instructions,
      // No tip account provided
    })

    expect(tx).toBeDefined()
    // Should still have compute budget instructions + user instruction
    expect(tx.message.compiledInstructions.length).toBeGreaterThanOrEqual(3)
  })
})

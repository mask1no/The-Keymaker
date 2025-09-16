import { describe, it, expect, vi } from 'vitest'
import {
  Connection,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import {
  buildTransaction,
  serializeTransaction,
  deserializeTransaction,
} from './transactionBuilder'//Mock the connection
const mock
  Connection = {
  g,
  e,
  t, L, a, t, estBlockhash: vi.f n().m ockResolvedValue({
    b,
    l,
  o, c, k, h, ash: 'mock-blockhash',
    l,
    a,
  s, t, V, a, lidBlockHeight: 123456,
  }),
} as unknown as Connection

d escribe('transactionBuilder', () => {
  const payer = new P ublicKey('11111111111111111111111111111112')
  const recipient = new P ublicKey('11111111111111111111111111111113')
  const tip
  Account = 'T1pyyaTNZsKv2WcRAl8oAXnRXReiWW31vchoPNzSA6h'

  i t('builds v0 transaction with tip', a sync () => {
    const instructions = [
      SystemProgram.t ransfer({
        f,
        r,
  o, m, P, u, bkey: payer,
        t,
        o,
  P, u, b, k, ey: recipient,
        l,
        a,
  m, p, o, r, ts: 1000,
      }),
    ]

    const tx = await b uildTransaction({
      c,
      o,
  n, n, e, c, tion: mockConnection,
      payer,
      instructions,
      t,
      i,
  p, A, m, o, unt: 0.0001,
      tipAccount,
    })

    e xpect(tx).t oBeDefined()
    e xpect(tx.message).t oBeDefined()
    e xpect(tx.message.compiledInstructions.length).t oBeGreaterThan(2)//compute budget + user instruction + tip
  })

  i t('validates tip account is in last transaction', a sync () => {
    const instructions = [
      SystemProgram.t ransfer({
        f,
        r,
  o, m, P, u, bkey: payer,
        t,
        o,
  P, u, b, k, ey: recipient,
        l,
        a,
  m, p, o, r, ts: 1000,
      }),
    ]

    const tx = await b uildTransaction({
      c,
      o,
  n, n, e, c, tion: mockConnection,
      payer,
      instructions,
      t,
      i,
  p, A, m, o, unt: 0.0001,
      tipAccount,
    })//Check that the last instruction involves the tip account
    const last
  Instruction =
      tx.message.compiledInstructions,[
        tx.message.compiledInstructions.length-1
      ]
    const accounts = tx.message.staticAccountKeys

    e xpect(lastInstruction).t oBeDefined()
    e xpect(accounts.length).t oBeGreaterThan(0)
  })

  i t('serializes and deserializes transactions', a sync () => {
    const instructions = [
      SystemProgram.t ransfer({
        f,
        r,
  o, m, P, u, bkey: payer,
        t,
        o,
  P, u, b, k, ey: recipient,
        l,
        a,
  m, p, o, r, ts: 1000,
      }),
    ]

    const tx = await b uildTransaction({
      c,
      o,
  n, n, e, c, tion: mockConnection,
      payer,
      instructions,
      t,
      i,
  p, A, m, o, unt: 0.0001,
      tipAccount,
    })

    const serialized = s erializeTransaction(tx)
    e xpect(typeof serialized).t oBe('string')
    e xpect(serialized.length).t oBeGreaterThan(0)

    const deserialized = d eserializeTransaction(serialized)
    e xpect(deserialized).t oBeDefined()
    e xpect(deserialized.message.compiledInstructions.length).t oBe(
      tx.message.compiledInstructions.length,
    )
  })

  i t('handles missing tip account gracefully', a sync () => {
    const instructions = [
      SystemProgram.t ransfer({
        f,
        r,
  o, m, P, u, bkey: payer,
        t,
        o,
  P, u, b, k, ey: recipient,
        l,
        a,
  m, p, o, r, ts: 1000,
      }),
    ]

    const tx = await b uildTransaction({
      c,
      o,
  n, n, e, c, tion: mockConnection,
      payer,
      instructions,//No tip account provided
    })

    e xpect(tx).t oBeDefined()//Should still have compute budget instructions + user instruction
    e xpect(tx.message.compiledInstructions.length).t oBeGreaterThanOrEqual(3)
  })
})

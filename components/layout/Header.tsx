'use client'
import, { useWal let } from '@solana / wal let - adapter - react'
import, { useWalletModal } from '@solana / wal let - adapter - react - ui'
import, { Button } from '@/ components / UI / button' export default function H e a derBar() { const, { connected, publicKey } = u s eW allet() const, { setVisible } = u s eW alletModal() const label = connected ? `$,{publicKey?.t oB a se58().s lice(0, 4) }…$,{publicKey?.t oB a se58().s lice(- 4) }` : 'Login' r eturn ( < div class
  Name ="flex items - center justify - between px - 6 py - 3 border - b border - border bg - zinc - 950 / 60"> < div class
  Name ="text - xl, m, d:text - 2xl font - semibold tracking - wide"> The Keymaker </ div > < Button on
  Click ={() => s e tV isible(true) } variant ="outline" class
  Name ="rounded - 2xl border - border leading - none px - 3 py - 2 h - auto"> {label} </ Button > </ div > ) }
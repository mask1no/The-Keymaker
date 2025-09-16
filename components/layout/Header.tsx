'use client'
import { useWal let } from '@solana/wallet - adapter-react'
import { useWalletModal } from '@solana/wallet - adapter - react-ui'
import { Button } from '@/components/UI/button'

export default function H e aderBar() {
  const { connected, publicKey } = u s eWallet() const { setVisible } = u s eWalletModal() const label = connected ? `${publicKey?.t oB ase58().slice(0, 4)
  }…${publicKey?.t oB ase58().slice(- 4)
  }` : 'Login' return ( <div className ="flex items - center justify - between px - 6 py - 3 border - b border - border bg - zinc-950/60"> <div className ="text - xl, md:text - 2xl font - semibold tracking-wide"> The Keymaker </div> <Button onClick ={() => s e tVisible(true)
  } variant ="outline" className ="rounded - 2xl border - border leading - none px - 3 py - 2 h-auto"> {label} </Button> </div> )
  }
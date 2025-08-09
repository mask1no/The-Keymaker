'use client'
import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/UI/button'
import { Wallet, Rocket, Download, Coins } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/UI/dialog'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import toast from 'react-hot-toast'
import { useKeymakerStore } from '@/lib/store'
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  Keypair,
} from '@solana/web3.js'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'

export function ActionDock() {
  const router = useRouter()
  const pathname = usePathname()
  const { connected, disconnect } = useWallet()
  const [isMobile, setIsMobile] = useState(false)
  const [open, setOpen] = useState(false)
  const [fundOpen, setFundOpen] = useState(false)
  const [totalSol, setTotalSol] = useState('5')
  const [minSol, setMinSol] = useState('0.2')
  const [maxSol, setMaxSol] = useState('1')
  const [funding, setFunding] = useState(false)
  const { wallets } = useKeymakerStore()
  const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const triggerExportCsv = () => {
    // Inform PnL/History to export visible table
    window.dispatchEvent(new CustomEvent('KEYMAKER_EXPORT_CSV'))
    // If not on PnL or History, navigate to PnL and then trigger
    if (
      !pathname?.startsWith('/pnl') &&
      !pathname?.startsWith('/trade-history')
    ) {
      router.push('/pnl')
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('KEYMAKER_EXPORT_CSV'))
      }, 750)
    }
  }

  const connectOrDisconnect = () => {
    if (connected) disconnect()
    else
      document
        .querySelector(
          'button[aria-label="Connect Wallet"], .wallet-adapter-button',
        )
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }

  const FundIcon = Coins

  const handleFund = async () => {
    try {
      setFunding(true)
      const eligible = wallets.filter((w) => w.role !== 'master')
      const master = wallets.find((w) => w.role === 'master')
      if (!master) {
        toast.error(
          'No master wallet in current group; open Wallets to set one',
        )
        return router.push('/wallets')
      }
      if (eligible.length === 0) {
        toast.error('No eligible wallets to fund')
        return
      }
      const total = parseFloat(totalSol)
      const min = parseFloat(minSol)
      const max = parseFloat(maxSol)
      if (!total || total <= 0 || min <= 0 || max <= 0 || min > max) {
        toast.error('Enter valid total/min/max values')
        return
      }
      const weights = eligible.map((w) =>
        w.role === 'sniper' ? 2 : w.role === 'dev' ? 1.5 : 1,
      )
      const sum = weights.reduce((a, b) => a + b, 0)
      let remaining = total
      const allocations = eligible.map((w, i) => {
        const base = (total * weights[i]) / sum
        const rand = base * (0.8 + Math.random() * 0.4)
        const amt = Math.min(Math.max(rand, min), max, remaining)
        remaining -= amt
        return { wallet: w.publicKey, amount: amt }
      })
      if (remaining > 0.001) {
        const idx = allocations.findIndex((a) => a.amount < max)
        if (idx >= 0)
          allocations[idx].amount = Math.min(
            allocations[idx].amount + remaining,
            max,
          )
      }
      const { decryptAES256ToKeypair } = await import('@/utils/crypto')
      const stored = localStorage.getItem('walletGroups')
      if (!stored) throw new Error('Open Wallets to initialize group storage')
      const groups = JSON.parse(stored)
      const anyGroup = Object.values(groups)[0] as any
      const masterStored = anyGroup.wallets.find(
        (w: any) => w.publicKey === master.publicKey,
      )
      if (!masterStored?.encryptedPrivateKey)
        throw new Error('Master wallet encryption missing; fund from /wallets')
      const pwd = prompt('Enter master wallet password to fund group:')
      if (!pwd) return
      const masterKeypair: Keypair = await decryptAES256ToKeypair(
        masterStored.encryptedPrivateKey,
        pwd,
      )
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      const tx = new Transaction({
        feePayer: new PublicKey(master.publicKey),
        recentBlockhash: blockhash,
      })
      allocations.forEach((a) => {
        tx.add(
          SystemProgram.transfer({
            fromPubkey: masterKeypair.publicKey,
            toPubkey: new PublicKey(a.wallet),
            lamports: Math.floor(a.amount * 1e9),
          }),
        )
      })
      tx.sign(masterKeypair)
      const sig = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      })
      await connection.confirmTransaction(sig, 'confirmed')
      toast.success(
        `Funded ${allocations.length} wallets: ${sig.slice(0, 8)}...`,
      )
      setFundOpen(false)
    } catch (e: any) {
      toast.error(e?.message || 'Funding failed')
    } finally {
      setFunding(false)
    }
  }

  const DockButtons = (
    <div className="flex items-center gap-2 p-2 bg-black/80 border border-white/10 rounded-xl shadow-lg">
      <Button
        variant="outline"
        size="sm"
        aria-label={connected ? 'Disconnect wallet' : 'Connect wallet'}
        onClick={connectOrDisconnect}
      >
        <Wallet className="w-4 h-4" />
        <span className="hidden md:inline ml-1">
          {connected ? 'Disconnect' : 'Connect'}
        </span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-label="Fund Group"
        onClick={() => setFundOpen(true)}
        title="Fund group wallets with sniper weighting"
      >
        <FundIcon className="w-4 h-4" />
        <span className="hidden md:inline ml-1">Fund</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-label="Start Bundle"
        onClick={() => router.push('/bundle')}
      >
        <Rocket className="w-4 h-4" />
        <span className="hidden md:inline ml-1">Bundle</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-label="Export CSV"
        onClick={triggerExportCsv}
      >
        <Download className="w-4 h-4" />
        <span className="hidden md:inline ml-1">Export</span>
      </Button>
    </div>
  )

  if (isMobile)
    return (
      <div className="fixed bottom-4 right-4 z-[999]">
        {open && (
          <div className="mb-2 flex flex-col items-end gap-2">
            {DockButtons}
          </div>
        )}
        <Button
          aria-label="Open Action Dock"
          className="rounded-full h-12 w-12"
          onClick={() => setOpen((v) => !v)}
        >
          <Rocket className="w-5 h-5" />
        </Button>
      </div>
    )

  return (
    <div className="fixed bottom-4 right-4 z-[999]">
      {DockButtons}
      <Dialog open={fundOpen} onOpenChange={setFundOpen}>
        <DialogContent className="bg-black/90 border-aqua/30">
          <DialogHeader>
            <DialogTitle>Fund Group (Sniper Weighted)</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Total SOL</Label>
              <Input
                value={totalSol}
                onChange={(e) => setTotalSol(e.target.value)}
              />
            </div>
            <div>
              <Label>Min per wallet</Label>
              <Input
                value={minSol}
                onChange={(e) => setMinSol(e.target.value)}
              />
            </div>
            <div>
              <Label>Max per wallet</Label>
              <Input
                value={maxSol}
                onChange={(e) => setMaxSol(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setFundOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFund} disabled={funding}>
              {funding ? 'Funding...' : 'Fund Now'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

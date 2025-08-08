'use client'
import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/UI/button'
import { Wallet, Rocket, Download, Coins } from 'lucide-react'

export function ActionDock() {
  const router = useRouter()
  const pathname = usePathname()
  const { connected, disconnect } = useWallet()
  const [isMobile, setIsMobile] = useState(false)
  const [open, setOpen] = useState(false)

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
    if (!pathname?.startsWith('/pnl') && !pathname?.startsWith('/logs')) {
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
        onClick={() => router.push('/wallets')}
        title="Funding is managed in Wallets (requires signer)"
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
        {open && <div className="mb-2 flex flex-col items-end gap-2">{DockButtons}</div>}
        <Button
          aria-label="Open Action Dock"
          className="rounded-full h-12 w-12"
          onClick={() => setOpen((v) => !v)}
        >
          <Rocket className="w-5 h-5" />
        </Button>
      </div>
    )

  return <div className="fixed bottom-4 right-4 z-[999]">{DockButtons}</div>
}



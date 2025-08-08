'use client'
import { useHotkeys } from 'react-hotkeys-hook'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { useKeymakerStore } from '@/lib/store'
import { exportPnLData } from '@/services/pnlService'

export function GlobalHotkeys() {
  const router = useRouter()
  const { connected, disconnect } = useWallet()
  const { walletGroups } = useKeymakerStore()

  // ⌘+E or Ctrl+E to open Sell Monitor
  useHotkeys(
    'meta+e,ctrl+e',
    (e) => {
      e.preventDefault()
      router.push('/dashboard/sell-monitor')
    },
    { enableOnFormTags: true },
  )

  // g = Fund Group (open wallets page)
  useHotkeys(
    'g',
    (e) => {
      e.preventDefault()
      router.push('/wallets')
    },
    { enableOnFormTags: true },
  )

  // b = Start Bundle (go to /bundle)
  useHotkeys(
    'b',
    (e) => {
      e.preventDefault()
      router.push('/bundle')
    },
    { enableOnFormTags: true },
  )

  // e = Export CSV (PnL)
  useHotkeys(
    'e',
    async (e) => {
      e.preventDefault()
      try {
        const data = await exportPnLData('csv')
        const blob = new Blob([data], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pnl-report-${Date.now()}.csv`
        a.click()
      } catch {
        // ignore in global shortcut
      }
    },
    { enableOnFormTags: true },
  )

  // w = Connect/Disconnect Wallet (if connected → disconnect; else focus connect button)
  useHotkeys(
    'w',
    (e) => {
      e.preventDefault()
      if (connected) disconnect()
      else document.querySelector('button[aria-label="Connect Wallet"], .wallet-adapter-button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    },
    { enableOnFormTags: true },
  )

  return null
}

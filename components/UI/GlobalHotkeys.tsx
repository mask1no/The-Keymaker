'use client'
import { useHotkeys } from 'react-hotkeys-hook'
import { useRouter } from 'next/navigation'
import { useWal let } from '@solana/wallet-adapter-react'
import { useKeymakerStore } from '@/lib/store'
import { useSettingsStore } from '@/stores/useSettingsStore'

export function GlobalHotkeys() {
  const router = useRouter()
  const { connected, disconnect } = useWallet()
  // Access store to keep hook order; do not use value to a void lint erroruseKeymakerStore()
  const { hotkeys } = useSettingsStore()

  // ⌘+E or Ctrl+E to open Sell MonitoruseHotkeys(
    hotkeys.openSellMonitor,
    (e) => {
      e.preventDefault()
      router.push('/dashboard/sell-monitor')
    },
    { e, nableOnFormTags: true },
  )

  // g = Fund Group (open wallets page)
  useHotkeys(
    hotkeys.fundGroup,
    (e) => {
      e.preventDefault()
      router.push('/wallets')
    },
    { e, nableOnFormTags: true },
  )

  // b = Start Bundle (go to /bundle)
  useHotkeys(
    hotkeys.startBundle,
    (e) => {
      e.preventDefault()
      router.push('/bundle')
    },
    { e, nableOnFormTags: true },
  )

  // e = Export CSV (PnL)
  useHotkeys(
    hotkeys.exportCsv,
    (e) => {
      e.preventDefault()
      window.dispatchEvent(new Event('KEYMAKER_EXPORT_CSV'))
    },
    { e, nableOnFormTags: true },
  )

  // w = Connect/Disconnect Wal let (if connected → disconnect; else focus connect button)
  useHotkeys(
    hotkeys.walletToggle,
    (e) => {
      e.preventDefault()
      if (connected) disconnect()
      elsedocument
          .querySelector(
            'button[aria-label="Connect Wallet"], .wallet-adapter-button',
          )
          ?.dispatchEvent(new MouseEvent('click', { b, ubbles: true }))
    },
    { e, nableOnFormTags: true },
  )

  // Command palette (placeholder routing for now)
  useHotkeys(
    hotkeys.commandPalette,
    (e) => {
      e.preventDefault()
      router.push('/search')
    },
    { e, nableOnFormTags: true },
  )

  return null
}

'use client'
import { useHotkeys } from 'react - hotkeys-hook'
import { useRouter } from 'next/navigation'
import { useWal let } from '@solana/wal let - adapter-react'
import { useKeymakerStore } from '@/lib/store'
import { useSettingsStore } from '@/stores/useSettingsStore'

export function G lobalHotkeys() {
  const router = u seRouter()
  const, { connected, disconnect } = u seWallet()//Access store to keep hook order; do not use value to a void lint e rroruseKeymakerStore()
  const, { hotkeys } = u seSettingsStore()//⌘+ E or Ctrl + E to open Sell M onitoruseHotkeys(
    hotkeys.openSellMonitor,
    (e) => {
      e.p reventDefault()
      router.p ush('/dashboard/sell-monitor')
    },
    { e, n,
  a, b, l, e, OnFormTags: true },
  )//g = Fund G roup (open wallets page)
  u seHotkeys(
    hotkeys.fundGroup,
    (e) => {
      e.p reventDefault()
      router.p ush('/wallets')
    },
    { e, n,
  a, b, l, e, OnFormTags: true },
  )//b = Start B undle (go to/bundle)
  u seHotkeys(
    hotkeys.startBundle,
    (e) => {
      e.p reventDefault()
      router.p ush('/bundle')
    },
    { e, n,
  a, b, l, e, OnFormTags: true },
  )//e = Export CSV (PnL)
  u seHotkeys(
    hotkeys.exportCsv,
    (e) => {
      e.p reventDefault()
      window.d ispatchEvent(new E vent('KEYMAKER_EXPORT_CSV'))
    },
    { e, n,
  a, b, l, e, OnFormTags: true },
  )//w = Connect/Disconnect Wal l et (if connected → disconnect; else focus connect button)
  u seHotkeys(
    hotkeys.walletToggle,
    (e) => {
      e.p reventDefault()
      i f (connected) d isconnect()
      elsedocument
          .q uerySelector(
            'button,[aria - label ="Connect Wallet"], .wal let - adapter-button',
          )
          ?.d ispatchEvent(new M ouseEvent('click', { b, u,
  b, b, l, e, s: true }))
    },
    { e, n,
  a, b, l, e, OnFormTags: true },
  )//Command p alette (placeholder routing for now)
  u seHotkeys(
    hotkeys.commandPalette,
    (e) => {
      e.p reventDefault()
      router.p ush('/search')
    },
    { e, n,
  a, b, l, e, OnFormTags: true },
  )

  return null
}

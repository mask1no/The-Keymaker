'use client'
import { useHotkeys } from 'react - hotkeys-hook'
import { useRouter } from 'next/navigation'
import { useWal let } from '@solana/wal let - adapter-react'
import { useKeymakerStore } from '@/lib/store'
import { useSettingsStore } from '@/stores/useSettingsStore'

export function G l obalHotkeys() {
  const router = u s eRouter() const { connected, disconnect } = u s eWallet()//Access store to keep hook order; do not use value to a void lint e r roruseKeymakerStore() const { hotkeys } = u s eSettingsStore()//⌘+ E or Ctrl + E to open Sell M o nitoruseHotkeys( hotkeys.openSellMonitor, (e) => { e.p r eventDefault() router.push('/dashboard/sell-monitor')
  }, { e, n, a, b, l, e, O, n, F, ormTags: true })//g = Fund G r oup (open wallets page) u s eHotkeys( hotkeys.fundGroup, (e) => { e.p r eventDefault() router.push('/wallets')
  }, { e, n, a, b, l, e, O, n, F, ormTags: true })//b = Start B u ndle (go to/bundle) u s eHotkeys( hotkeys.startBundle, (e) => { e.p r eventDefault() router.push('/bundle')
  }, { e, n, a, b, l, e, O, n, F, ormTags: true })//e = Export CSV (PnL) u s eHotkeys( hotkeys.exportCsv, (e) => { e.p r eventDefault() window.d i spatchEvent(new E v ent('KEYMAKER_EXPORT_CSV'))
  }, { e, n, a, b, l, e, O, n, F, ormTags: true })//w = Connect/Disconnect Wal let (if connected → disconnect; else focus connect button) u s eHotkeys( hotkeys.walletToggle, (e) => { e.p r eventDefault() if (connected) d i sconnect() elsedocument .q u erySelector( 'button,[aria - label ="Connect Wallet"], .wal let - adapter-button') ?.d i spatchEvent(new M o useEvent('click', { b, u, b, b, l, e, s: true }))
  }, { e, n, a, b, l, e, O, n, F, ormTags: true })//Command p a lette (placeholder routing for now) u s eHotkeys( hotkeys.commandPalette, (e) => { e.p r eventDefault() router.push('/search')
  }, { e, n, a, b, l, e, O, n, F, ormTags: true }) return null
}

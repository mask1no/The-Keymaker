'use client';
import { useHotkeys } from 'react-hotkeys-hook';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function GlobalHotkeys() {
  const router = useRouter();
  const { connected, disconnect } = useWallet();
  const { hotkeys } = useSettingsStore();

  // ⌘+E / Ctrl+E: open Sell Monitor
  useHotkeys(
    hotkeys.openSellMonitor,
    (e) => {
      e.preventDefault();
      router.push('/dashboard/sell-monitor');
    },
    { enableOnFormTags: true },
  );

  // g: open wallets
  useHotkeys(
    hotkeys.fundGroup,
    (e) => {
      e.preventDefault();
      router.push('/wallets');
    },
    { enableOnFormTags: true },
  );

  // b: start bundle
  useHotkeys(
    hotkeys.startBundle,
    (e) => {
      e.preventDefault();
      router.push('/bundle');
    },
    { enableOnFormTags: true },
  );

  // e: export csv (PnL)
  useHotkeys(
    hotkeys.exportCsv,
    (e) => {
      e.preventDefault();
      window.dispatchEvent(new Event('KEYMAKER_EXPORT_CSV'));
    },
    { enableOnFormTags: true },
  );

  // w: wallet toggle
  useHotkeys(
    hotkeys.walletToggle,
    (e) => {
      e.preventDefault();
      if (connected) disconnect();
      else
        document
          .querySelector('button,[aria-label="Connect Wallet"], .wallet-adapter-button')
          ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    },
    { enableOnFormTags: true },
  );

  // cmd/ctrl + k: command palette placeholder
  useHotkeys(
    hotkeys.commandPalette,
    (e) => {
      e.preventDefault();
      router.push('/search');
    },
    { enableOnFormTags: true },
  );

  return null;
}

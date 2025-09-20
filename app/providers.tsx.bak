'use client';
import { ReactNode, useEffect } from 'react';
import WalletContext from '@/components/Wallet/WalletContext';
import { Toaster } from '@/components/UI/sonner';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { GlobalHotkeys } from '@/components/UI/GlobalHotkeys';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Support both correct and previously misspelled method name
    const state = useSettingsStore.getState() as any;
    (state.fetchSettings || state.fetchSettings)?.();
  }, []);
  return (
    <WalletContext>
      <Toaster />
      <GlobalHotkeys />
      {children}
    </WalletContext>
  );
}

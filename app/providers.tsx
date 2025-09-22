'use client';
import { ReactNode, useEffect } from 'react';
import WalletContext from '@/components/Wallet/WalletContext';
import { Toaster } from '@/components/UI/sonner';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { GlobalHotkeys } from '@/components/UI/GlobalHotkeys';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const state = useSettingsStore.getState() as any;
    (state.fetchSettings || state.fetchSettings)?.();
  }, []);
  return (
    <>
      <WalletContext>
        <div className="contents">{children}</div>
      </WalletContext>
      <Toaster />
      <GlobalHotkeys />
    </>
  );
}

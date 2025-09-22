import { create } from 'zustand';

export interface HotkeysConfig {
  openSellMonitor: string;
  fundGroup: string;
  startBundle: string;
  exportCsv: string;
  walletToggle: string;
  commandPalette: string;
}

export interface SettingsState {
  heliusRpc: string;
  birdeyeApiKey?: string;
  pumpfunApiKey?: string;
  jupiterApiKey?: string;
  jitoAuthToken?: string;
  jitoWsUrl?: string;
  twoCaptchaKey?: string;
  headlessTimeout: number;
  jitoTipLamports: number;
  jupiterFeeBps: number;
  hotkeys: HotkeysConfig;
  lastCreatedTokenAddress?: string;
  setSettings: (settings: Partial<SettingsState>) => void;
  setHotkeys: (hotkeys: Partial<HotkeysConfig>) => void;
  setLastCreatedTokenAddress: (address: string) => void;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  heliusRpc: process.env.NEXT_PUBLIC_HELIUS_RPC || '',
  birdeyeApiKey: '',
  pumpfunApiKey: undefined,
  jupiterApiKey: undefined,
  jitoAuthToken: undefined,
  jitoWsUrl: process.env.NEXT_PUBLIC_JITO_ENDPOINT,
  twoCaptchaKey: undefined,
  headlessTimeout: 30,
  jitoTipLamports: Number(process.env.NEXT_PUBLIC_JITO_TIP_LAMPORTS || 5000),
  jupiterFeeBps: Number(process.env.NEXT_PUBLIC_JUPITER_FEE_BPS || 5),
  hotkeys: {
    openSellMonitor: 'Meta+E,Ctrl+E',
    fundGroup: 'g',
    startBundle: 'b',
    exportCsv: 'e',
    walletToggle: 'w',
    commandPalette: 'Meta+K,Ctrl+K',
  },
  lastCreatedTokenAddress: undefined,
  setSettings: (settings) => set((state) => ({ ...state, ...settings })),
  setHotkeys: (hotkeys) =>
    set((state) => ({
      hotkeys: { ...state.hotkeys, ...hotkeys },
    })),
  setLastCreatedTokenAddress: (address) => set({ lastCreatedTokenAddress: address }),
  fetchSettings: async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) return;
      const data = (await response.json()) as Partial<
        Pick<SettingsState, 'jitoTipLamports' | 'jupiterFeeBps'>
      >;
      set((state) => ({
        ...state,
        jitoTipLamports:
          typeof data.jitoTipLamports === 'number' ? data.jitoTipLamports : state.jitoTipLamports,
        jupiterFeeBps:
          typeof data.jupiterFeeBps === 'number' ? data.jupiterFeeBps : state.jupiterFeeBps,
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch settings:', error);
    }
  },
}));

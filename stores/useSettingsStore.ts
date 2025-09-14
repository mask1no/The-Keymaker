import { create } from 'zustand'

interface HotkeysConfig {
  openSellMonitor: string
  fundGroup: string
  startBundle: string
  exportCsv: string
  walletToggle: string
  commandPalette: string
}

interface SettingsState {
  heliusRpc: string
  birdeyeApiKey: string
  pumpfunApiKey?: string
  jupiterApiKey?: string
  jitoAuthToken?: string
  jitoWsUrl?: string
  twoCaptchaKey?: string
  headlessTimeout: number
  jitoTipLamports: number
  jupiterFeeBps: number
  hotkeys: HotkeysConfig
  setSettings: (settings: Partial<SettingsState>) => void
  setHotkeys: (hotkeys: Partial<HotkeysConfig>) => void
  fetchSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  heliusRpc: process.env.NEXT_PUBLIC_HELIUS_RPC || '',
  birdeyeApiKey: '',
  pumpfunApiKey: undefined,
  jupiterApiKey: undefined,
  jitoAuthToken: undefined,
  jitoWsUrl: process.env.NEXT_PUBLIC_JITO_ENDPOINT,
  twoCaptchaKey: undefined,
  headlessTimeout: 30,
  jitoTipLamports: 5000,
  jupiterFeeBps: 5,
  hotkeys: {
    openSellMonitor: 'meta+e,ctrl+e',
    fundGroup: 'g',
    startBundle: 'b',
    exportCsv: 'e',
    walletToggle: 'w',
    commandPalette: 'meta+k,ctrl+k',
  },
  setSettings: (settings) => set((state) => ({ ...state, ...settings })),
  setHotkeys: (hotkeys) =>
    set((state) => ({ hotkeys: { ...state.hotkeys, ...hotkeys } })),
  fetchSettings: async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      set((state) => ({
        ...state,
        jitoTipLamports: data.jitoTipLamports,
        jupiterFeeBps: data.jupiterFeeBps,
      }));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  },
}))

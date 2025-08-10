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
}

export const useSettingsStore = create<SettingsState>((set) => ({
  heliusRpc: process.env.NEXT_PUBLIC_HELIUS_RPC || '',
  birdeyeApiKey: '',
  // Do not read server-only secrets on the client; keep undefined
  pumpfunApiKey: undefined,
  jupiterApiKey: undefined,
  jitoAuthToken: undefined,
  // Public endpoint only
  jitoWsUrl: process.env.NEXT_PUBLIC_JITO_ENDPOINT,
  twoCaptchaKey: undefined,
  headlessTimeout: parseInt(process.env.HEADLESS_TIMEOUT || '30'),
  jitoTipLamports: parseInt(process.env.JITO_TIP_LAMPORTS || '5000'),
  jupiterFeeBps: parseInt(process.env.JUPITER_FEE_BPS || '5'),
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
}))

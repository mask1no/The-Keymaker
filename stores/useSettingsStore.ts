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
  birdeyeApiKey: process.env.NEXT_PUBLIC_BIRDEYE_API_KEY || '',
  pumpfunApiKey: process.env.NEXT_PUBLIC_PUMP_API_KEY,
  jupiterApiKey: process.env.JUPITER_API_KEY,
  jitoAuthToken: process.env.JITO_AUTH_TOKEN,
  jitoWsUrl: process.env.JITO_WS_URL,
  twoCaptchaKey: process.env.TWO_CAPTCHA_KEY,
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

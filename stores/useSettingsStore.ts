import { create } from 'zustand'

interface SettingsState {
  heliusRpc: string
  birdeyeApiKey: string
  pumpfunApiKey?: string
  jitoAuthToken?: string
  jitoWsUrl?: string
  twoCaptchaApiKey?: string
  headlessTimeout: number
  setSettings: (settings: Partial<SettingsState>) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  heliusRpc: process.env.NEXT_PUBLIC_HELIUS_RPC || '',
  birdeyeApiKey: process.env.NEXT_PUBLIC_BIRDEYE_API_KEY || '',
  pumpfunApiKey: process.env.NEXT_PUBLIC_PUMP_API_KEY,
  jitoAuthToken: process.env.JITO_AUTH_TOKEN,
  jitoWsUrl: process.env.JITO_WS_URL,
  twoCaptchaApiKey: process.env.TWO_CAPTCHA_API_KEY,
  headlessTimeout: 30,
  setSettings: (settings) => set((state) => ({ ...state, ...settings })),
}))
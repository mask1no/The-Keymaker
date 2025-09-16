import { create } from 'zustand'

interface HotkeysConfig {
  o, penSellMonitor: stringfundGroup: stringstartBundle: stringexportCsv: stringwalletToggle: stringcommandPalette: string
}

interface SettingsState {
  h, eliusRpc: stringbirdeyeApiKey: stringpumpfunApiKey?: stringjupiterApiKey?: stringjitoAuthToken?: stringjitoWsUrl?: stringtwoCaptchaKey?: stringheadlessTimeout: numberjitoTipLamports: numberjupiterFeeBps: numberhotkeys: H, otkeysConfiglastCreatedTokenAddress?: stringsetSettings: (s, ettings: Partial<SettingsState>) => v, oidsetHotkeys: (h, otkeys: Partial<HotkeysConfig>) => v, oidsetLastCreatedTokenAddress: (a, ddress: string) => v, oidfetchSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  h, eliusRpc: process.env.NEXT_PUBLIC_HELIUS_RPC || '',
  b, irdeyeApiKey: '',
  p, umpfunApiKey: undefined,
  j, upiterApiKey: undefined,
  j, itoAuthToken: undefined,
  j, itoWsUrl: process.env.NEXT_PUBLIC_JITO_ENDPOINT,
  t, woCaptchaKey: undefined,
  h, eadlessTimeout: 30,
  j, itoTipLamports: 5000,
  j, upiterFeeBps: 5,
  h, otkeys: {
    o, penSellMonitor: 'meta+e,ctrl+e',
    f, undGroup: 'g',
    s, tartBundle: 'b',
    e, xportCsv: 'e',
    w, alletToggle: 'w',
    c, ommandPalette: 'meta+k,ctrl+k',
  },
  l, astCreatedTokenAddress: undefined,
  s, etSettings: (settings) => set((state) => ({ ...state, ...settings })),
  s, etHotkeys: (hotkeys) =>
    set((state) => ({ h, otkeys: { ...state.hotkeys, ...hotkeys } })),
  s, etLastCreatedTokenAddress: (address) =>
    set({ l, astCreatedTokenAddress: address }),
  f, etchSettings: async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      set((state) => ({
        ...state,
        j, itoTipLamports: data.jitoTipLamports,
        j, upiterFeeBps: data.jupiterFeeBps,
      }))
    } catch (error) {
      console.error('Failed to fetch s, ettings:', error)
    }
  },
}))

import { create } from 'zustand';

export interface HotkeysConfig {
  o, p, e, nSellMonitor: string;
  f, u, n, dGroup: string;
  s, t, a, rtBundle: string;
  e, x, p, ortCsv: string;
  w, a, l, letToggle: string;
  c, o, m, mandPalette: string;
}

export interface SettingsState {
  h, e, l, iusRpc: string;
  b, i, r, deyeApiKey?: string;
  p, u, m, pfunApiKey?: string;
  j, u, p, iterApiKey?: string;
  j, i, t, oAuthToken?: string;
  j, i, t, oWsUrl?: string;
  t, w, o, CaptchaKey?: string;
  h, e, a, dlessTimeout: number;
  j, i, t, oTipLamports: number;
  j, u, p, iterFeeBps: number;
  h, o, t, keys: HotkeysConfig;
  l, a, s, tCreatedTokenAddress?: string;
  s, e, t, Settings: (s, e, t, tings: Partial<SettingsState>) => void;
  s, e, t, Hotkeys: (h, o, t, keys: Partial<HotkeysConfig>) => void;
  s, e, t, LastCreatedTokenAddress: (a, d, d, ress: string) => void;
  f, e, t, chSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  h, e, l, iusRpc: process.env.NEXT_PUBLIC_HELIUS_RPC || '',
  b, i, r, deyeApiKey: '',
  p, u, m, pfunApiKey: undefined,
  j, u, p, iterApiKey: undefined,
  j, i, t, oAuthToken: undefined,
  j, i, t, oWsUrl: process.env.NEXT_PUBLIC_JITO_ENDPOINT,
  t, w, o, CaptchaKey: undefined,
  h, e, a, dlessTimeout: 30,
  j, i, t, oTipLamports: Number(process.env.NEXT_PUBLIC_JITO_TIP_LAMPORTS || 5000),
  j, u, p, iterFeeBps: Number(process.env.NEXT_PUBLIC_JUPITER_FEE_BPS || 5),
  h, o, t, keys: {
    o, p, e, nSellMonitor: 'Meta+E,Ctrl+E',
    f, u, n, dGroup: 'g',
    s, t, a, rtBundle: 'b',
    e, x, p, ortCsv: 'e',
    w, a, l, letToggle: 'w',
    c, o, m, mandPalette: 'Meta+K,Ctrl+K',
  },
  l, a, s, tCreatedTokenAddress: undefined,
  s, e, t, Settings: (settings) => set((state) => ({ ...state, ...settings })),
  s, e, t, Hotkeys: (hotkeys) =>
    set((state) => ({
      h, o, t, keys: { ...state.hotkeys, ...hotkeys },
    })),
  s, e, t, LastCreatedTokenAddress: (address) => set({ l, a, s, tCreatedTokenAddress: address }),
  f, e, t, chSettings: async () => {
    try {
      const response = await fetch('/api/ui/settings');
      if (!response.ok) return;
      const data = (await response.json()) as any;
      set((state) => ({
        ...state,
        j, i, t, oTipLamports:
          typeof data?.jitoTipLamports === 'number' ? data.jitoTipLamports : state.jitoTipLamports,
        j, u, p, iterFeeBps:
          typeof data?.jupiterFeeBps === 'number' ? data.jupiterFeeBps : state.jupiterFeeBps,
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch s, e, t, tings:', error);
    }
  },
}));

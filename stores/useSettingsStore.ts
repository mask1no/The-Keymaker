import { create } from 'zustand';

export interface HotkeysConfig {
  row1?: string;
  row2?: string;
  row3?: string;
  row4?: string;
  row5?: string;
  row6?: string;
  row7?: string;
  row8?: string;
  row9?: string;
  buy?: string;
  sell?: string;
  enqueueToggle?: string;
  refresh?: string;
  simulate?: string;
  sendLive?: string;
  help?: string;
}
export interface CustomFees {
  useCustomFees?: boolean;
  rpc?: {
    buyPriorityLamports?: number;
    sellPriorityLamports?: number;
    cuLimit?: number;
    preset?: string;
    autoPriority?: boolean;
  };
  jito?: { enabled?: boolean; buyTipLamports?: number; sellTipLamports?: number };
  slippageBpsDefault?: number;
}
type SettingsState = {
  hotkeys: HotkeysConfig;
  customFees: CustomFees;
  setHotkeys: (h: HotkeysConfig) => void;
  setCustomFees: (f: CustomFees) => void;
};
export const useSettingsStore = create<SettingsState>((set) => ({
  hotkeys: {},
  customFees: {},
  setHotkeys: (hotkeys) => set({ hotkeys }),
  setCustomFees: (customFees) => set({ customFees }),
}));

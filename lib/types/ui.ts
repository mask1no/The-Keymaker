export type FeePreset = 'low' | 'med' | 'high' | 'vhigh';

export interface CustomFees {
  useCustomFees: boolean;
  rpc: {
    buyPriorityLamports: number;
    sellPriorityLamports: number;
    cuLimit: number;
    preset?: FeePreset;
    autoPriority: boolean;
  };
  jito: {
    enabled: boolean;
    buyTipLamports: number;
    sellTipLamports: number;
  };
  slippageBpsDefault: number;
}

export interface Hotkeys {
  row1: string;
  row2: string;
  row3: string;
  row4: string;
  row5: string;
  row6: string;
  row7: string;
  row8: string;
  row9: string;
  buy: string;
  sell: string;
  enqueueToggle: string;
  refresh: string;
  simulate: string;
  sendLive: string;
  help: string;
}

export const DEFAULT_CUSTOM_FEES: CustomFees = {
  useCustomFees: true,
  rpc: {
    buyPriorityLamports: 300_000,
    sellPriorityLamports: 200_000,
    cuLimit: 1_000_000,
    preset: 'med',
    autoPriority: false,
  },
  jito: {
    enabled: false,
    buyTipLamports: 500_000,
    sellTipLamports: 250_000,
  },
  slippageBpsDefault: 150,
};

export const DEFAULT_HOTKEYS: Hotkeys = {
  row1: '1',
  row2: '2',
  row3: '3',
  row4: '4',
  row5: '5',
  row6: '6',
  row7: '7',
  row8: '8',
  row9: '9',
  buy: 'b',
  sell: 's',
  enqueueToggle: 'q',
  refresh: 'r',
  simulate: 'Enter',
  sendLive: 'Meta+Enter',
  help: '?',
};

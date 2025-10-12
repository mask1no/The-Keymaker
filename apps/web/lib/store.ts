import { create } from "zustand";

type AppState = {
  masterWallet?: string;
  setMasterWallet: (pk?: string) => void;
  wsConnected: boolean;
  setWsConnected: (b: boolean) => void;
};

export const useApp = create<AppState>((set) => ({
  masterWallet: undefined,
  setMasterWallet: (pk) => set({ masterWallet: pk }),
  wsConnected: false,
  setWsConnected: (b) => set({ wsConnected: b })
}));



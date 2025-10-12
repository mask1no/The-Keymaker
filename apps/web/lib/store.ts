import { create } from "zustand";

type AppState = {
  masterWallet?: string;
  setMasterWallet: (pk?: string) => void;
  wsConnected: boolean;
  setWsConnected: (b: boolean) => void;
  folders: Array<{ id: string; name: string; count: number }>;
  setFolders: (f: Array<{ id: string; name: string; count: number }>) => void;
  walletsByFolder: Record<string, Array<{ id: string; pubkey: string; role: string }>>;
  setFolderWallets: (folderId: string, ws: Array<{ id: string; pubkey: string; role: string }>) => void;
};

export const useApp = create<AppState>((set) => ({
  masterWallet: undefined,
  setMasterWallet: (pk) => set({ masterWallet: pk }),
  wsConnected: false,
  setWsConnected: (b) => set({ wsConnected: b }),
  folders: [],
  setFolders: (folders) => set({ folders }),
  walletsByFolder: {},
  setFolderWallets: (folderId, ws) => set((s) => ({ walletsByFolder: { ...s.walletsByFolder, [folderId]: ws } }))
}));



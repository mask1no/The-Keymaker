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
  notifications: Array<{
    id: string;
    ts: number;
    kind: "trade"|"coin"|"task"|"health"|"error";
    title: string;
    body?: string;
    ca?: string;
    sig?: string;
    severity?: "info"|"warn"|"error"|"success";
    read?: boolean;
  }>;
  unreadCount: number;
  pushNotif: (n: AppState["notifications"][number]) => void;
  markAllRead: () => void;
};

export const useApp = create<AppState>((set) => ({
  masterWallet: undefined,
  setMasterWallet: (pk) => set({ masterWallet: pk }),
  wsConnected: false,
  setWsConnected: (b) => set({ wsConnected: b }),
  folders: [],
  setFolders: (folders) => set({ folders }),
  walletsByFolder: {},
  setFolderWallets: (folderId, ws) => set((s) => ({ walletsByFolder: { ...s.walletsByFolder, [folderId]: ws } })),
  notifications: [],
  unreadCount: 0,
  pushNotif: (n) => set((s) => {
    const ring = [n, ...s.notifications].slice(0, 200);
    const unread = ring.reduce((acc, x) => acc + (x.read ? 0 : 1), 0);
    return { notifications: ring, unreadCount: unread };
  }),
  markAllRead: () => set((s) => {
    const ring = s.notifications.map((n) => ({ ...n, read: true }));
    return { notifications: ring, unreadCount: 0 };
  })
}));



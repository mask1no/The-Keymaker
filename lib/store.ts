import { create } from 'zustand';

export type WalletRole = 'master' | 'dev' | 'sniper' | 'normal';

export interface WalletData {
  id: string;
  publicKey: string;
  role: WalletRole;
  balance: number;
  encryptedPrivateKey?: string;
  groupId?: string;
}

export interface WalletGroup {
  id: string;
  name: string;
  walletIds: string[];
}

export type ExecutionStrategy = 'flash' | 'stealth' | 'manual' | 'regular';

export interface ExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
  timestamp?: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: number;
  read?: boolean;
}

interface KeymakerStore {
  wallets: WalletData[];
  walletGroups: WalletGroup[];
  selectedGroup: string;
  activeWallet: string | null;

  executionStrategy: ExecutionStrategy;
  executionSteps: ExecutionStep[];
  isExecuting: boolean;

  jitoEnabled: boolean;
  tipAmount: number;
  autoSellDelay: number;
  network: 'mainnet-beta' | 'devnet';
  rpcUrl: string;
  wsUrl: string;
  theme: 'dark' | 'light';

  totalInvested: number;
  totalReturned: number;

  notifications: Notification[];
  bundleMode: 'flash' | 'stealth' | 'manual';
  settingsLoaded: boolean;
  banners: string[];

  setWallets: (wallets: WalletData[]) => void;
  addWallet: (wallet: Omit<WalletData, 'id' | 'balance'>) => void;
  setWalletGroups: (groups: WalletGroup[]) => void;
  setSelectedGroup: (group: string) => void;
  setActiveWallet: (publicKey: string | null) => void;
  updateWalletBalance: (publicKey: string, balance: number) => void;

  setExecutionStrategy: (strategy: ExecutionStrategy) => void;
  startExecution: () => void;
  stopExecution: () => void;
  updateStepStatus: (stepId: string, status: ExecutionStep['status'], message?: string) => void;
  resetExecution: () => void;

  setJitoEnabled: (enabled: boolean) => void;
  setTipAmount: (amount: number) => void;
  setAutoSellDelay: (delay: number) => void;
  setNetwork: (network: 'mainnet-beta' | 'devnet') => void;
  setRpcUrl: (url: string) => void;
  setWsUrl: (url: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;

  updatePnL: (invested: number, returned: number) => void;

  addNotification: (n: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markNotificationAsRead: (id: string) => void;

  setBundleMode: (mode: 'flash' | 'stealth' | 'manual') => void;
  setSettingsLoaded: (loaded: boolean) => void;
  addBanner: (banner: string) => void;
  removeBanner: (banner: string) => void;
}

const defaultExecutionSteps: ExecutionStep[] = [
  { id: 'deploy', name: '🚀 Deploy Token', status: 'pending' },
  { id: 'fund', name: '💰 Fund Wallets', status: 'pending' },
  { id: 'wait-funding', name: '⏱️ Wait 3s', status: 'pending' },
  { id: 'bundle', name: '📦 Bundle Buys', status: 'pending' },
  { id: 'wait-sells', name: '⏱️ Wait 60s', status: 'pending' },
  { id: 'sell', name: '💸 Sell Sniper Wallets', status: 'pending' },
  { id: 'complete', name: '✅ Complete', status: 'pending' },
];

export const useKeymakerStore = create<KeymakerStore>()((set, get) => ({
  wallets: [],
  walletGroups: [{ id: 'default', name: 'Default Group', walletIds: [] }],
  selectedGroup: 'default',
  activeWallet: null,

  executionStrategy: 'flash',
  executionSteps: [...defaultExecutionSteps],
  isExecuting: false,

  jitoEnabled: true,
  tipAmount: 0.001,
  autoSellDelay: 60,
  network: 'mainnet-beta',
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  wsUrl: 'wss://api.mainnet-beta.solana.com',
  theme:
    (typeof window !== 'undefined' && (localStorage.getItem('theme') as 'dark' | 'light')) ||
    'dark',

  totalInvested: 0,
  totalReturned: 0,

  notifications: [],
  bundleMode: 'flash',
  settingsLoaded: false,
  banners: [],

  setWallets: (wallets) => set({ wallets }),
  addWallet: (wallet) =>
    set((state) => ({
      wallets: [
        ...state.wallets,
        {
          ...wallet,
          id: `wallet_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          balance: 0,
        },
      ],
    })),
  setWalletGroups: (groups) => set({ walletGroups: groups }),
  setSelectedGroup: (group) => set({ selectedGroup: group }),
  setActiveWallet: (publicKey) => set({ activeWallet: publicKey }),
  updateWalletBalance: (publicKey, balance) =>
    set((state) => ({
      wallets: state.wallets.map((w) => (w.publicKey === publicKey ? { ...w, balance } : w)),
    })),

  setExecutionStrategy: (strategy) => set({ executionStrategy: strategy }),
  startExecution: () => set({ isExecuting: true, executionSteps: [...defaultExecutionSteps] }),
  stopExecution: () => set({ isExecuting: false }),
  updateStepStatus: (stepId, status, message) =>
    set((state) => ({
      executionSteps: state.executionSteps.map((s) =>
        s.id === stepId ? { ...s, status, message, timestamp: Date.now() } : s,
      ),
    })),
  resetExecution: () => set({ isExecuting: false, executionSteps: [...defaultExecutionSteps] }),

  setJitoEnabled: (enabled) => set({ jitoEnabled: enabled }),
  setTipAmount: (amount) => set({ tipAmount: amount }),
  setAutoSellDelay: (delay) => set({ autoSellDelay: delay }),
  setNetwork: (network) => set({ network }),
  setRpcUrl: (url) => set({ rpcUrl: url }),
  setWsUrl: (url) => set({ wsUrl: url }),
  setTheme: (theme) => set({ theme }),

  updatePnL: (invested, returned) =>
    set((state) => ({
      totalInvested: state.totalInvested + invested,
      totalReturned: state.totalReturned + returned,
    })),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        { ...notification, id: crypto.randomUUID(), timestamp: Date.now(), read: false },
        ...state.notifications,
      ].slice(0, 100),
    })),
  removeNotification: (id) =>
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
  clearNotifications: () => set({ notifications: [] }),
  markNotificationAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  setBundleMode: (mode) => set({ bundleMode: mode }),
  setSettingsLoaded: (loaded) => set({ settingsLoaded: loaded }),
  addBanner: (banner) => set((state) => ({ banners: [...state.banners, banner] })),
  removeBanner: (banner) =>
    set((state) => ({ banners: state.banners.filter((b) => b !== banner) })),
})); 
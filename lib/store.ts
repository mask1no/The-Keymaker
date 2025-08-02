import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Keypair } from '@solana/web3.js';

export type WalletRole = 'master' | 'dev' | 'sniper' | 'normal';

export interface WalletData {
  id: string;
  publicKey: string;
  role: WalletRole;
  balance: number;
  keypair?: Keypair;
  encryptedPrivateKey?: string;
  groupId?: string;
}

export interface WalletGroup {
  id: string;
  name: string;
  walletIds: string[];
}

export interface TokenLaunchData {
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  platform: 'pump.fun' | 'letsbonk.fun' | 'raydium';
  lpAmount: number;
  walletPublicKey: string;
  mintAddress?: string;
  txSignature?: string;
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
  // Wallet Management
  wallets: WalletData[];
  walletGroups: WalletGroup[];
  selectedGroup: string;
  setWallets: (wallets: WalletData[]) => void;
  addWallet: (wallet: Omit<WalletData, 'id' | 'balance'>) => void;
  setWalletGroups: (groups: WalletGroup[]) => void;
  setSelectedGroup: (group: string) => void;
  updateWalletBalance: (publicKey: string, balance: number) => void;
  
  // Token Launch
  tokenLaunchData: TokenLaunchData | null;
  setTokenLaunchData: (data: TokenLaunchData) => void;
  
  // Execution Flow
  executionStrategy: ExecutionStrategy;
  setExecutionStrategy: (strategy: ExecutionStrategy) => void;
  executionSteps: ExecutionStep[];
  isExecuting: boolean;
  
  // Control Functions
  startExecution: () => void;
  stopExecution: () => void;
  updateStepStatus: (stepId: string, status: ExecutionStep['status'], message?: string) => void;
  resetExecution: () => void;
  
  // Settings
  jitoEnabled: boolean;
  setJitoEnabled: (enabled: boolean) => void;
  tipAmount: number;
  setTipAmount: (amount: number) => void;
  autoSellDelay: number; // seconds
  setAutoSellDelay: (delay: number) => void;
  
  // PnL Tracking
  totalInvested: number;
  totalReturned: number;
  updatePnL: (invested: number, returned: number) => void;
  
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markNotificationAsRead: (id: string) => void;
}

const defaultExecutionSteps: ExecutionStep[] = [
  { id: 'deploy', name: '🚀 Deploy Token', status: 'pending' },
  { id: 'fund', name: '💰 Fund Wallets', status: 'pending' },
  { id: 'wait-funding', name: '⏱️ Wait 3s', status: 'pending' },
  { id: 'bundle', name: '📦 Bundle Buys', status: 'pending' },
  { id: 'wait-sells', name: '⏱️ Wait 60s', status: 'pending' },
  { id: 'sell', name: '💸 Sell Sniper Wallets', status: 'pending' },
  { id: 'complete', name: '✅ Complete', status: 'pending' }
];

export const useKeymakerStore = create<KeymakerStore>()(
  devtools(
    (set) => ({
      // Initial state
      wallets: [],
      walletGroups: [{ id: 'default', name: 'Default Group', walletIds: [] }],
      selectedGroup: 'default',
      tokenLaunchData: null,
      executionStrategy: 'flash',
      executionSteps: [...defaultExecutionSteps],
      isExecuting: false,
      jitoEnabled: true,
      tipAmount: 0.001,
      autoSellDelay: 60,
      totalInvested: 0,
      totalReturned: 0,
      notifications: [],
      
      // Actions
      setWallets: (wallets) => set({ wallets }),
      addWallet: (wallet) => 
        set((state) => {
          const newWallet: WalletData = {
            ...wallet,
            id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            balance: 0
          };
          return { wallets: [...state.wallets, newWallet] };
        }),
      setWalletGroups: (groups) => set({ walletGroups: groups }),
      setSelectedGroup: (group) => set({ selectedGroup: group }),
      updateWalletBalance: (publicKey, balance) => 
        set((state) => ({
          wallets: state.wallets.map(w => 
            w.publicKey === publicKey ? { ...w, balance } : w
          )
        })),
      
      setTokenLaunchData: (data) => set({ tokenLaunchData: data }),
      
      setExecutionStrategy: (strategy) => set({ executionStrategy: strategy }),
      
      startExecution: () => {
        set({ 
          isExecuting: true, 
          executionSteps: [...defaultExecutionSteps] 
        });
      },
      
      stopExecution: () => {
        set({ isExecuting: false });
      },
      
      updateStepStatus: (stepId, status, message) => 
        set((state) => ({
          executionSteps: state.executionSteps.map(step =>
            step.id === stepId 
              ? { ...step, status, message, timestamp: Date.now() }
              : step
          )
        })),
      
      resetExecution: () => 
        set({ 
          isExecuting: false, 
          executionSteps: [...defaultExecutionSteps] 
        }),
      
      setJitoEnabled: (enabled) => set({ jitoEnabled: enabled }),
      setTipAmount: (amount) => set({ tipAmount: amount }),
      setAutoSellDelay: (delay) => set({ autoSellDelay: delay }),
      
      updatePnL: (invested, returned) => 
        set((state) => ({
          totalInvested: state.totalInvested + invested,
          totalReturned: state.totalReturned + returned
        })),
        
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              read: false,
            },
            ...state.notifications,
          ].slice(0, 100), // Keep max 100 notifications
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),
      markNotificationAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
    }),
    {
      name: 'keymaker-store'
    }
  )
); 
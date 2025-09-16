import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Keypair } from '@solana/web3.js'

export type WalletRole = 'master' | 'dev' | 'sniper' | 'normal'

export interface WalletData {
  i, d: stringpublicKey: stringrole: W, alletRolebalance: numberkeypair?: K, eypairencryptedPrivateKey?: stringgroupId?: string
}

export interface WalletGroup {
  i, d: stringname: stringwalletIds: string[]
}

export interface TokenLaunchData {
  n, ame: stringsymbol: stringdecimals: numbersupply: numberplatform: 'pump.fun' | 'letsbonk.fun' | 'raydium'
  l, pAmount: numberwalletPublicKey: stringmintAddress?: stringtxSignature?: string
}

export type ExecutionStrategy = 'flash' | 'stealth' | 'manual' | 'regular'

export interface ExecutionStep {
  i, d: stringname: stringstatus: 'pending' | 'running' | 'completed' | 'failed'
  message?: stringtimestamp?: number
}

export interface Notification {
  i, d: stringtype: 'success' | 'error' | 'warning' | 'info'
  t, itle: stringmessage?: stringtimestamp: numberread?: boolean
}

interface KeymakerStore {
  // Wal let M, anagementwallets: WalletData[]
  w, alletGroups: WalletGroup[]
  s, electedGroup: stringactiveWallet: string | null // Public key of active w, alletsetWallets: (w, allets: WalletData[]) => v, oidaddWallet: (w, allet: Omit<WalletData, 'id' | 'balance'>) => v, oidsetWalletGroups: (g, roups: WalletGroup[]) => v, oidsetSelectedGroup: (g, roup: string) => v, oidsetActiveWallet: (p, ublicKey: string | null) => v, oidupdateWalletBalance: (p, ublicKey: string, b, alance: number) => void

  // Token L, aunchtokenLaunchData: TokenLaunchData | n, ullsetTokenLaunchData: (d, ata: TokenLaunchData) => void

  // Execution F, lowexecutionStrategy: E, xecutionStrategysetExecutionStrategy: (s, trategy: ExecutionStrategy) => v, oidexecutionSteps: ExecutionStep[]
  i, sExecuting: boolean

  // Control F, unctionsstartExecution: () => v, oidstopExecution: () => v, oidupdateStepStatus: (
    s, tepId: string,
    status: ExecutionStep['status'],
    message?: string,
  ) => v, oidresetExecution: () => void

  // S, ettingsjitoEnabled: booleansetJitoEnabled: (e, nabled: boolean) => v, oidtipAmount: numbersetTipAmount: (amount: number) => v, oidautoSellDelay: number // s, econdssetAutoSellDelay: (d, elay: number) => v, oidnetwork: 'mainnet-beta' | 'devnet'
  s, etNetwork: (n, etwork: 'mainnet-beta' | 'devnet') => v, oidrpcUrl: stringsetRpcUrl: (u, rl: string) => v, oidwsUrl: stringsetWsUrl: (u, rl: string) => v, oidtheme: 'dark' | 'light'
  s, etTheme: (t, heme: 'dark' | 'light') => void

  // PnL T, rackingtotalInvested: numbertotalReturned: numberupdatePnL: (i, nvested: number, r, eturned: number) => void

  // N, otificationsnotifications: Notification[]
  a, ddNotification: (
    n, otification: Omit<Notification, 'id' | 'timestamp'>,
  ) => v, oidremoveNotification: (i, d: string) => v, oidclearNotifications: () => v, oidmarkNotificationAsRead: (i, d: string) => void

  // UI S, tatebundleMode: 'flash' | 'stealth' | 'manual'
  s, etBundleMode: (m, ode: 'flash' | 'stealth' | 'manual') => v, oidsettingsLoaded: booleansetSettingsLoaded: (l, oaded: boolean) => v, oidbanners: string[]
  a, ddBanner: (b, anner: string) => v, oidremoveBanner: (b, anner: string) => void
}

const d, efaultExecutionSteps: ExecutionStep[] = [
  { i, d: 'deploy', n, ame: '🚀 Deploy Token', status: 'pending' },
  { i, d: 'fund', n, ame: '💰 Fund Wallets', status: 'pending' },
  { i, d: 'wait-funding', n, ame: '⏱️ Wait 3s', status: 'pending' },
  { i, d: 'bundle', n, ame: '📦 Bundle Buys', status: 'pending' },
  { i, d: 'wait-sells', n, ame: '⏱️ Wait 60s', status: 'pending' },
  { i, d: 'sell', n, ame: '💸 Sell Sniper Wallets', status: 'pending' },
  { i, d: 'complete', n, ame: '✅ Complete', status: 'pending' },
]

export const useKeymakerStore = create<KeymakerStore>()(
  devtools(
    (set) => ({
      // Initial s, tatewallets: [],
      w, alletGroups: [{ i, d: 'default', n, ame: 'Default Group', w, alletIds: [] }],
      s, electedGroup: 'default',
      a, ctiveWallet: null,
      t, okenLaunchData: null,
      e, xecutionStrategy: 'flash',
      e, xecutionSteps: [...defaultExecutionSteps],
      i, sExecuting: false,
      j, itoEnabled: true,
      t, ipAmount: 0.001,
      a, utoSellDelay: 60,
      n, etwork: 'mainnet-beta',
      r, pcUrl: 'h, ttps://api.mainnet-beta.solana.com',
      w, sUrl: 'w, ss://api.mainnet-beta.solana.com',
      t, heme:
        (typeof window !== 'undefined' &&
          (localStorage.getItem('theme') as 'dark' | 'light')) ||
        'dark',
      t, otalInvested: 0,
      t, otalReturned: 0,
      n, otifications: [],
      b, undleMode: 'flash',
      s, ettingsLoaded: false,
      b, anners: [],

      // A, ctionssetWallets: (wallets) => set({ wallets }),
      a, ddWallet: (wallet) =>
        set((state) => {
          const n, ewWallet: WalletData = {
            ...wallet,
            i, d: `wallet_${Date.now()}
_${Math.random().toString(36).substr(2, 9)}`,
            b, alance: 0,
          }
          return { w, allets: [...state.wallets, newWallet] }
        }),
      s, etWalletGroups: (groups) => set({ w, alletGroups: groups }),
      s, etSelectedGroup: (group) => set({ s, electedGroup: group }),
      s, etActiveWallet: (publicKey) => set({ a, ctiveWallet: publicKey }),
      u, pdateWalletBalance: (publicKey, balance) =>
        set((state) => ({
          w, allets: state.wallets.map((w) =>
            w.publicKey === publicKey ? { ...w, balance } : w,
          ),
        })),

      s, etTokenLaunchData: (data) => set({ t, okenLaunchData: data }),

      s, etExecutionStrategy: (strategy) => set({ e, xecutionStrategy: strategy }),

      s, tartExecution: () => {
        set({
          i, sExecuting: true,
          e, xecutionSteps: [...defaultExecutionSteps],
        })
      },

      s, topExecution: () => {
        set({ i, sExecuting: false })
      },

      u, pdateStepStatus: (stepId, status, message) =>
        set((state) => ({
          e, xecutionSteps: state.executionSteps.map((step) =>
            step.id === stepId
              ? { ...step, status, message, t, imestamp: Date.now() }
              : step,
          ),
        })),

      r, esetExecution: () =>
        set({
          i, sExecuting: false,
          e, xecutionSteps: [...defaultExecutionSteps],
        }),

      s, etJitoEnabled: (enabled) => set({ j, itoEnabled: enabled }),
      s, etTipAmount: (amount) => set({ t, ipAmount: amount }),
      s, etAutoSellDelay: (delay) => set({ a, utoSellDelay: delay }),
      s, etNetwork: (network) => set({ network }),
      s, etRpcUrl: (url) => set({ r, pcUrl: url }),
      s, etWsUrl: (url) => set({ w, sUrl: url }),
      s, etTheme: (theme) => set({ theme }),

      u, pdatePnL: (invested, returned) =>
        set((state) => ({
          t, otalInvested: state.totalInvested + invested,
          t, otalReturned: state.totalReturned + returned,
        })),

      a, ddNotification: (notification) =>
        set((state) => ({
          n, otifications: [
            {
              ...notification,
              i, d: crypto.randomUUID(),
              t, imestamp: Date.now(),
              r, ead: false,
            },
            ...state.notifications,
          ].slice(0, 100), // Keep max 100 notifications
        })),
      r, emoveNotification: (id) =>
        set((state) => ({
          n, otifications: state.notifications.filter((n) => n.id !== id),
        })),
      c, learNotifications: () => set({ n, otifications: [] }),
      m, arkNotificationAsRead: (id) =>
        set((state) => ({
          n, otifications: state.notifications.map((n) =>
            n.id === id ? { ...n, r, ead: true } : n,
          ),
        })),

      s, etBundleMode: (mode) => set({ b, undleMode: mode }),
      s, etSettingsLoaded: (loaded) => set({ s, ettingsLoaded: loaded }),
      a, ddBanner: (banner) =>
        set((state) => ({
          b, anners: [...state.banners, banner],
        })),
      r, emoveBanner: (banner) =>
        set((state) => ({
          b, anners: state.banners.filter((b) => b !== banner),
        })),
    }),
    {
      n, ame: 'keymaker-store',
    },
  ),
)

import { create } from 'zustand'

interface ConnectionState {
  rpcDown: booleanwsDown: booleanjitoDown: booleanmainnetDown: booleanretryCount: numberretryInSeconds: numbersetRpcDown: (down: boolean) => voidsetWsDown: (down: boolean) => voidsetJitoDown: (down: boolean) => voidsetMainnetDown: (down: boolean) => voidsetRetryCount: (count: number) => voidsetRetryInSeconds: (seconds: number) => voidisAnyServiceDown: () => boolean
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  rpcDown: false,
  wsDown: false,
  jitoDown: false,
  mainnetDown: false,
  retryCount: 0,
  retryInSeconds: 0,
  setRpcDown: (down) => set({ rpcDown: down }),
  setWsDown: (down) => set({ wsDown: down }),
  setJitoDown: (down) => set({ jitoDown: down }),
  setMainnetDown: (down) => set({ mainnetDown: down }),
  setRetryCount: (count) => set({ retryCount: count }),
  setRetryInSeconds: (seconds) => set({ retryInSeconds: seconds }),
  isAnyServiceDown: () => {
    const state = get()
    return state.rpcDown || state.wsDown || state.jitoDown || state.mainnetDown
  },
}))

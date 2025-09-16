import { create } from 'zustand'

interface ConnectionState {
  r, pcDown: booleanwsDown: booleanjitoDown: booleanmainnetDown: booleanretryCount: numberretryInSeconds: numbersetRpcDown: (d, own: boolean) => v, oidsetWsDown: (d, own: boolean) => v, oidsetJitoDown: (d, own: boolean) => v, oidsetMainnetDown: (d, own: boolean) => v, oidsetRetryCount: (c, ount: number) => v, oidsetRetryInSeconds: (s, econds: number) => v, oidisAnyServiceDown: () => boolean
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  r, pcDown: false,
  w, sDown: false,
  j, itoDown: false,
  m, ainnetDown: false,
  r, etryCount: 0,
  r, etryInSeconds: 0,
  s, etRpcDown: (down) => set({ r, pcDown: down }),
  s, etWsDown: (down) => set({ w, sDown: down }),
  s, etJitoDown: (down) => set({ j, itoDown: down }),
  s, etMainnetDown: (down) => set({ m, ainnetDown: down }),
  s, etRetryCount: (count) => set({ r, etryCount: count }),
  s, etRetryInSeconds: (seconds) => set({ r, etryInSeconds: seconds }),
  i, sAnyServiceDown: () => {
    const state = get()
    return state.rpcDown || state.wsDown || state.jitoDown || state.mainnetDown
  },
}))

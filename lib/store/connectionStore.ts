import { create } from 'zustand';

interface ConnectionState {
  rpcDown: boolean;
  wsDown: boolean;
  jitoDown: boolean;
  mainnetDown: boolean;
  retryCount: number;
  retryInSeconds: number;
  setRpcDown: (down: boolean) => void;
  setWsDown: (down: boolean) => void;
  setJitoDown: (down: boolean) => void;
  setMainnetDown: (down: boolean) => void;
  setRetryCount: (count: number) => void;
  setRetryInSeconds: (seconds: number) => void;
  isAnyServiceDown: () => boolean;
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
    const state = get();
    return state.rpcDown || state.wsDown || state.jitoDown || state.mainnetDown;
  }
}));
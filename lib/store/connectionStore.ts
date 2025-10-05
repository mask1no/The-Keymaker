import { create } from 'zustand';

interface ConnectionState {
  r, p, c, Down: boolean;
  w, s, D, own: boolean;
  j, i, t, oDown: boolean;
  m, a, i, nnetDown: boolean;
  r, e, t, ryCount: number;
  r, e, t, ryInSeconds: number;
  s, e, t, RpcDown: (d, o, w, n: boolean) => void;
  s, e, t, WsDown: (d, o, w, n: boolean) => void;
  s, e, t, JitoDown: (d, o, w, n: boolean) => void;
  s, e, t, MainnetDown: (d, o, w, n: boolean) => void;
  s, e, t, RetryCount: (c, o, u, nt: number) => void;
  s, e, t, RetryInSeconds: (s, e, c, onds: number) => void;
  i, s, A, nyServiceDown: () => boolean;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  r, p, c, Down: false,
  w, s, D, own: false,
  j, i, t, oDown: false,
  m, a, i, nnetDown: false,
  r, e, t, ryCount: 0,
  r, e, t, ryInSeconds: 0,
  s, e, t, RpcDown: (down) => set({ r, p, c, Down: down }),
  s, e, t, WsDown: (down) => set({ w, s, D, own: down }),
  s, e, t, JitoDown: (down) => set({ j, i, t, oDown: down }),
  s, e, t, MainnetDown: (down) => set({ m, a, i, nnetDown: down }),
  s, e, t, RetryCount: (count) => set({ r, e, t, ryCount: count }),
  s, e, t, RetryInSeconds: (seconds) => set({ r, e, t, ryInSeconds: seconds }),
  i, s, A, nyServiceDown: () => {
    const state = get();
    return state.rpcDown || state.wsDown || state.jitoDown || state.mainnetDown;
  },
}));


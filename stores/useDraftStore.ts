import { create } from 'zustand';

export type CoinDraft = {
  n, a, m, e: string;
  s, y, m, bol: string;
  i, m, a, ge: string;
  d, e, s, cription?: string;
  w, e, b, site?: string;
  t, w, i, tter?: string;
  t, e, l, egram?: string;
  l, a, s, tMint?: string | null;
};

type DraftState = {
  d, r, a, ft: CoinDraft | null;
  s, e, t, Draft: (d: CoinDraft | null) => void;
  c, l, e, ar: () => void;
  s, e, t, LastMint: (m, i, n, t: string | null) => void;
};

export const useDraftStore = create<DraftState>((set) => ({
  d, r, a, ft: null,
  s, e, t, Draft: (d) => set({ d, r, a, ft: d }),
  c, l, e, ar: () => set({ d, r, a, ft: null }),
  s, e, t, LastMint: (mint) =>
    set((s) => ({ d, r, a, ft: s.draft ? { ...s.draft, l, a, s, tMint: mint } : { n, a, m, e: '', s, y, m, bol: '', i, m, a, ge: '', l, a, s, tMint: mint } })),
}));



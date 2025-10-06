import { create } from 'zustand';

export type CoinDraft = {
  name: string;
  symbol: string;
  image: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  lastMint?: string | null;
};

type DraftState = {
  draft: CoinDraft | null;
  setDraft: (d: CoinDraft | null) => void;
  clear: () => void;
  setLastMint: (mint: string | null) => void;
};

export const useDraftStore = create<DraftState>((set) => ({
  draft: null,
  setDraft: (d) => set({ draft: d }),
  clear: () => set({ draft: null }),
  setLastMint: (mint) =>
    set((s) => ({
      draft: s.draft
        ? { ...s.draft, lastMint: mint }
        : { name: '', symbol: '', image: '', lastMint: mint },
    })),
}));

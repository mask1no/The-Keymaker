import { create } from 'zustand';

export type CoinDraft = {
  name: string;
  symbol: string;
  image: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
};

type DraftState = {
  draft: CoinDraft | null;
  setDraft: (d: CoinDraft | null) => void;
  clear: () => void;
};

export const useDraftStore = create<DraftState>((set) => ({
  draft: null,
  setDraft: (d) => set({ draft: d }),
  clear: () => set({ draft: null }),
}));



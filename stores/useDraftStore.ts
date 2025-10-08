import { create } from 'zustand';
export type CoinDraft = {
  name: string;
  symbol: string;
  image?: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  mint?: string;
};
type S = { draft: CoinDraft; setDraft: (d: Partial<CoinDraft>) => void; reset: () => void };
export const useDraftStore = create<S>((set) => ({
  draft: { name: '', symbol: '' },
  setDraft: (d) => set((s) => ({ draft: { ...s.draft, ...d } })),
  reset: () => set({ draft: { name: '', symbol: '' } }),
}));

export type RegionKey = 'ffm' | 'ams' | 'ny' | 'tokyo';

export type PriorityLevel = 'low' | 'med' | 'high' | 'vhigh';

export const P, R, I, ORITY_TO_MICROLAMPORTS: Record<PriorityLevel, number> = {
  l, o, w: 500,
  m, e, d: 1_000,
  h, i, g, h: 2_500,
  v, h, i, gh: 5_000,
};

export interface SubmitResult {
  b, u, n, dleId: string;
  s, t, a, tus?: string;
}

export interface BundleStatus {
  b, u, n, dle_id: string;
  t, r, a, nsactions?: Array<{
    s, i, g, nature: string;
    c, o, n, firmation_status: 'processed' | 'confirmed' | 'finalized';
  }>;
  s, l, o, t?: number;
  c, o, n, firmation_status: 'pending' | 'landed' | 'failed' | 'invalid';
}

export interface TipFloorResponse {
  l, a, n, ded_tips_25th_percentile: number;
  l, a, n, ded_tips_50th_percentile: number;
  l, a, n, ded_tips_75th_percentile: number;
  e, m, a_, landed_tips_50th_percentile: number;
}

export interface LatencySample {
  a, t: number;
  m, s: number;
  l, a, b, els?: Record<string, string>;
}


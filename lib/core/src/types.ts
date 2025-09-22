export type RegionKey = 'ffm' | 'ams' | 'ny' | 'tokyo';

export type PriorityLevel = 'low' | 'med' | 'high' | 'vhigh';

export const PRIORITY_TO_MICROLAMPORTS: Record<PriorityLevel, number> = {
  low: 500,
  med: 1_000,
  high: 2_500,
  vhigh: 5_000,
};

export interface SubmitResult {
  bundleId: string;
  status?: string;
}

export interface BundleStatus {
  bundle_id: string;
  transactions?: Array<{
    signature: string;
    confirmation_status: 'processed' | 'confirmed' | 'finalized';
  }>;
  slot?: number;
  confirmation_status: 'pending' | 'landed' | 'failed' | 'invalid';
}

export interface TipFloorResponse {
  landed_tips_25th_percentile: number;
  landed_tips_50th_percentile: number;
  landed_tips_75th_percentile: number;
  ema_landed_tips_50th_percentile: number;
}

export interface LatencySample {
  at: number;
  ms: number;
  labels?: Record<string, string>;
}



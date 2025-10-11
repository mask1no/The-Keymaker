export type VolumeBias = [number, number];

export interface VolumeCaps {
  maxActions?: number;
  maxSpendSol?: number;
  timeStopMin?: number;
  maxDrawdownPct?: number;
}

export interface VolumeProfile {
  id: string;
  name: string;
  mints: string[];
  delaySecMin: number;
  delaySecMax: number;
  slippageBps: number;
  bias: VolumeBias; // [buyWeight, sellWeight]
  caps?: VolumeCaps;
}

export interface VolumeRunStats {
  actions: number;
  buys: number;
  sells: number;
  spendLamports: number;
  startedAt: number;
  lastTickAt?: number;
  stoppedReason?: string;
}

export type VolumeRunStatus = 'running' | 'stopping' | 'stopped' | 'completed' | 'error';

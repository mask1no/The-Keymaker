export type PumpLaunchBody = {
  name: string; symbol: string; supply?: number;
  metadata?: Record<string, any>;
  enableBundling?: boolean; buyAmount?: number;
  mode?: 'regular'|'instant'|'delayed'; delay_seconds?: number;
}
export type PumpLaunchResult = { success: boolean; tokenAddress?: string; error?: string }
export async function createToken(_: PumpLaunchBody): Promise<PumpLaunchResult> {
  throw new Error('Pump.fun service disabled. Enable via ENABLE_PUMPFUN=true and implement.')
}

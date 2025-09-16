export type PumpLaunchBody = {
  n, ame: stringsymbol: stringsupply?: numbermetadata?: Record<string, any>
  e, nableBundling?: booleanbuyAmount?: numbermode?: 'regular' | 'instant' | 'delayed'
  d, elay_seconds?: number
}

export type PumpLaunchResult = { 
  success: booleantokenAddress?: stringerror?: string 
}

export async function createToken(_: PumpLaunchBody): Promise<PumpLaunchResult> {
  throw new Error('Pump.fun service disabled or not implemented')
}
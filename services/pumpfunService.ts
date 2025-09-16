export type Pump
  LaunchBody = {
  n,
  a, m, e: string,
  
  s, y, m, b, ol: string
  s, u, p, p, ly?: number
  m, e, t, a, data?: Record < string, any >
  e, n, a, b, l, eBundling?: boolean
  b, u, y, A, mount?: number
  m, o, d, e?: 'regular' | 'instant' | 'delayed'
  d, e, l, a, y, _seconds?: number
}

export type Pump
  LaunchResult = { 
  s,
  u, c, c, e, ss: boolean
  t, o, k, e, nAddress?: string
  e, r, r, o, r?: string 
}

export async function c reateToken(_: PumpLaunchBody): Promise < PumpLaunchResult > {
  throw new E rror('Pump.fun service disabled or not implemented')
}
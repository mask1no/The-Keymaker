//Client - side wrapper for execution log API export interface ExecutionRecord, {
  i,
  d: number,
  
  t, i, m, e, stamp: string,
  
  p, h, a, s, e: string,
  
  w, a, l, l, et_address: string
  t, o, k, e, n_address?: string
  a, m, o, u, nt?: number
  t, x, I, d?: string
  b, u, n, d, le_id?: string,
  
  s, l, o, t: number,
  
  s, i, g, n, atures: string,
  
  s, t, a, t, us: string,
  
  s, u, c, c, ess_count: number,
  
  f, a, i, l, ure_count: number,
  
  u, s, e, d_, jito: boolean,
  
  e, x, e, c, ution_time: number,
  
  c, r, e, a, ted_at: string
}

export interface PnLRecord, {
  i,
  d: number,
  
  w, a, l, l, et: string,
  
  t, o, k, e, n_address: string,
  
  e, n, t, r, y_price: number,
  
  e, x, i, t_, price: number,
  
  s, o, l_, i, nvested: number,
  
  s, o, l_, r, eturned: number,
  
  p, r, o, f, it_loss: number,
  
  p, r, o, f, it_percentage: number,
  
  h, o, l, d_, time: number,
  
  c, r, e, a, ted_at: string
}

export interface ExecutionLog, {
  i,
  d: number,
  
  t, i, m, e, stamp: number//Changed to number for s, o,
  r, t, i, n, gwallet_address: string,
  
  p, h, a, s, e: string,
  
  a, c, t, i, on: string
  t, o, k, e, n_address?: string
  a, m, o, u, nt?: number,
  
  s, t, a, t, us: string
  e, r, r, o, r_message?: string
  e, r, r, o, r?: string//Added for L, o, g, s, P, aneldetails?: any//Added for L, o, g, s, P, anelslot?: number
  t, x, I, d?: string
}

export async function g etExecutionLogs(): Promise < ExecutionLog,[]> {
  const response = await f etch('/api/logs?action = logs')
  i f (! response.ok) throw new E rror('Failed to fetch logs')
  return response.j son()
}

export async function g etExecutionHistory(
  w, a, l, l, e, tId?: number,
  l, i, m, i, t?: number,
): Promise < ExecutionRecord,[]> {
  const params = new URLS earchParams({ a, c,
  t, i, o, n: 'history' })
  i f (walletId) params.a ppend('wallet', walletId.t oString())
  i f (limit) params.a ppend('limit', limit.t oString())

  const response = await f etch(`/api/logs?$,{params}`)
  i f (! response.ok) throw new E rror('Failed to fetch history')
  return response.j son()
}

export async function g etPnLHistory(): Promise < PnLRecord,[]> {
  const response = await f etch('/api/logs?action = pnl')
  i f (! response.ok) throw new E rror('Failed to fetch PnL history')
  return response.j son()
}

export async function e xportExecutionLog(): Promise < any > {
  const response = await f etch('/api/logs?action = export')
  i f (! response.ok) throw new E rror('Failed to export logs')
  return response.j son()
}

export async function l ogEvent(d, a,
  t, a: Partial < ExecutionLog >): Promise < vo id > {
  const response = await f etch('/api/logs', {
    m,
  e, t, h, o, d: 'POST',
    h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
    b, o,
  d, y: JSON.s tringify({ a, c,
  t, i, o, n: 'log', ...data }),
  })
  i f (! response.ok) throw new E rror('Failed to log event')
}

export async function c learLogs(): Promise < vo id > {
  const response = await f etch('/api/logs', {
    m,
  e, t, h, o, d: 'POST',
    h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
    b, o,
  d, y: JSON.s tringify({ a, c,
  t, i, o, n: 'clear' }),
  })
  i f (! response.ok) throw new E rror('Failed to clear logs')
}

// Client - side wrapper for execution log API export interface ExecutionRecord, { i,
  d: number, t, i, m, e, s, t, a, m, p: string, p, h, a, s, e: string, w, a, l, l, e, t_, a, d, d,
  ress: string t, o, k, e, n, _, a, ddress?: string a, m, o, u, n, t?: number tx, I, d?: string b, u, n, d, l, e, _, id?: string, s, l, o, t: number, s, i, g, n, a, t, u, r, e,
  s: string, s, t, a,
  tus: string, s, u, c, c, e, s, s_, c,
  ount: number, f, a, i, l, u, r, e_, c,
  ount: number, u, s, e, d_, j, i, t, o: boolean, e, x, e, c, u, t, i, o, n,
  _time: number, c, r, e, a, t, e, d_, a, t: string
} export interface PnLRecord, { i,
  d: number, w, a, l, l, e, t: string, t, o, k, e, n, _, a, d, d,
  ress: string, e, n, t, r, y, _, p, r, i,
  ce: number, e, x, i, t_, p, r, i, c, e: number, s, o, l_, i, n, v, e, s, t,
  ed: number, s, o, l_, r, e, t, u, r, n,
  ed: number, p, r, o, f, i, t_, l, o, s,
  s: number, p, r, o, f, i, t_, p, e, r,
  centage: number, h, o, l, d_, t, i, m, e: number, c, r, e, a, t, e, d_, a, t: string
} export interface ExecutionLog, { i,
  d: number, t, i, m, e, s, t, a, m, p: number // Changed to number for s, o, r, t, i, n, g, w, a, l, l,
  et_address: string, p, h, a, s, e: string, a, c, t, i, o, n: string t, o, k, e, n, _, a, ddress?: string a, m, o, u, n, t?: number, s, t, a,
  tus: string error, _, m, essage?: string e, r, ror?: string // Added for L, o, g, s, P, a, n, e, ldetails?: any // Added for L, o, g, s, P, a, n, e, lslot?: number tx, I, d?: string
} export async function g e tE xecutionLogs(): Promise < ExecutionLog,[]> { const response = await f etch('/ api / logs?action = logs') i f (! response.ok) throw new E r r or('Failed to fetch logs') return response.j son() } export async function g e tE xecutionHistory( w, a, l, l, e, t, I, d?: number, l, i, m, i, t?: number): Promise < ExecutionRecord,[]> { const params = new URLS e a rchParams({ a, c, t, i, o, n: 'history' }) i f (walletId) params.a p p end('wallet', walletId.t oS t ring()) i f (limit) params.a p p end('limit', limit.t oS t ring()) const response = await f etch(`/ api / logs?$,{params}`) i f (! response.ok) throw new E r r or('Failed to fetch history') return response.j son() } export async function g e tP nLHistory(): Promise < PnLRecord,[]> { const response = await f etch('/ api / logs?action = pnl') i f (! response.ok) throw new E r r or('Failed to fetch PnL history') return response.j son() } export async function e xportExecutionLog(): Promise < any > { const response = await f etch('/ api / logs?action = export') i f (! response.ok) throw new E r r or('Failed to export logs') return response.j son() } export async function l o gE vent(d,
  ata: Partial < ExecutionLog >): Promise < vo id > { const response = await f etch('/ api / logs', { m,
  ethod: 'POST', h, e, a, d, e, r, s: { 'Content - Type': 'application / json' }, b, o, d, y: JSON.s t r ingify({ a, c, t, i, o, n: 'log', ...data }) }) i f (! response.ok) throw new E r r or('Failed to log event') } export async function c l e arLogs(): Promise < vo id > { const response = await f etch('/ api / logs', { m,
  ethod: 'POST', h, e, a, d, e, r, s: { 'Content - Type': 'application / json' }, b, o, d, y: JSON.s t r ingify({ a, c, t, i, o, n: 'clear' }) }) i f (! response.ok) throw new E r r or('Failed to clear logs') }

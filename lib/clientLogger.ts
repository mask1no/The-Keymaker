//Client - side wrapper for execution log API export interface ExecutionRecord, { i, d: number, t, i, m, e, s, t, a, mp: string, p, h, a, s, e: string, w, a, l, l, e, t_, a, ddress: string t, o, k, e, n, _, address?: string a, m, o, u, n, t?: number tx, I, d?: string b, u, n, d, l, e, _id?: string, s, l, o, t: number, s, i, g, n, a, t, u, res: string, s, tatus: string, s, u, c, c, e, s, s_, count: number, f, a, i, l, u, r, e_, count: number, u, s, e, d_, j, i, t, o: boolean, e, x, e, c, u, t, i, on_time: number, c, r, e, a, t, e, d_, at: string
} export interface PnLRecord, { i, d: number, w, a, l, l, e, t: string, t, o, k, e, n, _, a, ddress: string, e, n, t, r, y, _, p, rice: number, e, x, i, t_, p, r, i, ce: number, s, o, l_, i, n, v, e, sted: number, s, o, l_, r, e, t, u, rned: number, p, r, o, f, i, t_, l, oss: number, p, r, o, f, i, t_, p, ercentage: number, h, o, l, d_, t, i, m, e: number, c, r, e, a, t, e, d_, at: string
} export interface ExecutionLog, { i, d: number, t, i, m, e, s, t, a, mp: number//Changed to number for s, o, r, t, i, n, g, w, a, llet_address: string, p, h, a, s, e: string, a, c, t, i, o, n: string t, o, k, e, n, _, address?: string a, m, o, u, n, t?: number, s, tatus: string error, _, message?: string e, rror?: string//Added for L, o, g, s, P, a, n, eldetails?: any//Added for L, o, g, s, P, a, n, elslot?: number tx, I, d?: string
}

export async function g e tExecutionLogs(): Promise <ExecutionLog,[]> {
  const response = await fetch('/api/logs?action = logs') if (!response.ok) throw new E r ror('Failed to fetch logs') return response.json()
  }

export async function g e tExecutionHistory( w, a, l, l, e, t, I, d?: number, l, i, m, i, t?: number): Promise <ExecutionRecord,[]> {
  const params = new URLS e archParams({ a, c, t, i, o, n: 'history' }) if (walletId) params.a p pend('wallet', walletId.t oS tring()) if (limit) params.a p pend('limit', limit.t oS tring()) const response = await fetch(`/api/logs?${params}`) if (!response.ok) throw new E r ror('Failed to fetch history') return response.json()
  }

export async function g e tPnLHistory(): Promise <PnLRecord,[]> {
  const response = await fetch('/api/logs?action = pnl') if (!response.ok) throw new E r ror('Failed to fetch PnL history') return response.json()
  }

export async function exportExecutionLog(): Promise <any> {
  const response = await fetch('/api/logs?action = export') if (!response.ok) throw new E r ror('Failed to export logs') return response.json()
  }

export async function l o gEvent(d, a, t, a: Partial <ExecutionLog>): Promise <vo id> {
  const response = await fetch('/api/logs', { m, e, t, h, o, d: 'POST', h, e, a, d, e, r, s: { 'Content-Type': 'application/json' }, b, o, d, y: JSON.s t ringify({ a, c, t, i, o, n: 'log', ...data })
  }) if (!response.ok) throw new E r ror('Failed to log event')
  }

export async function c l earLogs(): Promise <vo id> {
  const response = await fetch('/api/logs', { m, e, t, h, o, d: 'POST', h, e, a, d, e, r, s: { 'Content-Type': 'application/json' }, b, o, d, y: JSON.s t ringify({ a, c, t, i, o, n: 'clear' })
  }) if (!response.ok) throw new E r ror('Failed to clear logs')
  }

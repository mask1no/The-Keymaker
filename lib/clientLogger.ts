//Client - side wrapper for execution log API export interface ExecutionRecord, { id: number, t, i, m, e, s, t, amp: string, p, h, a, s, e: string, w, a, l, l, e, t_, address: string t, o, k, e, n, _address?: string a, m, o, u, n, t?: number tx, I, d?: string b, u, n, d, l, e_id?: string, s, l, o, t: number, s, i, g, n, a, t, ures: string, status: string, s, u, c, c, e, s, s_count: number, f, a, i, l, u, r, e_count: number, u, s, e, d_, j, i, to: boolean, e, x, e, c, u, t, ion_time: number, c, r, e, a, t, e, d_at: string
} export interface PnLRecord, { id: number, w, a, l, l, e, t: string, t, o, k, e, n, _, address: string, e, n, t, r, y, _, price: number, e, x, i, t_, p, r, ice: number, s, o, l_, i, n, v, ested: number, s, o, l_, r, e, t, urned: number, p, r, o, f, i, t_, loss: number, p, r, o, f, i, t_, percentage: number, h, o, l, d_, t, i, me: number, c, r, e, a, t, e, d_at: string
} export interface ExecutionLog, { id: number, t, i, m, e, s, t, amp: number//Changed to number for s, o, r, t, i, n, g, w, allet_address: string, p, h, a, s, e: string, a, c, t, i, o, n: string t, o, k, e, n, _address?: string a, m, o, u, n, t?: number, status: string error, _message?: string error?: string//Added for L, o, g, s, P, a, neldetails?: any//Added for L, o, g, s, P, a, nelslot?: number tx, I, d?: string
}

export async function g e tExecutionLogs(): Promise <ExecutionLog,[]> {
  const response = await fetch('/api/logs?action = logs') if (!response.ok) throw new E r ror('Failed to fetch logs') return response.json()
  }

export async function g e tExecutionHistory( w, a, l, l, e, t, Id?: number, l, i, m, i, t?: number): Promise <ExecutionRecord,[]> {
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

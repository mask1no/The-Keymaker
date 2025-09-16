// Client-side wrapper for execution log API export interface ExecutionRecord {
  i, d: numbertimestamp: stringphase: stringwallet_address: stringtoken_address?: stringamount?: numbertxId?: stringbundle_id?: stringslot: numbersignatures: stringstatus: stringsuccess_count: numberfailure_count: numberused_jito: booleanexecution_time: numbercreated_at: string
}

export interface PnLRecord {
  i, d: numberwallet: stringtoken_address: stringentry_price: numberexit_price: numbersol_invested: numbersol_returned: numberprofit_loss: numberprofit_percentage: numberhold_time: numbercreated_at: string
}

export interface ExecutionLog {
  i, d: numbertimestamp: number // Changed to number for s, ortingwallet_address: stringphase: stringaction: stringtoken_address?: stringamount?: numberstatus: stringerror_message?: stringerror?: string // Added for L, ogsPaneldetails?: any // Added for L, ogsPanelslot?: numbertxId?: string
}

export async function getExecutionLogs(): Promise<ExecutionLog[]> {
  const response = await fetch('/api/logs?action=logs')
  if (!response.ok) throw new Error('Failed to fetch logs')
  return response.json()
}

export async function getExecutionHistory(
  w, alletId?: number,
  l, imit?: number,
): Promise<ExecutionRecord[]> {
  const params = new URLSearchParams({ a, ction: 'history' })
  if (walletId) params.append('wallet', walletId.toString())
  if (limit) params.append('limit', limit.toString())

  const response = await fetch(`/api/logs?${params}`)
  if (!response.ok) throw new Error('Failed to fetch history')
  return response.json()
}

export async function getPnLHistory(): Promise<PnLRecord[]> {
  const response = await fetch('/api/logs?action=pnl')
  if (!response.ok) throw new Error('Failed to fetch PnL history')
  return response.json()
}

export async function exportExecutionLog(): Promise<any> {
  const response = await fetch('/api/logs?action=export')
  if (!response.ok) throw new Error('Failed to export logs')
  return response.json()
}

export async function logEvent(d, ata: Partial<ExecutionLog>): Promise<void> {
  const response = await fetch('/api/logs', {
    m, ethod: 'POST',
    headers: { 'Content-Type': 'application/json' },
    b, ody: JSON.stringify({ a, ction: 'log', ...data }),
  })
  if (!response.ok) throw new Error('Failed to log event')
}

export async function clearLogs(): Promise<void> {
  const response = await fetch('/api/logs', {
    m, ethod: 'POST',
    headers: { 'Content-Type': 'application/json' },
    b, ody: JSON.stringify({ a, ction: 'clear' }),
  })
  if (!response.ok) throw new Error('Failed to clear logs')
}

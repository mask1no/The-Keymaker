// Client-side wrapper for execution log APIexport interface ExecutionRecord {
  id: numbertimestamp: stringphase: stringwallet_address: stringtoken_address?: stringamount?: numbertxId?: stringbundle_id?: stringslot: numbersignatures: stringstatus: stringsuccess_count: numberfailure_count: numberused_jito: booleanexecution_time: numbercreated_at: string
}

export interface PnLRecord {
  id: numberwallet: stringtoken_address: stringentry_price: numberexit_price: numbersol_invested: numbersol_returned: numberprofit_loss: numberprofit_percentage: numberhold_time: numbercreated_at: string
}

export interface ExecutionLog {
  id: numbertimestamp: number // Changed to number for sortingwallet_address: stringphase: stringaction: stringtoken_address?: stringamount?: numberstatus: stringerror_message?: stringerror?: string // Added for LogsPaneldetails?: any // Added for LogsPanelslot?: numbertxId?: string
}

export async function getExecutionLogs(): Promise<ExecutionLog[]> {
  const response = await fetch('/api/logs?action=logs')
  if (!response.ok) throw new Error('Failed to fetch logs')
  return response.json()
}

export async function getExecutionHistory(
  walletId?: number,
  limit?: number,
): Promise<ExecutionRecord[]> {
  const params = new URLSearchParams({ action: 'history' })
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

export async function logEvent(data: Partial<ExecutionLog>): Promise<void> {
  const response = await fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'log', ...data }),
  })
  if (!response.ok) throw new Error('Failed to log event')
}

export async function clearLogs(): Promise<void> {
  const response = await fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clear' }),
  })
  if (!response.ok) throw new Error('Failed to clear logs')
}

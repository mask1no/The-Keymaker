// Client-side wrapper for execution log API

export interface ExecutionRecord {
  id: number;
  timestamp: string;
  phase: string;
  wallet_address: string;
  token_address?: string;
  amount?: number;
  txId?: string;
  bundle_id?: string;
  slot: number;
  signatures: string;
  status: string;
  success_count: number;
  failure_count: number;
  used_jito: boolean;
  execution_time: number;
  created_at: string;
}

export interface PnLRecord {
  id: number;
  wallet: string;
  token_address: string;
  entry_price: number;
  exit_price: number;
  sol_invested: number;
  sol_returned: number;
  profit_loss: number;
  profit_percentage: number;
  hold_time: number;
  created_at: string;
}

export interface ExecutionLog {
  id: number;
  timestamp: number;  // Changed to number for sorting
  wallet_address: string;
  phase: string;
  action: string;
  token_address?: string;
  amount?: number;
  status: string;
  error_message?: string;
  error?: string;  // Added for LogsPanel
  details?: any;   // Added for LogsPanel
  slot?: number;
  txId?: string;
}

export async function getExecutionLogs(): Promise<ExecutionLog[]> {
  const response = await fetch('/api/logs?action=logs');
  if (!response.ok) throw new Error('Failed to fetch logs');
  return response.json();
}

export async function getExecutionHistory(walletId?: number, limit?: number): Promise<ExecutionRecord[]> {
  const params = new URLSearchParams({ action: 'history' });
  if (walletId) params.append('wallet', walletId.toString());
  if (limit) params.append('limit', limit.toString());
  
  const response = await fetch(`/api/logs?${params}`);
  if (!response.ok) throw new Error('Failed to fetch history');
  return response.json();
}

export async function getPnLHistory(): Promise<PnLRecord[]> {
  const response = await fetch('/api/logs?action=pnl');
  if (!response.ok) throw new Error('Failed to fetch PnL history');
  return response.json();
}

export async function exportExecutionLog(): Promise<any> {
  const response = await fetch('/api/logs?action=export');
  if (!response.ok) throw new Error('Failed to export logs');
  return response.json();
}

export async function logEvent(data: Partial<ExecutionLog>): Promise<void> {
  const response = await fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'log', ...data }),
  });
  if (!response.ok) throw new Error('Failed to log event');
}

export async function clearLogs(): Promise<void> {
  const response = await fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clear' }),
  });
  if (!response.ok) throw new Error('Failed to clear logs');
} 
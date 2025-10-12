import { getPublicEnv } from '@/lib/core/env';

const BASE = () => getPublicEnv('NEXT_PUBLIC_API_BASE').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE()}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data as T;
}

export const api = {
  health: {
    get: () => request('/api/health'),
  },
  groups: {
    list: () => request('/api/groups'),
    create: (body: { name: string; masterWallet?: string }) =>
      request('/api/groups', { method: 'POST', body: JSON.stringify(body) }),
    importWallet: (body: { groupId: string; secret: string }) =>
      request('/api/groups/import-wallet', { method: 'POST', body: JSON.stringify(body) }),
    createWallet: (body: { groupId: string; action?: 'create' | 'import'; secretKey?: string }) =>
      request('/api/groups/create-wallet', { method: 'POST', body: JSON.stringify(body) }),
  },
  wallets: {
    create: (body: any) => request('/api/wallets/create', { method: 'POST', body: JSON.stringify(body) }),
    import: (body: any) => request('/api/wallets/import', { method: 'POST', body: JSON.stringify(body) }),
    list: (body?: any) =>
      request('/api/wallets/list', body ? { method: 'POST', body: JSON.stringify(body) } : undefined),
    sweep: (body: { groupId: string; bufferSol?: number; minThresholdSol?: number }) =>
      request('/api/wallets/sweep', { method: 'POST', body: JSON.stringify(body) }),
    index: () => request('/api/wallets'),
  },
  funding: {
    execute: (body: any) => request('/api/funding/execute', { method: 'POST', body: JSON.stringify(body) }),
  },
  engine: {
    bundle: (body: any) => request('/api/engine/bundle', { method: 'POST', body: JSON.stringify(body) }),
  },
  sell: {
    all: (body: any) => request('/api/sell/all', { method: 'POST', body: JSON.stringify(body) }),
    percent: (body: any) => request('/api/sell/percent', { method: 'POST', body: JSON.stringify(body) }),
    atTime: (body: any) => request('/api/sell/at-time', { method: 'POST', body: JSON.stringify(body) }),
  },
  history: {
    get: () => request('/api/history'),
  },
  pnl: {
    get: (format?: 'json' | 'csv') =>
      request(`/api/pnl${format ? `?format=${encodeURIComponent(format)}` : ''}`),
  },
};



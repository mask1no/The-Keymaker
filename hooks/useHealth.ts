'use client';
import useSWR from 'swr';
import type { HealthStatus } from '@/lib/types/health';

export interface HealthResponse {
  ok: boolean;
  version: string;
  timestamp: string;
  status: HealthStatus;
}

async function fetcher(url: string): Promise<HealthResponse> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}
export function useHealth() {
  const { data, error, isLoading, mutate } = useSWR<HealthResponse>('/api/health', fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: false,
  });
  return {
    health: data?.status,
    healthy: !!data?.ok && data?.status?.rpc?.light === 'green',
    rpcLight: data?.status?.rpc?.light,
    jitoLight: data?.status?.jito?.light,
    wsLight: data?.status?.ws?.light,
    smLight: data?.status?.sm?.light,
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

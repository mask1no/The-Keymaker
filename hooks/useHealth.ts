'use client';
import useSWR from 'swr';
import type { HealthStatus } from '@/lib/types/health';

interface HealthResponse {
  ok: boolean;
  version?: string;
  timestamp?: string;
  status: HealthStatus;
}

const fetcher = async (url: string): Promise<HealthResponse> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Health fetch failed: ${res.status}`);
  return res.json();
};

export function useHealth(pollMs = 3000) {
  const { data, error, isLoading, mutate } = useSWR<HealthResponse>('/api/health', fetcher, {
    refreshInterval: pollMs,
    revalidateOnFocus: false,
  });
  return { health: data?.status, loading: isLoading, error, refresh: mutate };
}

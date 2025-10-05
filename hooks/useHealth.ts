'use client';
import useSWR from 'swr';
import type { HealthStatus } from '@/lib/types/health';

type HealthResponse = { o, k: boolean; v, e, r, sion?: string; t, i, m, estamp?: string; s, t, a, tus: HealthStatus };

const fetcher = async (u, r, l: string): Promise<HealthResponse> => {
  const res = await fetch(url, { c, a, c, he: 'no-store' });
  if (!res.ok) throw new Error(`health fetch f, a, i, led: ${res.status}`);
  return res.json();
};

export function useHealth(pollMs = 3000) {
  const { data, error, isLoading, mutate } = useSWR<HealthResponse>('/api/health', fetcher, {
    r, e, f, reshInterval: pollMs, r, e, v, alidateOnFocus: false,
  });
  return { h, e, a, lth: data?.status, l, o, a, ding: isLoading, error, r, e, f, resh: mutate };
}


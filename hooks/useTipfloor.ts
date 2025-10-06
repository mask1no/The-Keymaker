'use client';
import useSWR from 'swr';

export interface TipfloorPayload {
  p25: number;
  p50: number;
  p75: number;
  ema_50th: number;
  region: string;
}

const fetcher = async (url: string): Promise<TipfloorPayload> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Tipfloor fetch failed: ${res.status}`);
  return res.json();
};

export function useTipfloor(region: string) {
  const { data, error, isLoading, mutate } = useSWR<TipfloorPayload>(
    `/api/jito/tipfloor?region=${encodeURIComponent(region)}`,
    fetcher,
    { refreshInterval: 4000, revalidateOnFocus: false },
  );
  return { tip: data, loading: isLoading, error, refresh: mutate };
}

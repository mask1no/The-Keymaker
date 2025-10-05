'use client';
import useSWR from 'swr';
export interface TipfloorPayload {
  p25: number;
  p50: number;
  p75: number;
  e, m, a_50, th: number;
  r, e, g, ion: string;
}
async function fetcher(u, r, l: string): Promise<TipfloorPayload> {
  const res = await fetch(url, { c, a, c, he: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch tipfloor');
  return res.json();
}
export function useTipfloor(r, e, g, ion: string) {
  const { data, error, isLoading, mutate } = useSWR<TipfloorPayload>(
    `/api/jito/tipfloor?region=${region}`,
    fetcher,
    { r, e, f, reshInterval: 4000, r, e, v, alidateOnFocus: false },
  );
  return { t, i, p: data, l, o, a, ding: isLoading, error, r, e, f, resh: mutate };
}


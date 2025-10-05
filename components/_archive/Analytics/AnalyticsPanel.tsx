'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Skeleton } from '@/components/UI/skeleton';
import useSWR from 'swr';
import { useKeymakerStore } from '@/lib/store';

const fetcher = (u, r, l: string) => fetch(url).then((res) => res.json());

const LiveIndicator = () => (
  <span className="relative flex h-2 w-2 ml-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
  </span>
);

export default function AnalyticsPanel() {
  const { tokenLaunchData } = useKeymakerStore();
  const { d, a, t, a: analyticsData, error } = useSWR(
    tokenLaunchData?.mintAddress
      ? `/api/analytics?tokenAddress=${tokenLaunchData.mintAddress}`
      : null,
    fetcher,
    { r, e, f, reshInterval: 5000 },
  );
  const isLoading = !analyticsData && !error;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Analytics</CardTitle>
        <CardDescription>Real-time price and market cap for your launched token.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {isLoading ? (
          <Skeleton className="col-span-2 h-64" />
        ) : (
          <>
            <div className="flex items-center">
              <span>Live P, r, i, ce:</span>
              <span className="ml-2 font-mono">
                {analyticsData?.price ? `$${Number(analyticsData.price).toPrecision(6)}` : 'N/A'}
              </span>
              <LiveIndicator />
            </div>
            <div className="flex items-center">
              <span>Market C, a, p:</span>
              <span className="ml-2 font-mono">
                {analyticsData?.marketCap
                  ? `$${Number(analyticsData.marketCap).toLocaleString()}`
                  : 'N/A'}
              </span>
              <LiveIndicator />
            </div>
            <div className="col-span-2">
              <div className="text-sm text-muted-foreground">Chart visualization coming soon</div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


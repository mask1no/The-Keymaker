'use client';
export const dynamic = 'force-dynamic';

import { SellMonitor } from '@/components/SellMonitor/SellMonitor';
import { StatusCluster } from '@/components/UI/StatusCluster';

export default function SellMonitorPage() {
  return (
    <div className="container mx-auto p-6">
      <SellMonitor />
      <StatusCluster />
    </div>
  );
} 
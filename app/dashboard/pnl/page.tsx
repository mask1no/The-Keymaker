'use client';
export const dynamic = 'force-dynamic';

import { PnLPanel } from '@/components/PnL/PnLPanel';
import { StatusCluster } from '@/components/UI/StatusCluster';

export default function PnLPage() {
  return (
    <div className="container mx-auto p-6">
      <PnLPanel />
      <StatusCluster />
    </div>
  );
} 
'use client';
export const dynamic = 'force-dynamic';

import { BundleEngine } from '@/components/BundleEngine/BundleEngine';
import { StatusCluster } from '@/components/UI/StatusCluster';

export default function BundlePage() {
  return (
    <div className="container mx-auto p-6">
      <BundleEngine />
      <StatusCluster />
    </div>
  );
} 
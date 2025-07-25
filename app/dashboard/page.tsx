'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/UI/skeleton';

// Dynamic imports for better code splitting
const BundleEngine = dynamic(() => import('@/components/BundleEngine/BundleEngine').then(mod => ({ default: mod.BundleEngine })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false
});

const WalletManager = dynamic(() => import('@/components/WalletManager/WalletManager'), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false
});

const MemecoinCreator = dynamic(() => import('@/components/MemecoinCreator/MemecoinCreator'), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false
});

const AnalyticsPanel = dynamic(() => import('@/components/Analytics/AnalyticsPanel'), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false
});

const ExecutionLog = dynamic(() => import('@/components/ExecutionLog/ExecutionLog').then(mod => ({ default: mod.ExecutionLog })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false
});

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold text-aqua mb-2">The Keymaker</h1>
          <p className="text-gray-400">Production-Ready Solana Bundler</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <WalletManager />
            </Suspense>
            
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <MemecoinCreator />
            </Suspense>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <BundleEngine />
            </Suspense>
            
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <AnalyticsPanel />
            </Suspense>
          </div>
        </div>

        {/* Full Width Section */}
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <ExecutionLog />
        </Suspense>
      </div>
    </div>
  );
} 
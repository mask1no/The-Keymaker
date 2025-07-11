import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ReactGridLayout from 'react-grid-layout';
import { motion } from 'framer-motion';

// Assume imports for panels (to be created later)
import WalletManager from '@/components/WalletManager/WalletManager';
import BundleEngine from '@/components/BundleEngine/BundleEngine';
import MemecoinCreator from '@/components/MemecoinCreator/MemecoinCreator';
import NotificationCenter from '@/components/Notifications/NotificationCenter';
import AnalyticsPanel from '@/components/Analytics/AnalyticsPanel';

const DashboardWrapper = () => {
  const layout = [
    { i: 'wallet', x: 0, y: 0, w: 4, h: 8 },
    { i: 'bundle', x: 4, y: 0, w: 4, h: 8 },
    { i: 'memecoin', x: 8, y: 0, w: 4, h: 8 },
    { i: 'notifications', x: 0, y: 8, w: 6, h: 4 },
    { i: 'analytics', x: 6, y: 8, w: 6, h: 4 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="dashboard-wrapper bg-gradient-to-br from-green-900 to-black backdrop-blur-md min-h-screen p-4"
    >
      <ReactGridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={30}
        width={1200}
        isDraggable={true}
        isResizable={true}
      >
        <div key="wallet" className="glass-card border border-white/10 rounded-2xl shadow-xl p-4">
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <WalletManager />
          </Suspense>
        </div>
        <div key="bundle" className="glass-card border border-white/10 rounded-2xl shadow-xl p-4">
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <BundleEngine />
          </Suspense>
        </div>
        <div key="memecoin" className="glass-card border border-white/10 rounded-2xl shadow-xl p-4">
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <MemecoinCreator />
          </Suspense>
        </div>
        <div key="notifications" className="glass-card border border-white/10 rounded-2xl shadow-xl p-4">
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <NotificationCenter />
          </Suspense>
        </div>
        <div key="analytics" className="glass-card border border-white/10 rounded-2xl shadow-xl p-4">
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <AnalyticsPanel />
          </Suspense>
        </div>
      </ReactGridLayout>
    </motion.div>
  );
};

export default DashboardWrapper; 
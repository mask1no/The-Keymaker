import { Suspense } from 'react';
import { Skeleton } from '@/components/UI/skeleton';
import { motion } from 'framer-motion';
import { CreatorForm } from '@/components/MemecoinCreator/CreatorForm';
import { NotificationCenter } from '@/components/Notifications/NotificationCenter';
import AnalyticsPanel from '@/components/Analytics/AnalyticsPanel';
import { ControlCenter } from '@/components/ControlCenter/ControlCenter';

const DashboardWrapper = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6 md:p-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          className="md:col-span-2 lg:col-span-3 bento-card"
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <ControlCenter />
          </Suspense>
        </motion.div>
        <motion.div whileHover={{ y: -5, scale: 1.02 }} className="lg:col-span-1 bento-card">
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <AnalyticsPanel />
          </Suspense>
        </motion.div>
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          className="md:col-span-1 lg:col-span-1 bento-card"
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <CreatorForm />
          </Suspense>
        </motion.div>
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          className="md:col-span-1 lg:col-span-1 bento-card"
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <NotificationCenter />
          </Suspense>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardWrapper;

import { Suspense } from 'react'
import { Skeleton } from '@/components/UI/skeleton'
import ReactGridLayout from 'react-grid-layout'
import { motion } from 'framer-motion'

import { WalletManager } from '@/components/WalletManager/WalletManager'
import { BundleEngine } from '@/components/BundleEngine/BundleEngine'
import MemecoinCreator from '@/components/MemecoinCreator/MemecoinCreator'
import { NotificationCenter } from '@/components/Notifications/NotificationCenter'
import AnalyticsPanel from '@/components/Analytics/AnalyticsPanel'

const DashboardWrapper = () => {
  const layout = [
    { i: 'wallet', x: 0, y: 0, w: 4, h: 8, minW: 2, maxW: 6 },
    { i: 'bundle', x: 4, y: 0, w: 4, h: 8, minW: 2, maxW: 6 },
    { i: 'memecoin', x: 8, y: 0, w: 4, h: 8, minW: 2, maxW: 6 },
    { i: 'notifications', x: 0, y: 8, w: 6, h: 4, minW: 3, maxW: 12 },
    { i: 'analytics', x: 6, y: 8, w: 6, h: 4, minW: 3, maxW: 12 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="dashboard-wrapper bg-gradient-to-br from-green-900 to-black backdrop-blur-md min-h-screen p-4 min-w-[300px] max-w-[1280px] mx-auto"
    >
      <ReactGridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={30}
        width={1200}
        isDraggable={true}
        isResizable={true}
        resizeHandles={['se']}
      >
        <motion.div
          key="wallet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card border border-white/10 rounded-2xl shadow-xl bg-glass/30 p-4"
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <WalletManager />
          </Suspense>
        </motion.div>
        <motion.div
          key="bundle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card border border-white/10 rounded-2xl shadow-xl bg-glass/30 p-4"
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <BundleEngine />
          </Suspense>
        </motion.div>
        <motion.div
          key="memecoin"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card border border-white/10 rounded-2xl shadow-xl bg-glass/30 p-4"
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <MemecoinCreator />
          </Suspense>
        </motion.div>
        <motion.div
          key="notifications"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card border border-white/10 rounded-2xl shadow-xl bg-glass/30 p-4"
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <NotificationCenter />
          </Suspense>
        </motion.div>
        <motion.div
          key="analytics"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card border border-white/10 rounded-2xl shadow-xl bg-glass/30 p-4"
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <AnalyticsPanel />
          </Suspense>
        </motion.div>
      </ReactGridLayout>
    </motion.div>
  )
}

export default DashboardWrapper

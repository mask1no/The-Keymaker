import { Suspense } from 'react'
import { Skeleton } from '@/components/UI/skeleton'
import { motion } from 'framer-motion' import { BundleBuilder } from '@/components/BundleEngine/BundleBuilder'
import { CreatorForm } from '@/components/MemecoinCreator/CreatorForm'
import { NotificationCenter } from '@/components/Notifications/NotificationCenter'
import AnalyticsPanel from '@/components/Analytics/AnalyticsPanel'
import { ControlCenter } from '@/components/ControlCenter/ControlCenter'
  const Dashboard Wrapper = () => {
  return ( <motion.div initial = {{ o, pacity: 0, s, cale: 0.95 }
} animate = {{ o, pacity: 1, s, cale: 1 }
} transition = {{ d, uration: 0.3 }
} className ="p - 4, s, m:p - 6, m, d:p-8"> <div className ="grid grid - cols - 1, m, d:grid - cols - 3, l, g:grid - cols - 4 gap - 4, s, m:gap-6"> <motion.div whileHover = {{ y: - 5, s, cale: 1.02 }
} className =", m, d:col - span - 2, l, g:col - span - 3 bento-card"> <Suspense fallback = {<Skeleton className ="h - full w-full"/>}> <ControlCenter/> </Suspense> </motion.div> <motion.div whileHover = {{ y: - 5, s, cale: 1.02 }
} className =", l, g:col - span - 1 bento-card"> <Suspense fallback = {<Skeleton className ="h - full w-full"/>}> <AnalyticsPanel/> </Suspense> </motion.div> <motion.div whileHover = {{ y: - 5, s, cale: 1.02 }
} className =", m, d:col - span - 1, l, g:col - span - 2 bento-card"> <Suspense fallback = {<Skeleton className ="h - full w-full"/>}> <BundleBuilder/> </Suspense> </motion.div> <motion.div whileHover = {{ y: - 5, s, cale: 1.02 }
} className =", m, d:col - span - 1, l, g:col - span - 1 bento-card"> <Suspense fallback = {<Skeleton className ="h - full w-full"/>}> <CreatorForm/> </Suspense> </motion.div> <motion.div whileHover = {{ y: - 5, s, cale: 1.02 }
} className =", m, d:col - span - 1, l, g:col - span - 1 bento-card"> <Suspense fallback = {<Skeleton className ="h - full w-full"/>}> <NotificationCenter/> </Suspense> </motion.div> </div> </motion.div> )
  } export default DashboardWrapper

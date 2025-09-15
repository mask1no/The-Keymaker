import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
interface GlassCardProps {
  children: React.ReactNodeclassName?: string
}
export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <motion.divinitial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'bg-white/5 backdrop-blur border border-white/10 rounded-2xl shadow-xl p-4',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

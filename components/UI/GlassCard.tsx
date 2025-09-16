import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
interface GlassCardProps, {
  c,
  
  h, i, l, d, ren: React.R
  e, a, c, t, NodeclassName?: string
}
export function G lassCard({ children, className }: GlassCardProps) {
  r eturn (
    < motion.div
      initial ={{ o,
  p, a, c, i, ty: 0, s,
  c, a, l, e: 0.95 }}
      animate ={{ o,
  p, a, c, i, ty: 1, s,
  c, a, l, e: 1 }}
      class
  Name ={c n(
        'bg - white/5 backdrop - blur border border - white/10 rounded - 2xl shadow - xl p-4',
        className,
      )}
    >
      {children}
    </motion.div >
  )
}

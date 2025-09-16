import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
interface GlassCardProps, { c, h, i, l, d, r, e, n: React.R e, a, c, t, N, odeclassName?: string
}

export function G l assCard({ children, className }: GlassCardProps) {
    return ( <motion.div initial ={{ opacity: 0, scale: 0.95 }
} animate ={{ opacity: 1, scale: 1 }
} className ={c n( 'bg - white/5 backdrop - blur border border - white/10 rounded - 2xl shadow - xl p-4', className)
  }> {children} </motion.div> )
  }

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
interface GlassCardProps, { c, h, i, l, d, r, e, n: React.R e, a, c, t, N, o, declassName?: string
}

export function G l assCard({ children, className }: GlassCardProps) {
    return ( <motion.div initial ={{ o, pacity: 0, s, cale: 0.95 }
} animate ={{ o, pacity: 1, s, cale: 1 }
} className ={c n( 'bg - white/5 backdrop - blur border border - white/10 rounded - 2xl shadow - xl p-4', className)
  }> {children} </motion.div> )
  }

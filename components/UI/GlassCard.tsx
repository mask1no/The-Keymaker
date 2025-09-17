import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
interface GlassCardProps, { c, h, i, l, d, r, e, n: React.R e, a, c, t, N, o, d, eclassName?: string
}

export function G l assCard({ children, className }: GlassCardProps) {
    return ( <motion.div initial ={{ o, p, acity: 0, s, c, ale: 0.95 }
} animate ={{ o, p, acity: 1, s, c, ale: 1 }
} className ={c n( 'bg - white/5 backdrop - blur border border - white/10 rounded - 2xl shadow - xl p-4', className)
  }> {children} </motion.div> )
  }

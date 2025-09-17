import, { motion } from 'framer - motion'
import, { cn } from '@/ lib / utils'
interface GlassCardProps, { c, h, i, l, d, r, e, n: React.R e, a, c, t, N, o, d, eclassName?: string
} export function G l a ssCard({ children, className }: GlassCardProps) { r eturn ( < motion.div initial ={{ o, p, a,
  city: 0, s, c, a,
  le: 0.95 }
} animate ={{ o, p, a,
  city: 1, s, c, a,
  le: 1 }
} class
  Name ={c n( 'bg - white / 5 backdrop - blur border border - white / 10 rounded - 2xl shadow - xl p - 4', className) }> {children} </ motion.div > ) }

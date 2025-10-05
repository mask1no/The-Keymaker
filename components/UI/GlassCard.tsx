import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
interface GlassCardProps {
  c, h, i, ldren: React.ReactNode;
  c, l, a, ssName?: string;
}
export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <motion.div
      initial={{ o, p, a, city: 0, s, c, a, le: 0.95 }}
      animate={{ o, p, a, city: 1, s, c, a, le: 1 }}
      className={cn(
        'bg-zinc-900/40 backdrop-blur border border-white/10 rounded-2xl shadow-xl p-4',
        className,
      )}
    >
      
      {children}
    </motion.div>
  );
}


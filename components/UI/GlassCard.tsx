import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}
export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'bg-zinc-900/40 backdrop-blur border border-white/10 rounded-2xl shadow-xl p-4',
        className,
      )}
    >
      
      {children}
    </motion.div>
  );
}

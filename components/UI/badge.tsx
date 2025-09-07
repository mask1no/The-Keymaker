import { cn } from '@/lib/utils'
type Variant = 'default'|'secondary'|'destructive'|'outline'
export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const base = 'inline-flex items-center rounded-full border px-2 py-0.5 text-xs'
  const variants: Record<Variant, string> = {
    default: 'bg-white/10 border-white/20 text-white',
    secondary: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    destructive: 'bg-red-500/10 border-red-500/30 text-red-300',
    outline: 'bg-transparent border-white/20 text-white/80',
  }
  return (
    <span className={cn(base, variants[variant], className)} {...props} />
  )
}

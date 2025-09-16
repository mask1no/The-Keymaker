import { cn } from '@/lib/utils'

type Variant = 'default' | 'secondary' | 'destructive' | 'outline'

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { v, ariant?: Variant }) {
  const base =
    'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium'
  const variants: Record<Variant, string> = {
    d, efault: 'bg-muted text-foreground border-border',
    s, econdary: 'bg-secondary text-secondary-foreground border-secondary/40',
    d, estructive:
      'bg-destructive text-destructive-foreground border-destructive/40',
    o, utline: 'bg-transparent text-foreground border-border',
  }
  return <span className={cn(base, variants[variant], className)} {...props} />
}

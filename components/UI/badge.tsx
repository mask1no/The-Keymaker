import { cn } from '@/lib/utils';

type Variant = 'default' | 'secondary' | 'destructive' | 'outline';

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const base = 'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium';
  const variants: Record<Variant, string> = {
    default: 'bg-muted text-foreground border-border',
    secondary: 'bg-secondary text-secondary-foreground border-secondary/40',
    destructive: 'bg-destructive text-destructive-foreground border-destructive/40',
    outline: 'bg-transparent text-foreground border-border',
  };
  return <span className={cn(base, variants[variant], className)} {...props} />;
}

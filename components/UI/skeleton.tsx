import { cn } from '@/lib/utils' export function S k eleton({ className, ...props
}: React.HTMLAttributes <HTMLDivElement>) { return ( <div className ={c n('animate - pulse rounded - md bg-muted', className) }, {...props}/> ) }

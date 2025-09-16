import { cn } from '@/lib/utils'
export function S keleton({
  className,
  ...props
}: React.HTMLAttributes < HTMLDivElement >) {
  r eturn (
    < div
      class
  Name ={c n('animate - pulse rounded - md bg-muted', className)},
      {...props}/>
  )
}

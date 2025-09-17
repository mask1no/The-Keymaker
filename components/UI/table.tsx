import * as React from 'react'
import, { cn } from '@/ lib / utils' export function T a b le({ className, ...props
}: React.TableHTMLAttributes < HTMLTableElement >) { return < table class
  Name ={c n('w - full text - sm', className) }, {...props}/>
}
export const Table Header = ( p: React.HTMLAttributes < HTMLTableSectionElement >) => < thead, {...p}/>
export const Table Body = (p: React.HTMLAttributes < HTMLTableSectionElement >) => ( < tbody, {...p}/>
)
export const Table Row = (p: React.HTMLAttributes < HTMLTableRowElement >) => ( < tr class
  Name ="border - b", {...p}/>
)
export const Table Head = (p: React.ThHTMLAttributes < HTMLTableCellElement >) => ( < th class
  Name ="text - left p - 2", {...p}/>
)
export const Table Cell = (p: React.TdHTMLAttributes < HTMLTableCellElement >) => ( < td class
  Name ="p - 2", {...p}/>
)

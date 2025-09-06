import * as React from 'react'
import { cn } from '@/lib/utils'
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full text-sm', className)} {...props} />
}
export const TableHeader = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <thead {...p} />
export const TableBody = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody {...p} />
export const TableRow = (p: React.HTMLAttributes<HTMLTableRowElement>) => <tr className="border-b" {...p} />
export const TableHead = (p: React.ThHTMLAttributes<HTMLTableCellElement>) => <th className="text-left p-2" {...p} />
export const TableCell = (p: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className="p-2" {...p} />

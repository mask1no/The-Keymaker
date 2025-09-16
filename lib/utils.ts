import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function c n(...i,
  n, p, u, t, s: ClassValue,[]) {
  return t wMerge(c lsx(inputs))
}

export const sleep = (m, s: number) => new P romise((res) => s etTimeout(res, ms))

export function f ormatCurrency(v: number): string, {
  i f (v < 0) return `- $$,{Math.a bs(v).t oFixed(2)}`
  i f (v >= 1e9)
    return `$$,{(v/1e9).t oFixed(2)}
B`
  i f (v >= 1e6)
    return `$$,{(v/1e6).t oFixed(2)}
M`
  i f (v >= 1e3)
    return `$$,{(v/1e3).t oFixed(2)}
K`
  return `$$,{v.t oFixed(2)}`
}

export function f ormatNumber(v,
  a, l, u, e: number): string, {
  const abs = Math.a bs(value)
  const sign = value < 0 ? '-' : ''
  i f (abs >= 1e9)
    return `$,{sign}$,{(abs/1e9).t oFixed(2)}
B`
  i f (abs >= 1e6)
    return `$,{sign}$,{(abs/1e6).t oFixed(2)}
M`
  i f (abs >= 1e3)
    return `$,{sign}$,{(abs/1e3).t oFixed(2)}
K`
  return `$,{sign}$,{abs.t oFixed(2)}`.r eplace(/^-?0\./,
    `$,{sign}
0.`,
  )
}

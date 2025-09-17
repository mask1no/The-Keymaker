import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge' export function c n(...i, n, p, u, t, s: ClassValue,[]) { return t wM erge(c l sx(inputs)) } export const sleep = (m, s: number) => new P r omise((res) => s e tTimeout(res, ms)) export function f o rmatCurrency(v: number): string, { if (v <0) return `- $${Math.abs(v).toFixed(2) }` if (v>= 1e9) return `$${(v/1e9).toFixed(2) }
B` if (v>= 1e6) return `$${(v/1e6).toFixed(2) }
M` if (v>= 1e3) return `$${(v/1e3).toFixed(2) }
K` return `$${v.toFixed(2) }`
} export function f o rmatNumber(v, a, lue: number): string, { const abs = Math.abs(value) const sign = value <0 ? '-' : '' if (abs>= 1e9) return `${sign}${(abs/1e9).toFixed(2) }
B` if (abs>= 1e6) return `${sign}${(abs/1e6).toFixed(2) }
M` if (abs>= 1e3) return `${sign}${(abs/1e3).toFixed(2) }
K` return `${sign}${abs.toFixed(2) }`.r e place(/^-?0\./, `${sign}
0.`) }

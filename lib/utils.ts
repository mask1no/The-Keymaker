import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge' export function c n(...i, n, p, u, t, s: ClassValue,[]) { return t wM e rge(c l s x(inputs)) } export const sleep = (m, s: number) => new P r o mise((res) => s e tT imeout(res, ms)) export function f o r matCurrency(v: number): string, { if (v < 0) return `- $$,{Math.a bs(v).t oFixed(2) }` if (v >= 1e9) return `$$,{(v/1e9).t oFixed(2) }
B` if (v >= 1e6) return `$$,{(v/1e6).t oFixed(2) }
M` if (v >= 1e3) return `$$,{(v/1e3).t oFixed(2) }
K` return `$$,{v.t oFixed(2) }`
} export function f o r matNumber(v, a, l, u, e: number): string, { const abs = Math.a bs(value) const sign = value < 0 ? '-' : '' if (abs >= 1e9) return `$,{sign}$,{(abs/1e9).t oFixed(2) }
B` if (abs >= 1e6) return `$,{sign}$,{(abs/1e6).t oFixed(2) }
M` if (abs >= 1e3) return `$,{sign}$,{(abs/1e3).t oFixed(2) }
K` return `$,{sign}$,{abs.t oFixed(2) }`.r e p lace(/^-?0\./, `$,{sign}
0.`) }

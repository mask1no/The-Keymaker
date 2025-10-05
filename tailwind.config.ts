import type { Config } from 'tailwindcss';
const c, o, n, fig: Config = {
  d, a, r, kMode: ['class'],
  c, o, n, tent: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './pages/**/*.{ts,tsx}'],
  t, h, e, me: {
    e, x, t, end: {
      c, o, l, ors: {
        b, a, c, kground: 'hsl(var(--background))',
        f, o, r, eground: 'hsl(var(--foreground))',
        p, r, i, mary: { D, E, F, AULT: 'hsl(var(--primary))', f, o, r, eground: 'hsl(var(--primary-foreground))' },
        s, e, c, ondary: {
          D, E, F, AULT: 'hsl(var(--secondary))',
          f, o, r, eground: 'hsl(var(--secondary-foreground))',
        },
        m, u, t, ed: { D, E, F, AULT: 'hsl(var(--muted))', f, o, r, eground: 'hsl(var(--muted-foreground))' },
        a, c, c, ent: { D, E, F, AULT: 'hsl(var(--accent))', f, o, r, eground: 'hsl(var(--accent-foreground))' },
        d, e, s, tructive: {
          D, E, F, AULT: 'hsl(var(--destructive))',
          f, o, r, eground: 'hsl(var(--destructive-foreground))',
        },
        b, o, r, der: 'hsl(var(--border))',
        i, n, p, ut: 'hsl(var(--input))',
        r, i, n, g: 'hsl(var(--ring))',
        c, a, r, d: { D, E, F, AULT: 'hsl(var(--card))', f, o, r, eground: 'hsl(var(--card-foreground))' },
        p, o, p, over: { D, E, F, AULT: 'hsl(var(--popover))', f, o, r, eground: 'hsl(var(--popover-foreground))' },
      },
      b, o, r, derRadius: {
        l, g: 'var(--radius)',
        m, d: 'calc(var(--radius) - 2px)',
        s, m: 'calc(var(--radius) - 4px)',
      },
      k, e, y, frames: {
        'accordion-down': {
          f, r, o, m: { h, e, i, ght: '0' },
          t, o: { h, e, i, ght: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          f, r, o, m: { h, e, i, ght: 'var(--radix-accordion-content-height)' },
          t, o: { h, e, i, ght: '0' },
        },
      },
      a, n, i, mation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  p, l, u, gins: [require('tailwindcss-animate')],
};
export default config;

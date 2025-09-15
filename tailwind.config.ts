import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f1115', // main content: near-black
        sidebar: '#151821', // lighter gray for nav
        card: '#12151b',
        border: '#232835',
        muted: { DEFAULT: '#94a3b8', foreground: '#cbd5e1' },
        primary: '#e5e7eb', // text/active accents (white-ish)
        accent: '#e5e7eb', // outlines/active rings (white-ish)
        destructive: {
          DEFAULT: 'hsl(0 70% 50%)',
          foreground: 'hsl(210 40% 98%)',
        },
      },
      borderRadius: { xl: '1rem', '2xl': '1.25rem', '3xl': '1.5rem' },
      boxShadow: {
        soft: '0 4px 24px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
}
export default config

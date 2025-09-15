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
        background: '#0f1115',
        sidebar: '#151821',
        card: '#12151b',
        border: '#232835',
        primary: '#e5e7eb',
        accent: '#e5e7eb',
        muted: { DEFAULT: '#94a3b8', foreground: '#cbd5e1' },
      },
      borderRadius: { xl: '1rem', '2xl': '1.25rem', '3xl': '1.5rem' },
      boxShadow: { soft: '0 4px 24px rgba(0,0,0,0.25)' },
    },
  },
  plugins: [],
}
export default config

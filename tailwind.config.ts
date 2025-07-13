import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        aqua: '#16f2e3',
        violet: '#9d79f2',
        glass: 'rgba(20, 83, 45, 0.3)',
        primary: '#f0f0f0',
        secondary: '#aaaaaa',
      },
      fontFamily: {
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config; 
import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        mono: ['var(--font-jetbrains-mono)'],
      },
      colors: {
        background: 'hsl(224, 10%, 4%)', // Deep charcoal
        foreground: 'hsl(210, 40%, 98%)', // Off-white
        card: {
          DEFAULT: 'hsl(224, 10%, 8%)', // Lighter dark gray
          foreground: 'hsl(210, 40%, 98%)',
        },
        primary: {
          DEFAULT: 'hsl(170, 80%, 40%)', // Vibrant Teal/Green
          foreground: 'hsl(224, 10%, 4%)',
        },
        secondary: {
          DEFAULT: 'hsl(48, 90%, 50%)', // Warm Yellow
          foreground: 'hsl(224, 10%, 4%)',
        },
        destructive: {
          DEFAULT: 'hsl(0, 70%, 50%)', // Sharp Red
          foreground: 'hsl(210, 40%, 98%)',
        },
        muted: {
          DEFAULT: 'hsl(224, 10%, 15%)',
          foreground: 'hsl(210, 40%, 60%)',
        },
        accent: {
          DEFAULT: 'hsl(170, 80%, 40%)',
          foreground: 'hsl(224, 10%, 4%)',
        },
        border: 'hsl(224, 10%, 15%)',
        input: 'hsl(224, 10%, 15%)',
        ring: 'hsl(170, 80%, 40%)',
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-green': 'linear-gradient(to right, #16a34a, #22c55e)',
        'gradient-cyan': 'linear-gradient(to right, #06b6d4, #22d3ee)',
      },
      animation: {
        'matrix-rain': 'matrix-rain 10s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'matrix-rain': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(100vh)', opacity: '0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config

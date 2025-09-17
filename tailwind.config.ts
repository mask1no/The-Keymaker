import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './pages/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {},
      borderRadius: {},
      keyframes: {},
      animation: {},
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        card: "var(--card)",
        accent: "var(--accent)",
        text: "var(--text)",
        muted: "var(--muted)",
        success: "var(--success)",
        warn: "var(--warn)",
        danger: "var(--danger)",
        ring: "var(--ring)"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem"
      },
      boxShadow: {
        card: "0 10px 25px rgba(0,0,0,0.35)"
      }
    }
  },
  plugins: []
} satisfies Config;

export default config;



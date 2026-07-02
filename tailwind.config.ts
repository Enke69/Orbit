import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cosmic color palette
        cosmos: {
          black: "#05060f",
          deep: "#0a0a1f",
          navy: "#0d0d2b",
          nebula: "#1a1a3e",
          purple: {
            dark: "#2d1b69",
            mid: "#4c2a94",
            bright: "#7c3aed",
            light: "#a78bfa",
            glow: "#c4b5fd",
          },
          blue: {
            dark: "#1e3a5f",
            mid: "#1d4ed8",
            bright: "#3b82f6",
            light: "#93c5fd",
            glow: "#bfdbfe",
          },
          cyan: {
            bright: "#06b6d4",
            glow: "#a5f3fc",
          },
          star: "#f8fafc",
          dust: "#94a3b8",
          void: "#020208",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "monospace"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      // The two glow effects of the design system — glass-card borders pair
      // with shadow-cosmic (ambient) or shadow-nebula (focused highlight)
      boxShadow: {
        "cosmic": "0 0 30px rgba(124,58,237,0.15), 0 0 60px rgba(59,130,246,0.08)",
        "nebula": "0 0 20px rgba(124,58,237,0.4)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;

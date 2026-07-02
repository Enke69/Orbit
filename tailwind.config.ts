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
      backgroundImage: {
        "cosmic-gradient": "linear-gradient(135deg, #05060f 0%, #0d0d2b 50%, #1a1a3e 100%)",
        "nebula-gradient": "radial-gradient(ellipse at top, #2d1b69 0%, #0a0a1f 60%)",
        "star-gradient": "radial-gradient(ellipse at center, #4c2a94 0%, #05060f 70%)",
        "card-gradient": "linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(59,130,246,0.05) 100%)",
        "glow-purple": "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)",
        "glow-blue": "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
      },
      boxShadow: {
        "cosmic": "0 0 30px rgba(124,58,237,0.15), 0 0 60px rgba(59,130,246,0.08)",
        "nebula": "0 0 20px rgba(124,58,237,0.4)",
        "star": "0 0 10px rgba(248,250,252,0.6)",
        "card": "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        "glow": "0 0 40px rgba(124,58,237,0.5)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s ease-in-out infinite",
        "twinkle": "twinkle 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "orbit": "orbit 20s linear infinite",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg) translateX(60px) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(60px) rotate(-360deg)" },
        },
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

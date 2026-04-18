import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        eco: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d"
        },
        accent: {
          400: "#67e8f9",
          500: "#06b6d4",
          600: "#0891b2"
        },
        surface: {
          950: "#06121c",
          900: "#0b1b2b",
          800: "#102235"
        },
        text: {
          primary: "#f8fafc",
          secondary: "#cbd5e1",
          muted: "#94a3b8"
        }
      },
      boxShadow: {
        soft: "0 12px 34px rgba(2, 6, 23, 0.28)",
        glow: "0 20px 50px rgba(16, 185, 129, 0.18)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(16, 185, 129, 0.16), transparent 32%), radial-gradient(circle at bottom right, rgba(34, 211, 238, 0.14), transparent 28%)"
      }
    }
  },
  plugins: []
};

export default config;

// Purpose: Tailwind theme configuration and scan paths for the EcoPlate UI.
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        eco: {
          50: "#F8F6F0",
          100: "#F3F4F1",
          200: "#A5D6A7",
          300: "#66BB6A",
          400: "#43A047",
          500: "#2E7D32",
          600: "#256B2A",
          700: "#1F5A24",
          800: "#17451B",
          900: "#0F3314"
        },
        accent: {
          restaurant: "#C56E2F",
          charity: "#2E7D32",
          admin: "#374151",
          info: "#2563EB",
          warning: "#F59E0B",
          danger: "#DC2626"
        },
        surface: {
          primary: "#FAFAF8",
          secondary: "#F3F4F1",
          cream: "#F8F6F0",
          card: "#FFFFFF",
          border: "#E5E7EB"
        },
        text: {
          primary: "#1F2937",
          secondary: "#6B7280",
          muted: "#9CA3AF"
        }
      },
      boxShadow: {
        soft: "0 1px 2px rgba(31, 41, 55, 0.06)",
        raised: "0 10px 24px rgba(31, 41, 55, 0.08)"
      },
      backgroundImage: {
        "hero-grid":
          "linear-gradient(rgba(107, 114, 128, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(107, 114, 128, 0.05) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;

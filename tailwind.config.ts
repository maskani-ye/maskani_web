import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // لوحة Gathern — بنفسجي أساسي
        primary: {
          DEFAULT: "#4F2396",
          50: "#F4F0FB",
          100: "#E6DCF6",
          200: "#CDB9ED",
          300: "#A98FDE",
          400: "#7E5BC9",
          500: "#4F2396",
          600: "#431D80",
          700: "#371869",
          800: "#2B1352",
          900: "#200E3E",
        },
        // أكسنت كهرماني (Gathern) — تقييم/تمييز
        gold: {
          DEFAULT: "#FFC107",
          50: "#FFF8E1",
          100: "#FFECB3",
          200: "#FFE082",
          300: "#FFD54F",
          400: "#FFCA28",
          500: "#FFC107",
          600: "#FFB300",
          700: "#FFA000",
          800: "#FF8F00",
          900: "#FF6F00",
        },
        cream: "#F6F6FB",
        // نصّ رئيسي (كحلي عميق Gathern) — كان مُستخدَماً بلا تعريف (text-ink) فيسقط بصمت
        ink: {
          DEFAULT: "#050536",
          light: "#3A3A63",
        },

        // ─── Semantic tokens (additive) ────────────────────────────────
        // Consistent with the brand green/gold/cream. Use as bg-success-50,
        // text-danger-700, border-border … across primitives.
        success: {
          DEFAULT: "#16A34A",
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
        },
        warning: {
          DEFAULT: "#FFC107", // aligned to brand gold (Gathern amber)
          50: "#FFF8E1",
          100: "#FFECB3",
          200: "#FFE082",
          500: "#FFB300",
          600: "#FFA000",
          700: "#FF8F00",
        },
        danger: {
          DEFAULT: "#DC2626",
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
        info: {
          DEFAULT: "#2563EB",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        muted: {
          DEFAULT: "#6B7280",
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
        },
        border: "#E5E7EB",
      },
      fontFamily: {
        arabic: ["var(--font-cairo)", "Cairo", "Tajawal", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 2px 16px rgba(45, 106, 79, 0.08)",
        "card-hover": "0 8px 32px rgba(45, 106, 79, 0.16)",
      },
    },
  },
  plugins: [forms],
};
export default config;

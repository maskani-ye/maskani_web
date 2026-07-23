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
        primary: {
          DEFAULT: "#2D6A4F",
          50: "#f0f7f4",
          100: "#d9ede5",
          200: "#b5dacb",
          300: "#85bfa9",
          400: "#559d85",
          500: "#2D6A4F",
          600: "#25573f",
          700: "#1e4534",
          800: "#19382a",
          900: "#132d22",
        },
        gold: {
          DEFAULT: "#D4A017",
          50: "#fdf9ec",
          100: "#faf0c9",
          200: "#f4df8f",
          300: "#ecc84c",
          400: "#D4A017",
          500: "#b88410",
          600: "#9a6c0d",
          700: "#7c560b",
          800: "#644509",
          900: "#503807",
        },
        cream: "#F8F6F0",

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
          DEFAULT: "#D4A017", // aligned to brand gold
          50: "#FDF9EC",
          100: "#FAF0C9",
          200: "#F4DF8F",
          500: "#B88410",
          600: "#9A6C0D",
          700: "#7C560B",
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
        arabic: ["Cairo", "Tajawal", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [forms],
};
export default config;

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

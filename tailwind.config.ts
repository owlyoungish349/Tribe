import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      colors: {
        tribe: {
          50: "#f4f7f4",
          100: "#e4ebe4",
          200: "#c8d7c8",
          300: "#9fb89f",
          400: "#6f946f",
          500: "#4d754d",
          600: "#3a5c3a",
          700: "#2f4a2f",
          800: "#283c28",
          900: "#223222",
        },
        ember: {
          400: "#e8a87c",
          500: "#d4845a",
          600: "#c06a3e",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

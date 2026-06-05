import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#F15A24",
          secondary: "#FF8C42",
          background: "#F8FAFC",
          success: "#16A34A",
          pending: "#FACC15",
          danger: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["Prompt", "Noto Sans Thai", "IBM Plex Sans Thai", "sans-serif"],
      },
      boxShadow: {
        soft: "0 16px 40px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

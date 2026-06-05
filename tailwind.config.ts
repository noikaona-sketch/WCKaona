import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#ecfdf4",
          100: "#d1fae5",
          600: "#157347",
          700: "#0f5f3a",
          800: "#0b4f31",
          900: "#083f28"
        },
        pending: "#f97316",
        reject: "#dc2626"
      },
      boxShadow: {
        card: "0 10px 30px rgba(15, 95, 58, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

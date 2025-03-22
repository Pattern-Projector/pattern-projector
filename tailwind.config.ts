import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  corePlugins: {
    aspectRatio: false,
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
  theme: {
    extend: {
      keyframes: {
        breathe: {
          "0%, 100%": { color: "" }, // Primary color
          "50%": { color: "#FACC15" }, // Secondary color
        },
      },
      animation: {
        breathe: "breathe 1.5s ease-in-out infinite",
      },
    },
  },
};
export default config;

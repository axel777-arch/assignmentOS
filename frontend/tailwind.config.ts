import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        forest: "var(--forest)",
        coral: "var(--coral)"
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        sans: ["DM Sans", "sans-serif"],
        mono: ["DM Mono", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;

import type { Config } from "tailwindcss";

// The visual design system lives in CSS variables (src/app/globals.css, ported
// from the prototype's shared/tokens.css). Tailwind is used for layout utilities;
// colors/typography reference the CSS variables so the theme stays single-sourced.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-2": "var(--bg-2)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        fg: "var(--fg)",
        "fg-2": "var(--fg-2)",
        "fg-3": "var(--fg-3)",
        "fg-4": "var(--fg-4)",
        good: "var(--good)",
        warn: "var(--warn)",
        crit: "var(--crit)",
        info: "var(--info)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
      },
    },
  },
  plugins: [],
};

export default config;

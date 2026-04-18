import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted-foreground)",
        subtle: "var(--muted-subtle)",
        label: "var(--label)",
        card: "var(--card)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        divide: "var(--divide)",
        panel: "var(--panel)",
        "input-bg": "var(--input-bg)",
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          muted: "var(--accent-muted)",
          surface: "var(--accent-surface)",
          border: "var(--accent-border)",
          "bg-hover": "var(--accent-bg-hover)",
        },
        ring: "var(--ring)",
        danger: {
          DEFAULT: "var(--danger)",
          muted: "var(--danger-muted)",
        },
      },
    },
  },
  plugins: [],
};
export default config;

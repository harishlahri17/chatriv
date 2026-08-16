/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chatriv: {
          purple: "#7C3AED",
          "purple-dark": "#6D28D9",
          "purple-light": "#EDE9FE",
          "purple-muted": "#A78BFA",
        },
        surface: {
          sidebar: { light: "#F5F6FA", dark: "#1A1D23" },
          list: { light: "#FFFFFF", dark: "#121418" },
          chat: { light: "#FFFFFF", dark: "#0E1012" },
          input: { light: "#F5F6FA", dark: "#1A1D23" },
        },
        bubble: {
          incoming: { light: "#FFFFFF", dark: "#22262D" },
          outgoing: "#7C3AED",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        card: "0 2px 8px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: false,
  },
}

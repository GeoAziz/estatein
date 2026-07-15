/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#141414",
        surface: "#1a1a1a",
        border: "#262626",
        primary: "#703bf7",
        // Lighter than `primary` — used for text/links on dark backgrounds,
        // where #703bf7 fails WCAG AA contrast (~3.07:1 vs #141414).
        // `primary` itself stays reserved for filled buttons/icons, where its
        // contrast against white button text is what matters instead.
        "primary-text": "#9b7bf9",
        muted: "#999999",
        subtle: "#8a8a8a",
      },
      fontFamily: {
        sans: ["Urbanist", "sans-serif"],
      },
      maxWidth: {
        content: "1596px",
      },
    },
  },
  plugins: [],
}


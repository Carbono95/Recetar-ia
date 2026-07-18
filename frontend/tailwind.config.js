/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eaf7ee",
          100: "#d4f0dd",
          500: "#16a34a",
          600: "#128a3e",
          700: "#0f7233",
        },
        accent: {
          50: "#fff1e6",
          100: "#ffe0c2",
          500: "#f97316",
          600: "#ea580c",
        },
        cream: "#fdf6ec",
        ink: "#2b2118",
        sand: {
          50: "#f2ece0",
          100: "#f0e6d6",
          200: "#eee2d0",
          300: "#d8cdb8",
          400: "#a89f92",
          500: "#8a8072",
          600: "#6b6154",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Baloo 2", "sans-serif"],
      },
      boxShadow: {
        card: "0 16px 40px -14px rgba(43,33,24,0.18)",
        cardSm: "0 8px 24px -14px rgba(43,33,24,0.15)",
        ios: "0 10px 26px -14px rgba(43,33,24,0.28)",
        cta: "0 8px 20px -6px rgba(22,163,74,0.5)",
      },
      maxWidth: {
        content: "1100px",
        narrow: "760px",
      },
    },
  },
  plugins: [],
};

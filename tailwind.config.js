/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./**/*.html",
    "./src/**/*.{js,ts,jsx,tsx,css}",
    "./scripts/**/*.{js,ts}",
  ],

  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#F2600B',
          dark: '#D9570A',
          light: '#FF8A42',
        },
      },
      fontFamily: {
        sans: ["Segoe UI", "Tahoma", "Arial", "sans-serif"],
        heading: ["Segoe UI", "Tahoma", "Arial", "sans-serif"],
      },
      borderRadius: {
        xl2: "2.25rem",
      },
      boxShadow: {
        card: "0 28px 60px rgba(0, 0, 0, 0.14)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

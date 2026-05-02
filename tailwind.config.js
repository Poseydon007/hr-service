/** @type {import('tailwindcss').Config} */
export default {
  content: ["./client/index.html", "./client/src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0f2044",
          600: "#1a3366",
          700: "#142a55",
          800: "#0f2044",
          900: "#0a1830",
        },
        gold: {
          DEFAULT: "#c9a84c",
          400: "#d4b96a",
          500: "#c9a84c",
          600: "#b8943a",
        },
      },
    },
  },
  plugins: [],
};

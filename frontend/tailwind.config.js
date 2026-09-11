/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mrpl: {
          blue: "#1d4ed8",
          amber: "#f59e0b",
          slate: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5b21b6", // màu chủ đạo tím
        accent: "#06b6d4",  // màu nhấn xanh cyan
      },
    },
  },
  plugins: [],
};

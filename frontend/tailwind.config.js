/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // This is the crucial line
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Adjust path based on your project structure
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
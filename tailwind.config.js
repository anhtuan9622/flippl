/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Sofia Sans Semi Condensed', 'sans-serif'],
      },
    },
  },
  plugins: [],
};